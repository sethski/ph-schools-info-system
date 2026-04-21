// =============================================================================
// MINDI Phase 1 — ChatPanel
// RAG chat UI: messages, citation badges, confidence score, 👍/👎 feedback.
// =============================================================================
'use client';

import { useRef, useEffect } from 'react';
import { useRAG } from './useRAG';
import CitationBadge from './CitationBadge';
import { CONFIDENCE_THRESHOLD } from '../../../../../shared/constants/risk';

interface ChatPanelProps { relevantNodeIds?: string[]; }

export default function ChatPanel({ relevantNodeIds = [] }: ChatPanelProps) {
  const { messages, loading, error, sendMessage, submitFeedback } = useRAG();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = [
    useRef(''),
    (v: string) => { if (inputRef.current) inputRef.current.value = v; },
  ];

  // Workaround: use state for controlled input
  const [inputVal, setInputVal] = ['', () => {}];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    const val = inputRef.current?.value?.trim();
    if (!val || loading) return;
    if (inputRef.current) inputRef.current.value = '';
    await sendMessage(val, relevantNodeIds);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" role="log" aria-label="Chat messages" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
            <span className="text-5xl" aria-hidden="true">🧠</span>
            <p className="text-white/40 text-sm max-w-xs">
              Ask anything about your knowledge base. Mindi answers with citations from your own writing.
            </p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] space-y-2">
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-indigo-500/20 text-white/90 rounded-br-sm'
                  : 'bg-white/5 text-white/80 rounded-bl-sm border border-white/8'}`}>
                {msg.content}
              </div>

              {/* Confidence + style match */}
              {msg.role === 'assistant' && msg.confidence !== undefined && (
                <div className="flex items-center gap-2 px-1">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full
                    ${msg.confidence >= CONFIDENCE_THRESHOLD
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-amber-500/15 text-amber-400'}`}>
                    {Math.round(msg.confidence * 100)}% confidence
                  </span>
                  {msg.styleMatchScore !== undefined && (
                    <span className="text-[10px] text-white/30">
                      {Math.round(msg.styleMatchScore * 100)}% style match
                    </span>
                  )}
                  {/* Low confidence nudge */}
                  {msg.confidence < CONFIDENCE_THRESHOLD && (
                    <span className="text-[10px] text-amber-400/70">— add more context?</span>
                  )}
                </div>
              )}

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-1">
                  {msg.citations.map(c => <CitationBadge key={c.nodeId} citation={c} />)}
                </div>
              )}

              {/* 👍/👎 feedback */}
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[10px] text-white/25">Helpful?</span>
                  {([1, -1] as const).map(score => (
                    <button key={score} onClick={() => submitFeedback(msg.id, score)}
                      aria-label={score === 1 ? 'Helpful' : 'Not helpful'}
                      className={`text-base transition-all min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg
                        ${msg.feedbackScore === score ? 'opacity-100 bg-white/8' : 'opacity-30 hover:opacity-70'}`}>
                      {score === 1 ? '👍' : '👎'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/8 px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1" aria-label="Mindi is thinking">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }} aria-hidden="true" />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <p role="alert" className="text-xs text-red-400 text-center py-2">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/8 px-4 py-3">
        <div className="flex gap-2 items-end">
          <textarea ref={inputRef} rows={1} disabled={loading}
            onKeyDown={onKeyDown}
            placeholder="Ask Mindi anything about your brain…"
            aria-label="Chat input"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/25 resize-none min-h-[44px] max-h-32 focus:outline-none focus:border-indigo-400/50 disabled:opacity-50 transition-colors duration-150" />
          <button onClick={handleSend} disabled={loading}
            aria-label="Send message"
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 disabled:opacity-30 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M14 8L2 2l3 6-3 6 12-6z" fill="currentColor" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-white/20 mt-1.5 px-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
