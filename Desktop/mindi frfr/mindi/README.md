# Mindi — Complete Codebase (All 4 Phases)

> *Your adaptive digital companion. Not a tool. Not a chatbot. A loyal extension of your mind.*

## What's inside

This is the **canonical merged codebase** — Phase 1 rebuilt with Python ML backend, fully wired through Phases 2–4.

## Phase summary

| Phase | Goal | Key additions |
|---|---|---|
| 1 | Foundation & Core Brain | Next.js PWA, Python FastAPI (BGE-M3, Presidio), RAG chat, 2FA |
| 2 | Intelligence & Automation | Proactivity, Second Me, Brain Link, Voice Q&A (Python PII-wired) |
| 3 | Multi-Platform & Collaboration | Electron, Capacitor, sync, brain-to-brain, browser extension, export |
| 4 | Polish & Launch | AmbientCanvas (style-driven), gestures, Simulate My Future, EN+TL, a11y |

## Python ML backend wired through all phases

| Phase | Integration |
|---|---|
| 2 Voice | Transcript → Python `/pii/redact` before RAG |
| 2 Proactivity | New nodes → Python `/proactivity/scan` (BGE-M3 + NLI contradiction) |
| 3 Collaboration | Admin sandbox creation via Python `/collab/create` |
| 4 Rating | AuthenticityRating → Python `/style/feedback` (updates style_match_score 80/20 weighted) |
| 4 AmbientCanvas | `writingRhythm` from Python `extract.py` drives particle speed |

## Datastore

- Backend NoSQL datastore: MongoDB (`MONGODB_URI`, `MONGODB_DB`) in `backend/functions`
- Firebase remains in use for client auth/session flows in the web app

## Quick start

```bash
cp .env .env.local                # fill MongoDB + Firebase Auth + OpenRouter + ML secret
bash scripts/setup.sh             # deps, Python venv, spaCy wheel install, Firebase rules
bash scripts/deploy-firebase.sh   # deploy Python Cloud Functions
bash scripts/build-web.sh dev     # http://localhost:3000
```

The setup script installs the spaCy model from the matching wheel directly, so you do not need to run `python3 -m spacy download en_core_web_sm` manually.
