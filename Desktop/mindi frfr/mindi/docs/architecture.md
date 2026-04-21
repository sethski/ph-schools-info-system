# Mindi Phase 1 — Architecture

## System Overview

```
Browser (Next.js 14 PWA)
  ↕ HTTPS / Firestore onSnapshot
Firebase (Auth, Firestore, Storage)
  ↕ Admin SDK
Next.js API Routes (Vercel Edge)
  ↕ X-Mindi-Secret header
Python FastAPI ML Backend (Firebase Cloud Functions)
  ↕ OPENROUTER_API_KEY (server-only)
OpenRouter API (Claude / Mistral)
```

## Data Flow: Upload → Brain Node

```
User drops file
  │
  ▼ [Browser]
1. FileReader reads text
2. clientPiiScan() — Gate 1 regex PII strip
3. POST /api/ingest  {text, fileName, …}
  │
  ▼ [Next.js API Route]
4. Verify Firebase ID token
5. Create IngestJob in Firestore (status: queued)
6. POST ML_BACKEND/pii/redact-batch — Gate 2 Presidio
7. POST ML_BACKEND/chunk/text — semantic chunking + dedup hashes
8. POST ML_BACKEND/tag/region — zero-shot classify region
9. POST ML_BACKEND/embed/generate — BGE-M3 embeddings
10. Write BrainNode to Firestore (metadata only)
11. Write embedding hashes to Firestore (vectors stay on client)
12. POST ML_BACKEND/style/extract — LLM + statistical profile
13. Update users/{uid}/style_fingerprint
14. POST ML_BACKEND/contradict/check — semantic conflict detection
15. Flag contradicting nodes (non-blocking)
16. Update IngestJob → status: complete
  │
  ▼ [Browser — Firestore onSnapshot]
17. New node appears in graph
18. Client fetches embeddings from server response
19. Store embeddings in IndexedDB (local only, never Firestore)
```

## Data Flow: RAG Chat Query

```
User types query
  │
  ▼ [Browser]
1. clientPiiScan() — Gate 1 PII strip
2. Load query embedding from IndexedDB (if cached)
   OR POST /api/embed-query → ML_BACKEND/embed/query
3. Cosine similarity against IndexedDB vectors → top-k nodeIds
4. POST /api/chat  {redactedQuery, relevantNodeIds, history}
  │
  ▼ [Next.js API Route]
5. Verify Firebase ID token
6. POST ML_BACKEND/pii/redact — Gate 2 on query
7. Load node content from Firestore (by nodeIds)
8. Build RAG prompt with style fingerprint + context
9. POST OpenRouter (claude-haiku-4) → style-aware answer
10. Parse citations [SOURCE N] → Citation objects
11. Write audit log (action: llm_call, piiRedacted: true)
12. Return {answer, citations, confidence, styleMatchScore}
  │
  ▼ [Browser]
13. Render answer + CitationBadge components
14. Show confidence score + style match %
```

## Security Architecture

```
Client                  Next.js API         ML Backend
────────────────────────────────────────────────────────
clientPiiScan()  ──►  verifyIdToken()   X-Mindi-Secret
regex Gate 1          Presidio Gate 2   boundaries.py
                       audit log         pii_redact.py
```

## Vector Storage Strategy

| Data              | Location     | Why                                      |
|-------------------|--------------|------------------------------------------|
| Embeddings        | IndexedDB    | Never leaves device — maximum privacy    |
| Embedding hashes  | Firestore    | Dedup check across devices               |
| Node metadata     | Firestore    | Real-time sync, search                   |
| Encrypted content | MongoDB GridFS | Zero-knowledge for personal region  |

## Model Routing

| Task              | Model                    | Rationale                    |
|-------------------|--------------------------|------------------------------|
| Style extraction  | claude-sonnet-4          | Best tone/nuance analysis    |
| RAG chat          | claude-haiku-4           | Fast, cheap, citation-aware  |
| Code analysis     | mistralai/mistral-large  | Code-optimized               |
| Classification    | mistralai/mistral-small  | Lightweight, fast            |
| BGE-M3 embeddings | Local Python             | Privacy + cost               |
