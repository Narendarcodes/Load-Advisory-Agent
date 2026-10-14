set -e
pip install -q -U transformers==5.19.0 sentence-transformers qdrant-client rank_bm25 pyyaml 2>&1 | grep -v -E "WARNING|dependency|requires" || true
python -c "import torch,transformers,sentence_transformers;print('VERSIONS',torch.__version__,transformers.__version__,sentence_transformers.__version__)"
cd /root/hx/loan/repo && LOAN_DATA_DIR=/root/hx/loan/data python scripts/policy/eval_rag.py
