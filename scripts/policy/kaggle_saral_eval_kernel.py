"""Kaggle GPU kernel for the Saral DeepEval baseline: RAG work ONLY (embedding, indexing, retrieval, reranking).

No LLM runs on Kaggle (user directive, 2026-11-04): no vLLM, no generator, no judge. The kernel embeds the cleaned
corpus v3 chunks (saral_nbfc_policy, rbi_regulatory), retrieves the final top 5 for every dev item of the golden set and
writes:
  results/retrieval.jsonl           per item: per-collection hits and the final top 5 (chunk id, doc id, collection, score)
  results/retrieved_contexts.jsonl  per item: the final top 5 with ids, scores and chunk text (input to generation/judge)
  results/retrieval_info.json, ir_metrics.jsonl, ir_summary.json (no-LLM recall@5 / MRR / nDCG), nvidia_smi_*.txt
Generation and the DeepEval judge then run from the Hark sandbox through OmniRoute (eval_saral_deepeval.py generate/judge).
Pushed as a private script kernel with GPU (2x T4) and internet, with the private dataset holding the chunks, the dev
split and the repo code it imports. No secrets are used.
"""
import json
import os
import shutil
import subprocess
import time
from pathlib import Path

OUT = Path("/kaggle/working/results"); OUT.mkdir(parents=True, exist_ok=True)
LOG = OUT / "kernel_log.txt"
T = {"start": time.time()}
os.environ.setdefault("HF_HOME", "/tmp/hf")
os.environ["TOKENIZERS_PARALLELISM"] = "false"


def log(msg):
    line = f"[{time.time() - T['start']:7.0f}s] {msg}"
    print(line, flush=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def sh(cmd, timeout=7200, check=True):
    t = time.time()
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
    log(f"$ {cmd}\n  rc={r.returncode} {time.time() - t:.0f}s\n{r.stdout[-3000:]}\n{r.stderr[-3000:]}")
    if check and r.returncode:
        raise RuntimeError(f"failed: {cmd}")
    return r


def find_data():
    for p in Path("/kaggle/input").rglob("golden.jsonl"):
        return p.parent
    raise FileNotFoundError("golden.jsonl not found under /kaggle/input")


def gpu_snapshot(name):
    r = subprocess.run("nvidia-smi; nvidia-smi --query-gpu=index,name,memory.used,memory.total --format=csv",
                       shell=True, capture_output=True, text=True)
    (OUT / f"nvidia_smi_{name}.txt").write_text(r.stdout)
    return r.stdout


def main():
    status = {"kind": "retrieval-only (no LLM on Kaggle)", "phases": {}}
    log(gpu_snapshot("start"))
    data = find_data()
    work = Path("/kaggle/working/repo")
    if work.exists():
        shutil.rmtree(work)
    tars = [t for t in Path("/kaggle/input").rglob("repo_code.tar.gz") if t.is_file()]
    if tars:
        work.mkdir(parents=True)
        sh(f"tar -xzf {tars[0]} -C {work}")
    else:  # Kaggle extracts archives on upload: find the tree that holds rag/retrieve.py
        src = next(Path("/kaggle/input").rglob("rag/retrieve.py")).parents[1]
        shutil.copytree(src, work)
    ev = work / "scripts/policy/eval_saral_deepeval.py"
    t = time.time()
    # retrieval needs transformers>=5.19 (EmbeddingGemma-2)
    sh("pip install -q rank_bm25 qdrant-client 'transformers>=5.19' 'sentence-transformers>=6.1' 2>&1 | tail -3", check=False)
    sh("python -c 'import sentence_transformers,transformers,torch;print(sentence_transformers.__version__,"
       "transformers.__version__,torch.__version__)'", check=False)
    status["phases"]["install_s"] = round(time.time() - t)
    t = time.time()
    r = sh(f"python {ev} retrieve --data {data} --repo {work} --out {OUT}", check=False)
    status["phases"]["retrieve_s"] = round(time.time() - t)
    log(gpu_snapshot("after_retrieval"))
    if r.returncode:
        status["blocked"] = "retrieval failed"
    else:
        sh(f"python {ev} ir --data {data} --repo {work} --out {OUT}", check=False)
        status["completed"] = True
    status["phases"]["total_s"] = round(time.time() - T["start"])
    (OUT / "status.json").write_text(json.dumps(status, indent=1))
    shutil.rmtree(OUT / "qdrant", ignore_errors=True)


try:
    main()
except Exception as e:
    log(f"FATAL {type(e).__name__}: {e}")
    st = OUT / "status.json"
    s = json.loads(st.read_text()) if st.exists() else {}
    s["fatal"] = f"{type(e).__name__}: {e}"
    st.write_text(json.dumps(s, indent=1))
