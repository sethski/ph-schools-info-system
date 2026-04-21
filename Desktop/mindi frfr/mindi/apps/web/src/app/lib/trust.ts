// =============================================================================
// MINDI Phase 1 — Trust Middleware (Client-Side)
// Gate 1: Fast regex PII pre-scan (runs in browser before any network call)
// Gate 2: Calls Python boundaries.py via /api/boundaries for risk evaluation
// Gate 3: Blocks hard-forbidden actions immediately
//
// Trust Covenant:
//   - Never submit work without explicit user click
//   - Never impersonate user in real-time
//   - Never share brain without region-level consent
// =============================================================================

// ── PII Pre-scan (Gate 1) ───────────────────────────────────────────────────

const PII_PATTERNS: Array<{ name: string; regex: RegExp; replacement: string }> = [
  { name: 'email',       regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
  { name: 'ph_mobile',   regex: /(?:\+63|0)9\d{9}/g,                                   replacement: '[PHONE]' },
  { name: 'ph_sss',      regex: /\b\d{2}-\d{7}-\d\b/g,                                replacement: '[SSS_ID]' },
  { name: 'ph_tin',      regex: /\b\d{3}-\d{3}-\d{3}(?:-\d{3})?\b/g,                 replacement: '[TIN]' },
  { name: 'credit_card', regex: /\b(?:\d[ \-]?){13,19}\b/g,                           replacement: '[CARD]' },
  { name: 'ipv4',        regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,                       replacement: '[IP]' },
  { name: 'ph_passport', regex: /\bP[A-Z]\d{7}\b/g,                                   replacement: '[PASSPORT]' },
];

export interface PiiScanResult {
  redactedText: string;
  fieldsRemoved: string[];
  redactionCount: number;
  piiFound: boolean;
}

export function clientPiiScan(text: string): PiiScanResult {
  let result = text;
  const fieldsRemoved: string[] = [];
  let count = 0;

  for (const { name, regex, replacement } of PII_PATTERNS) {
    const matches = result.match(regex);
    if (matches?.length) {
      result = result.replace(regex, replacement);
      if (!fieldsRemoved.includes(name)) fieldsRemoved.push(name);
      count += matches.length;
    }
  }

  return { redactedText: result, fieldsRemoved, redactionCount: count, piiFound: count > 0 };
}

// ── Boundaries check (Gate 2 — calls Python backend) ──────────────────────

export interface BoundaryCheckResult {
  allowed: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  reason: string;
  requiresMfa: boolean;
  requiresApproval: boolean;
}

export async function checkBoundary(
  uid: string,
  action: string,
  idToken: string,
  opts: { mfaVerified?: boolean; userApproved?: boolean } = {}
): Promise<BoundaryCheckResult> {
  const res = await fetch('/api/boundaries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({
      uid,
      action,
      mfa_verified: opts.mfaVerified ?? false,
      user_approved: opts.userApproved ?? false,
    }),
  });

  if (!res.ok) {
    // Fail safe — deny on error
    return { allowed: false, riskLevel: null, reason: 'Boundary check failed', requiresMfa: true, requiresApproval: true };
  }

  return res.json();
}

// ── Hard-blocked actions (client-side fast-path) ──────────────────────────

const CLIENT_HARD_BLOCKED = new Set(['auto_submit', 'impersonate_user', 'send_without_preview']);

export function isHardBlocked(action: string): boolean {
  return CLIENT_HARD_BLOCKED.has(action);
}
