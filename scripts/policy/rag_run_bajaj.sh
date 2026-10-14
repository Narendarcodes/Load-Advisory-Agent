# Runs inside the GPU container hx-loan-bajaj (rocm:latest). Stage 1 of the bajaj_v1 evaluation.
set -e
pip install -q -U transformers==5.19.0 sentence-transformers qdrant-client rank_bm25 pyyaml 2>&1 | grep -v -E "WARNING|dependency|requires" || true
python -c "import torch,transformers,sentence_transformers;print('VERSIONS',torch.__version__,transformers.__version__,sentence_transformers.__version__)"
cd /root/hx/loan/repo-bajaj && LOAN_POLICY_DIR=/root/hx/loan/policy python scripts/policy/eval_bajaj_retrieve.py
