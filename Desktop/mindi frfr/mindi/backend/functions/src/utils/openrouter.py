# =============================================================================
# MINDI Phase 1 — Utils: OpenRouter API Client (Python)
# Routes LLM calls with model selection + retry logic.
# ALL calls go through this function — never direct from other modules.
# piiRedacted enforcement: callers MUST pass pii_redacted=True.
# =============================================================================

import os
from typing import Optional
import httpx
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

OPENROUTER_BASE = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
APP_URL = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
APP_NAME = os.getenv("OPENROUTER_APP_NAME", "Mindi")
DEFAULT_MODEL = os.getenv("OPENROUTER_MODEL")

# Model routing by task
MODEL_ROUTING = {
    "style_extraction": os.getenv("OPENROUTER_STYLE_EXTRACTION_MODEL") or DEFAULT_MODEL or "anthropic/claude-sonnet-4",
    "rag_chat": os.getenv("OPENROUTER_RAG_CHAT_MODEL") or DEFAULT_MODEL or "anthropic/claude-haiku-4",
    "code_analysis": os.getenv("OPENROUTER_CODE_ANALYSIS_MODEL") or DEFAULT_MODEL or "mistralai/mistral-large",
    "classification": os.getenv("OPENROUTER_CLASSIFICATION_MODEL") or DEFAULT_MODEL or "mistralai/mistral-small",
    "pii_guard_fallback": os.getenv("OPENROUTER_PII_GUARD_MODEL") or DEFAULT_MODEL or "mistralai/mistral-small",
}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def call_openrouter(
    system: str,
    user: str,
    model: str = os.getenv("OPENROUTER_RAG_CHAT_MODEL") or DEFAULT_MODEL or "anthropic/claude-haiku-4",
    max_tokens: int = 1000,
    temperature: float = 0.3,
    pii_redacted: bool = True,
) -> str:
    """
    Make an OpenRouter API call.
    Trust Covenant: pii_redacted MUST be True — enforced at call site.
    Retries up to 3 times with exponential backoff.
    """
    if not pii_redacted:
        raise ValueError(
            "[MINDI TRUST VIOLATION] OpenRouter call blocked: "
            "pii_redacted must be True. Run PII redaction first."
        )

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY not configured")

    payload = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{OPENROUTER_BASE}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": APP_URL,
                "X-Title": APP_NAME,
            },
            json=payload,
        )

    if response.status_code != 200:
        logger.error(f"OpenRouter error {response.status_code}: {response.text[:200]}")
        response.raise_for_status()

    data = response.json()
    content = data["choices"][0]["message"]["content"]
    logger.debug(
        f"OpenRouter call: model={model}, "
        f"tokens={data.get('usage', {}).get('total_tokens', '?')}"
    )
    return content
