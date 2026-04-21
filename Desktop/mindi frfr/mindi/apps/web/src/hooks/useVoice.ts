// =============================================================================
// MINDI — useVoice Hook (Phase 2 — wired to Python ML backend)
// Pipeline: STT → Python /pii/redact → RAG /api/chat → TTS
// Python PII gate runs on voice transcript before it reaches OpenRouter.
// voice-agents: pipeline STT→LLM→TTS, latency budget 2s total.
// =============================================================================
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../app/auth/useAuth';

const ML_BACKEND_URL = process.env.NEXT_PUBLIC_ML_BACKEND_URL ?? 'http://localhost:8000';
const MAX_RECORDING_MS = 30_000;
const VOICE_CONSENT_KEY = 'mindi_voice_consent';

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceState {
  status: VoiceStatus;
  transcript: string;
  response: string;
  error: string | null;
  latencyMs: number | null;
  consentGiven: boolean;
}

export function useVoice() {
  const { user } = useAuth();
  const [state, setState] = useState<VoiceState>({
    status: 'idle', transcript: '', response: '',
    error: null, latencyMs: null, consentGiven: false,
  });

  const recRef  = useRef<any | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const t0Ref   = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition: any }).webkitSpeechRecognition;
    if (SR) {
      recRef.current = new SR();
      recRef.current.continuous = false;
      recRef.current.interimResults = false;
    }
    synthRef.current = window.speechSynthesis;
    if (localStorage.getItem(VOICE_CONSENT_KEY) === 'true') {
      setState(s => ({ ...s, consentGiven: true }));
    }
    return () => { recRef.current?.abort(); synthRef.current?.cancel(); };
  }, []);

  const grantConsent  = useCallback(() => {
    localStorage.setItem(VOICE_CONSENT_KEY, 'true');
    setState(s => ({ ...s, consentGiven: true }));
  }, []);

  const revokeConsent = useCallback(() => {
    localStorage.removeItem(VOICE_CONSENT_KEY);
    recRef.current?.abort(); synthRef.current?.cancel();
    setState({ status: 'idle', transcript: '', response: '', error: null, latencyMs: null, consentGiven: false });
  }, []);

  const redactViaML = useCallback(async (text: string): Promise<string> => {
    try {
      const res = await fetch(`${ML_BACKEND_URL}/pii/redact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Secret injected via Next.js API proxy — never exposed to browser
        },
        body: JSON.stringify({ text, uid: user?.uid ?? 'anon', context: 'voice_query' }),
      });
      if (res.ok) return (await res.json()).redacted_text;
    } catch { /* fallback below */ }

    // Client-side fallback
    const { clientPiiScan } = await import('../app/lib/trust');
    return clientPiiScan(text).redactedText;
  }, [user]);

  const speak = (text: string): Promise<void> => new Promise(resolve => {
    if (!synthRef.current) { resolve(); return; }
    synthRef.current.cancel();
    const u = new SpeechSynthesisUtterance(text.slice(0, 500));
    const voices = synthRef.current.getVoices();
    const v = voices.find(v => v.lang.startsWith('en') && v.localService);
    if (v) u.voice = v;
    u.onend = () => resolve(); u.onerror = () => resolve();
    synthRef.current.speak(u);
  });

  const startListening = useCallback(() => {
    if (!state.consentGiven || !recRef.current) {
      setState(s => ({ ...s, error: 'Voice consent required.' })); return;
    }
    setState(s => ({ ...s, status: 'listening', transcript: '', response: '', error: null, latencyMs: null }));
    t0Ref.current = Date.now();

    recRef.current.onresult = async (e: any) => {
      const raw = e.results[0][0].transcript;
      setState(s => ({ ...s, transcript: raw, status: 'processing' }));
      const clean = await redactViaML(raw);

      try {
        if (!user) throw new Error('Not authenticated');
        const tok = await user.getIdToken();
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
          body: JSON.stringify({ query: clean, history: [], relevantNodeIds: [] }),
        });
        if (!res.ok) throw new Error('Chat failed');
        const answer: string = (await res.json()).answer ?? '';
        setState(s => ({ ...s, response: answer, status: 'speaking' }));
        await speak(answer);
        setState(s => ({ ...s, status: 'idle', latencyMs: Date.now() - t0Ref.current }));
      } catch {
        setState(s => ({ ...s, status: 'error', error: 'Failed to get response from Mindi.' }));
      }
    };

    recRef.current.onerror = (e: any) =>
      setState(s => ({ ...s, status: 'error', error: `Voice error: ${e.error}` }));
    recRef.current.onend = () =>
      setState(s => s.status === 'listening' ? { ...s, status: 'idle' } : s);

    setTimeout(() => recRef.current?.stop(), MAX_RECORDING_MS);
    recRef.current.start();
  }, [state.consentGiven, user, redactViaML]);

  const stopListening = useCallback(() => {
    recRef.current?.stop(); synthRef.current?.cancel();
    setState(s => ({ ...s, status: 'idle' }));
  }, []);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  return { ...state, isSupported, startListening, stopListening, grantConsent, revokeConsent };
}
