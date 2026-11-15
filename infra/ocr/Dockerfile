# Saral OCR sidecar: PaddleOCR PP-OCRv5 mobile on the GPU, loaded only when a document is read.
# Frappe runs Python 3.14, which Paddle has no wheels for, so OCR lives in its own small service.
FROM python:3.11-slim

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends libgomp1 libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

ARG PADDLE_INDEX=https://www.paddlepaddle.org.cn/packages/stable/cu126/
RUN pip install --no-cache-dir paddlepaddle-gpu==3.3.1 --index-url ${PADDLE_INDEX} --extra-index-url https://pypi.org/simple \
    && pip install --no-cache-dir paddleocr==3.7.0 "numpy>=1.26" pillow

ENV PADDLE_PDX_CACHE_HOME=/models \
    PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True \
    OCR_IDLE_SECONDS=300 \
    PYTHONUNBUFFERED=1

COPY server.py /app/server.py
EXPOSE 8866
CMD ["python", "/app/server.py"]
