// =============================================================================
// MINDI Phase 1 — OpenRouter Client + Model Routing
// SERVER ONLY — never import in browser code.
// All LLM calls go through Next.js API routes, never directly from client.
// =============================================================================

const BASE_URL = process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL;

export const MODEL_ROUTING = {
  STYLE_EXTRACTION: process.env.OPENROUTER_STYLE_EXTRACTION_MODEL ?? DEFAULT_MODEL ?? 'anthropic/claude-sonnet-4',
  RAG_CHAT:         process.env.OPENROUTER_RAG_CHAT_MODEL ?? DEFAULT_MODEL ?? 'anthropic/claude-haiku-4',
  CODE_ANALYSIS:    process.env.OPENROUTER_CODE_ANALYSIS_MODEL ?? DEFAULT_MODEL ?? 'mistralai/mistral-large',
  CLASSIFICATION:   process.env.OPENROUTER_CLASSIFICATION_MODEL ?? DEFAULT_MODEL ?? 'mistralai/mistral-small',
} as const;

export type ModelRoutingKey = keyof typeof MODEL_ROUTING;

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCallOptions {
  task: ModelRoutingKey;
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
  piiRedacted: boolean; // Trust Covenant — callers MUST confirm
}

export interface LlmResponse {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export async function callLlm(opts: LlmCallOptions): Promise<LlmResponse> {
  if (!opts.piiRedacted) {
    throw new Error('[MINDI TRUST VIOLATION] piiRedacted must be true before LLM call.');
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.OPENROUTER_APP_URL ?? 'http://localhost:3000',
      'X-Title':      process.env.OPENROUTER_APP_NAME ?? 'Mindi',
    },
    body: JSON.stringify({
      model:      MODEL_ROUTING[opts.task],
      messages:   opts.messages,
      max_tokens: opts.maxTokens ?? 1000,
      temperature: opts.temperature ?? 0.3,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);

  const data = await res.json();
  return {
    content: data.choices[0].message.content,
    model:   data.model,
    usage: {
      promptTokens:     data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens:      data.usage?.total_tokens ?? 0,
    },
  };
}
