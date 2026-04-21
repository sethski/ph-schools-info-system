# =============================================================================
# MINDI Phase 1 — ONNX Export for Local Offline Fallback
# Run once to export BGE-M3 to ONNX format for client-side inference.
# The exported model is served via the PWA for offline semantic search.
#
# Usage:
#   python backend/functions/src/embeddings/onnx_export.py
#
# Output: models/bge-m3-onnx/ (excluded from git via .gitignore)
# =============================================================================

import os
from pathlib import Path
from loguru import logger

OUTPUT_DIR = Path("models/bge-m3-onnx")
MODEL_NAME = "BAAI/bge-m3"


def export_to_onnx():
    """
    Export BGE-M3 to ONNX format for client-side ONNX Runtime inference.
    This enables offline embedding generation in the PWA.
    """
    try:
        from sentence_transformers import SentenceTransformer
        from optimum.exporters.onnx import main_export
    except ImportError:
        logger.error("Install optimum: pip install optimum[exporters]")
        raise

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"Exporting {MODEL_NAME} to ONNX at {OUTPUT_DIR}")

    main_export(
        model_name_or_path=MODEL_NAME,
        output=str(OUTPUT_DIR),
        task="feature-extraction",
        opset=17,
        optimize="O2",   # Good balance of speed vs accuracy
    )

    logger.info(f"ONNX export complete: {OUTPUT_DIR}")
    logger.info("Deploy to MongoDB GridFS for PWA download:")
    # logger.info(f"  python upload_to_mongo.py {OUTPUT_DIR}/")


if __name__ == "__main__":
    export_to_onnx()
