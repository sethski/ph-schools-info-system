# =============================================================================
# MINDI — FastAPI ML Backend (All Phases)
# Phase 1: embeddings, style, nlp, security, utils
# Phase 2: proactivity
# Phase 3: collaboration
# Phase 4: style feedback
# =============================================================================
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from embeddings.generate import router as embed_r
from style.extract import router as style_r
from style.feedback import router as feedback_r
from nlp.chunk import router as chunk_r
from nlp.tag import router as tag_r
from nlp.contradict import router as contra_r
from security.pii_redact import router as pii_r
from security.boundaries import router as bounds_r
from proactivity.scan import router as proac_r
from collaboration.sandbox import router as collab_r
from utils.mongo_db import init_mongo
from utils.logging import setup_logging

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(); init_mongo()
    logger.info("Mindi ML Backend — all phases active")
    yield

app = FastAPI(title="Mindi ML Backend", version="1.0.0", lifespan=lifespan,
              docs_url="/docs" if os.getenv("NODE_ENV")!="production" else None, redoc_url=None)

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:3000", os.getenv("NEXT_PUBLIC_APP_URL","http://localhost:3000")],
    allow_credentials=True, allow_methods=["POST","GET"], allow_headers=["*"])

SECRET = os.getenv("ML_BACKEND_SECRET","")
def verify(x_mindi_secret: str = Header(...)):
    if not SECRET or x_mindi_secret != SECRET:
        raise HTTPException(401, "Invalid service secret")
    return True
D = [Depends(verify)]

# Phase 1
app.include_router(embed_r,    prefix="/embed",      tags=["Embeddings"],    dependencies=D)
app.include_router(style_r,    prefix="/style",      tags=["Style"],         dependencies=D)
app.include_router(chunk_r,    prefix="/chunk",      tags=["NLP"],           dependencies=D)
app.include_router(tag_r,      prefix="/tag",        tags=["NLP"],           dependencies=D)
app.include_router(contra_r,   prefix="/contradict", tags=["NLP"],           dependencies=D)
app.include_router(pii_r,      prefix="/pii",        tags=["Security"],      dependencies=D)
app.include_router(bounds_r,   prefix="/boundaries", tags=["Security"],      dependencies=D)
# Phase 2
app.include_router(proac_r,    prefix="/proactivity",tags=["Proactivity"],   dependencies=D)
# Phase 3
app.include_router(collab_r,   prefix="/collab",     tags=["Collaboration"], dependencies=D)
# Phase 4
app.include_router(feedback_r, prefix="/style",      tags=["Style"],         dependencies=D)

@app.get("/health")
async def health(): return {"status":"ok","service":"mindi-ml-backend","version":"1.0.0"}
