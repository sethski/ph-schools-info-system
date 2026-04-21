// =============================================================================
// MINDI Phase 1 — useRAG Hook
// Query → local vector search → retrieve nodeIds → /api/chat → cited response
// Falls back to server-side similarity if IndexedDB vectors not loaded.
// =============================================================================
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../auth/useAuth';
import { clientPiiScan } from '../lib/trust';
import type { ChatMessage } from '../../../../../shared/types/response';

export function useRAG() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const sendMessage = useCallback(async (
    query: string,
    relevantNodeIds: string[] = []
  ) => {
    if (!user || !query.trim()) return;

    // Gate 1: client-side PII pre-scan
    const { redactedText, fieldsRemoved } = clientPiiScan(query);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query.trim(), // Show original to user
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          query: redactedText,   // Redacted version sent to server
          history: messages.slice(-6),
          relevantNodeIds,
          piiFieldsRemoved: fieldsRemoved,
        }),
      });

      if (!res.ok) throw new Error(`Chat error: ${res.status}`);
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer,
        citations: data.citations,
        confidence: data.confidence,
        styleMatchScore: data.styleMatchScore,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, messages]);

  const submitFeedback = useCallback(async (messageId: string, score: 1 | -1) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, feedbackScore: score } : m
    ));
    // Fire-and-forget feedback log
    if (user) {
      const idToken = await user.getIdToken();
      fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ messageId, score }),
      }).catch(() => {});
    }
  }, [user]);

  return { messages, loading, error, sendMessage, submitFeedback };
}
