# =============================================================================
# MINDI Phase 1 — Security: PII Redaction
# Two-gate pipeline:
#   Gate 1 (client): TypeScript regex pre-scan (trust.ts)
#   Gate 2 (here): Microsoft Presidio + custom PH patterns
#
# Presidio NLP engine: spacy en_core_web_sm
# Custom recognizers: PH mobile, SSS, TIN, PhilHealth, Passport
#
# Trust Covenant: PII is stripped BEFORE any OpenRouter call.
# Original content is preserved locally; only redacted version leaves device.
# =============================================================================

import re
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from loguru import logger

router = APIRouter()


# ---------------------------------------------------------------------------
# Philippine-specific PII patterns (not in Presidio by default)
# ---------------------------------------------------------------------------

PH_PATTERNS = [
    # PH mobile: 09XXXXXXXXX or +639XXXXXXXXX
    (r'(?:\+63|0)9\d{9}', '[PH_PHONE]'),
    # SSS: XX-XXXXXXX-X
    (r'\b\d{2}-\d{7}-\d\b', '[SSS_ID]'),
    # TIN: XXX-XXX-XXX or XXX-XXX-XXX-XXX
    (r'\b\d{3}-\d{3}-\d{3}(?:-\d{3})?\b', '[TIN]'),
    # PhilHealth: XX-XXXXXXXXX-X
    (r'\b\d{2}-\d{9}-\d\b', '[PHILHEALTH_ID]'),
    # PH Passport: PxxxxxxX format
    (r'\bP[A-Z]\d{7}\b', '[PASSPORT]'),
    # Credit card (basic)
    (r'\b(?:\d[ \-]?){13,19}\b', '[CARD_NUMBER]'),
    # IPv4
    (r'\b(?:\d{1,3}\.){3}\d{1,3}\b', '[IP_ADDRESS]'),
]


def apply_custom_patterns(text: str) -> tuple[str, List[str]]:
    """Apply Philippine-specific patterns before Presidio."""
    fields_removed = []
    for pattern, replacement in PH_PATTERNS:
        matches = re.findall(pattern, text)
        if matches:
            text = re.sub(pattern, replacement, text)
            label = replacement.strip('[]')
            if label not in fields_removed:
                fields_removed.append(label)
    return text, fields_removed


def apply_presidio(text: str) -> tuple[str, List[str]]:
    """Run Microsoft Presidio NLP-based PII detection."""
    try:
        from presidio_analyzer import AnalyzerEngine
        from presidio_anonymizer import AnonymizerEngine
        from presidio_anonymizer.entities import OperatorConfig

        analyzer = AnalyzerEngine()
        anonymizer = AnonymizerEngine()

        results = analyzer.analyze(
            text=text,
            language="en",
            entities=[
                "PERSON",
                "EMAIL_ADDRESS",
                "PHONE_NUMBER",
                "CREDIT_CARD",
                "US_SSN",
                "IBAN_CODE",
                "IP_ADDRESS",
                "URL",
                "NRP",  # Nationality, Religious, Political
            ],
        )

        if not results:
            return text, []

        operators = {
            "PERSON":        OperatorConfig("replace", {"new_value": "[NAME]"}),
            "EMAIL_ADDRESS": OperatorConfig("replace", {"new_value": "[EMAIL]"}),
            "PHONE_NUMBER":  OperatorConfig("replace", {"new_value": "[PHONE]"}),
            "CREDIT_CARD":   OperatorConfig("replace", {"new_value": "[CARD]"}),
            "US_SSN":        OperatorConfig("replace", {"new_value": "[ID_NUMBER]"}),
            "IBAN_CODE":     OperatorConfig("replace", {"new_value": "[BANK_ACCOUNT]"}),
            "IP_ADDRESS":    OperatorConfig("replace", {"new_value": "[IP]"}),
            "URL":           OperatorConfig("keep"),  # URLs are generally not PII
            "NRP":           OperatorConfig("replace", {"new_value": "[IDENTITY]"}),
        }

        anonymized = anonymizer.anonymize(
            text=text,
            analyzer_results=results,
            operators=operators,
        )

        fields = list({r.entity_type for r in results})
        return anonymized.text, fields

    except ImportError:
        logger.warning("Presidio not available — using regex fallback only")
        return text, []
    except Exception as e:
        logger.error(f"Presidio error (non-blocking): {e}")
        return text, []


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RedactRequest(BaseModel):
    text: str
    uid: str
    context: str = "general"    # "ingest" | "rag_query" | "general"


class RedactResponse(BaseModel):
    redacted_text: str
    fields_removed: List[str]
    redaction_count: int
    pii_found: bool


class RedactBatchRequest(BaseModel):
    texts: List[str]
    uid: str
    context: str = "ingest"


class RedactBatchResponse(BaseModel):
    results: List[RedactResponse]
    total_redactions: int


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/redact", response_model=RedactResponse)
async def redact_text(req: RedactRequest) -> RedactResponse:
    """
    Two-gate PII redaction.
    Gate 1: Custom PH patterns (fast regex)
    Gate 2: Microsoft Presidio NLP (catches names, emails, etc.)
    """
    if not req.text.strip():
        return RedactResponse(
            redacted_text=req.text,
            fields_removed=[],
            redaction_count=0,
            pii_found=False,
        )

    # Gate 1: Custom PH patterns
    text, ph_fields = apply_custom_patterns(req.text)

    # Gate 2: Presidio
    text, presidio_fields = apply_presidio(text)

    all_fields = list(set(ph_fields + presidio_fields))
    total = len(ph_fields) + len(presidio_fields)

    if total > 0:
        logger.info(
            f"PII redacted for {req.uid}: "
            f"{total} items removed ({', '.join(all_fields)})"
        )

    return RedactResponse(
        redacted_text=text,
        fields_removed=all_fields,
        redaction_count=total,
        pii_found=total > 0,
    )


@router.post("/redact-batch", response_model=RedactBatchResponse)
async def redact_batch(req: RedactBatchRequest) -> RedactBatchResponse:
    """Batch redact multiple chunks (used in ingest pipeline)."""
    if not req.texts:
        raise HTTPException(status_code=400, detail="texts is empty")

    results = []
    total = 0

    for text in req.texts:
        t, ph_fields = apply_custom_patterns(text)
        t, presidio_fields = apply_presidio(t)
        all_fields = list(set(ph_fields + presidio_fields))
        count = len(ph_fields) + len(presidio_fields)
        total += count
        results.append(RedactResponse(
            redacted_text=t,
            fields_removed=all_fields,
            redaction_count=count,
            pii_found=count > 0,
        ))

    return RedactBatchResponse(results=results, total_redactions=total)
