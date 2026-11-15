"""Thread-safe, lazy process-level cache for read-only RAG model instances.
This module intentionally imports no ML frameworks and loads no model at import time.
"""
from __future__ import annotations
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
import math
import os
import threading

GIB = 1024 ** 3
MEMORY_SAFETY_MARGIN_ENV = "AGENT_MODEL_MEMORY_SAFETY_MARGIN_RATIO"
DEFAULT_MEMORY_SAFETY_MARGIN_RATIO = 0.50
# Tensor-element counts from the inspected local model artifacts. They are used
# only for capacity estimates; they do not establish the revision used to build
# any index and do not pin the serving model to a cached snapshot.
MODEL_PARAMETER_COUNTS = {
    "google/embeddinggemma-2": 271_002_624,  # text-only v3 model config
    "BAAI/bge-reranker-v2-m3": 567_755_777,
}
FP32_EMBEDDING_WEIGHT_BYTES = MODEL_PARAMETER_COUNTS["google/embeddinggemma-2"] * 4
FP32_RERANKER_WEIGHT_BYTES = MODEL_PARAMETER_COUNTS["BAAI/bge-reranker-v2-m3"] * 4
FP32_RETRIEVAL_PAIR_THEORETICAL_WEIGHT_BYTES = (
    FP32_EMBEDDING_WEIGHT_BYTES + FP32_RERANKER_WEIGHT_BYTES
)
# Kept as a compatibility alias for the prior Phase 1 estimate.
FP32_RETRIEVAL_PAIR_ESTIMATE_BYTES = FP32_RETRIEVAL_PAIR_THEORETICAL_WEIGHT_BYTES


class ModelInitializationError(RuntimeError):
    """A configured retrieval model could not be initialized."""


class InsufficientModelMemoryError(ModelInitializationError):
    """A model preflight could not prove that enough system memory is available."""


class ModelMemoryConfigurationError(ModelInitializationError):
    """The memory estimate cannot be trusted for the configured model or margin."""


def available_system_memory_bytes() -> int | None:
    """Return free/available host RAM, or None when the reporter is unreliable.

    psutil is optional at import time, but model loading fails closed if it is
    unavailable: absence of a measurement is not evidence of sufficient memory.
    """
    try:
        import psutil
        available = psutil.virtual_memory().available
        value = int(available)
    except Exception:
        return None
    return value if value >= 0 else None


def _freeze(value):
    """Convert supported loading configuration into a stable, hashable value."""
    if isinstance(value, Mapping):
        return tuple(sorted(((str(key), _freeze(item)) for key, item in value.items()),
                            key=lambda pair: pair[0]))
    if isinstance(value, (list, tuple)):
        return tuple(_freeze(item) for item in value)
    if isinstance(value, (set, frozenset)):
        return tuple(sorted((_freeze(item) for item in value), key=repr))
    if isinstance(value, Path):
        return ("path", str(value))
    try:
        hash(value)
    except TypeError:
        return (type(value).__qualname__, repr(value))
    if type(value).__module__.startswith("torch") or type(value).__name__ == "dtype":
        return str(value)
    return value


@dataclass(frozen=True)
class ModelCacheKey:
    kind: str
    model_id: str
    revision: str | None
    device: str
    precision: str
    loading_config: tuple

    @classmethod
    def create(cls, *, kind: str, model_id: str, revision: str | None, device: str,
               precision: str, loading_config=None) -> "ModelCacheKey":
        return cls(kind=str(kind), model_id=str(model_id),
                   revision=str(revision) if revision is not None else None,
                   device=str(device), precision=str(precision),
                   loading_config=_freeze(loading_config or {}))


@dataclass(frozen=True)
class ModelMemoryRequirement:
    key: ModelCacheKey
    model_id: str
    parameter_count: int | None
    bytes_per_parameter: int

    @property
    def theoretical_weight_bytes(self) -> int | None:
        if self.parameter_count is None or self.parameter_count <= 0:
            return None
        if self.bytes_per_parameter <= 0:
            return None
        return self.parameter_count * self.bytes_per_parameter


def _memory_pressure(exc: BaseException) -> bool:
    if isinstance(exc, MemoryError):
        return True
    text = f"{type(exc).__name__}: {exc}".lower()
    return any(marker in text for marker in (
        "out of memory", "not enough memory", "cannot allocate memory",
        "could not allocate", "paging file is too small", "resource exhausted",
    ))


class ModelManager:
    """Lazily create each compatible model configuration once per process."""
    def __init__(self, available_memory: Callable[[], int | None] | None = None):
        self._models: dict[ModelCacheKey, object] = {}
        self._locks: dict[ModelCacheKey, threading.Lock] = {}
        self._guard = threading.RLock()
        self._available_memory = available_memory or available_system_memory_bytes

    @staticmethod
    def cache_key(*, kind: str, model_id: str, revision: str | None, device: str,
                  precision: str, loading_config=None) -> ModelCacheKey:
        return ModelCacheKey.create(kind=kind, model_id=model_id, revision=revision,
                                    device=device, precision=precision,
                                    loading_config=loading_config)

    @staticmethod
    def _margin_ratio(value: float | None) -> float:
        if value is None:
            raw = os.environ.get(MEMORY_SAFETY_MARGIN_ENV)
            value = DEFAULT_MEMORY_SAFETY_MARGIN_RATIO if raw is None else raw
        try:
            ratio = float(value)
        except (TypeError, ValueError, OverflowError) as exc:
            raise ModelMemoryConfigurationError(
                f"Invalid {MEMORY_SAFETY_MARGIN_ENV}={value!r}; configure a finite, "
                "non-negative ratio (for example 0.50 for 50%). Refusing model loading."
            ) from exc
        if not math.isfinite(ratio) or ratio < 0:
            raise ModelMemoryConfigurationError(
                f"Invalid {MEMORY_SAFETY_MARGIN_ENV}={value!r}; configure a finite, "
                "non-negative ratio (for example 0.50 for 50%). Refusing model loading."
            )
        return ratio

    def ensure_memory_available(self, *, requirements: Sequence[ModelMemoryRequirement],
                                model_label: str,
                                safety_margin_ratio: float | None = None) -> None:
        """Fail closed before any uncached model constructor or dense-index open.

        The estimate is parameter-count x requested dtype size, with an explicit
        configurable margin for runtime overhead. Cached instances are excluded
        because they do not need another model load.
        """
        with self._guard:
            pending = [requirement for requirement in requirements
                       if requirement.key not in self._models]
        if not pending:
            return

        ratio = self._margin_ratio(safety_margin_ratio)
        estimates = [(item.model_id, item.theoretical_weight_bytes) for item in pending]
        unknown = [model_id for model_id, weight_bytes in estimates if weight_bytes is None]
        if unknown:
            raise ModelMemoryConfigurationError(
                f"Refusing to initialize {model_label}: no reviewed theoretical weight "
                f"estimate is configured for model(s) {unknown!r}. No model constructor "
                "was called. Add an explicit estimate for the configured model; no "
                "alternate model, precision, device, or automatic bypass is selected."
            )

        theoretical_bytes = sum(weight_bytes for _, weight_bytes in estimates)
        estimated_runtime_bytes = math.ceil(theoretical_bytes * (1.0 + ratio))
        model_names = ", ".join(model_id for model_id, _ in estimates)
        try:
            available = self._available_memory()
        except Exception as exc:
            available = None
            detection_error = f"{type(exc).__name__}: {exc}"
        else:
            detection_error = "the memory reporter returned no value"
        if (isinstance(available, bool) or not isinstance(available, (int, float))
                or not math.isfinite(float(available)) or available < 0):
            raise InsufficientModelMemoryError(
                f"Refusing to initialize {model_label} ({model_names}): currently "
                f"available system memory could not be determined ({detection_error}). "
                f"Theoretical weight memory: {theoretical_bytes / GIB:.2f} GiB; "
                f"estimated runtime memory requirement: {estimated_runtime_bytes / GIB:.2f} "
                f"GiB (including {ratio:.0%} safety margin); currently available system "
                "memory: UNKNOWN. Verify psutil/OS memory reporting and retry. No model "
                "constructor was called; no alternate precision, device, or model and no "
                "automatic bypass are selected."
            )
        available_bytes = int(available)
        if available_bytes < estimated_runtime_bytes:
            per_model = ", ".join(
                f"{model_id}={weight_bytes / GIB:.2f} GiB"
                for model_id, weight_bytes in estimates
            )
            raise InsufficientModelMemoryError(
                f"Refusing to initialize {model_label}: requirement failed for {model_names}. "
                f"Theoretical weight memory: {theoretical_bytes / GIB:.2f} GiB "
                f"({per_model}); estimated runtime memory requirement: "
                f"{estimated_runtime_bytes / GIB:.2f} GiB (including {ratio:.0%} safety "
                f"margin); currently available system memory: {available_bytes / GIB:.2f} "
                "GiB. Free system memory or increase available RAM, then retry. No alternate "
                "precision, device, or model and no automatic bypass are selected."
            )

    def get_or_create(self, *, kind: str, model_id: str, revision: str | None,
                      device: str, precision: str, loading_config=None,
                      factory: Callable[[], object]):
        key = self.cache_key(kind=kind, model_id=model_id, revision=revision,
                             device=device, precision=precision,
                             loading_config=loading_config)
        with self._guard:
            lock = self._locks.setdefault(key, threading.Lock())
        with lock:
            with self._guard:
                if key in self._models:
                    return self._models[key]
            try:
                model = factory()
                if model is None:
                    raise RuntimeError("model constructor returned None")
            except Exception as exc:
                memory_note = (
                    " Memory pressure is a likely cause; no lower precision or "
                    "alternate model was selected."
                    if _memory_pressure(exc) else " No alternate precision or model was selected."
                )
                raise ModelInitializationError(
                    f"Could not initialize {kind} model {model_id!r} at revision "
                    f"{revision!r} on {device} with {precision}: "
                    f"{type(exc).__name__}: {exc}.{memory_note}"
                ) from exc
            with self._guard:
                self._models[key] = model
            return model

    def clear(self) -> None:
        """Clear cached instances; intended for isolated tests and process teardown."""
        with self._guard:
            self._models.clear()
            self._locks.clear()
