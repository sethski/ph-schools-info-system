// =============================================================================
// MINDI — POST /api/proactivity-scan
// Proxy between client and Python ML backend proactivity scanner.
// Keeps ML_BACKEND_SECRET server-side; client never sees it.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../../lib/firebase-admin';

const ML_URL    = process.env.NEXT_PUBLIC_ML_BACKEND_URL ?? 'http://localhost:8000';
const ML_SECRET = process.env.ML_BACKEND_SECRET ?? '';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await adminAuth.verifyIdToken(auth.slice(7));
  } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

  const body = await req.json();
  const res = await fetch(`${ML_URL}/proactivity/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Mindi-Secret': ML_SECRET },
    body: JSON.stringify({ uid: body.uid, node_ids: body.nodeIds ?? [] }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
