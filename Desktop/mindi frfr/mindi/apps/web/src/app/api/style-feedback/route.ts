// =============================================================================
// MINDI — POST /api/style-feedback
// Proxy to Python /style/feedback. Keeps ML_BACKEND_SECRET server-side.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../../lib/firebase-admin';

const ML  = process.env.NEXT_PUBLIC_ML_BACKEND_URL ?? 'http://localhost:8000';
const SEC = process.env.ML_BACKEND_SECRET ?? '';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { await adminAuth.verifyIdToken(auth.slice(7)); }
  catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

  const body = await req.json();
  const res  = await fetch(`${ML}/style/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Mindi-Secret': SEC },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
