import type { LLMMessage, LLMProvider, LLMResponse, OllamaConfig } from "./types.js";

export type { LLMMessage, LLMProvider, LLMResponse, OllamaConfig } from "./types.js";

const DEFAULT_BASE = "http://127.0.0.1:11434";

export class OllamaProvider implements LLMProvider {
  id = "ollama";
  name = "Ollama (lokal)";
  public defaultModel: string;
  private baseUrl: string;

  constructor(config: OllamaConfig = {}) {
    this.baseUrl = config.baseUrl ?? process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE;
    this.defaultModel = config.model ?? process.env.OLLAMA_MODEL ?? "qwen3:8b";
  }

  async models(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) return [];
      const data = (await res.json()) as { models?: Array<{ name: string }> };
      return (data.models ?? []).map((m) => m.name);
    } catch {
      return [];
    }
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.defaultModel,
        messages,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Ollama HTTP ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as {
      message?: { role: string; content: string };
      done?: boolean;
      total_duration?: number;
      prompt_eval_count?: number;
      eval_count?: number;
      model?: string;
    };

    return {
      content: data.message?.content ?? "",
      model: data.model ?? this.defaultModel,
      done: data.done ?? true,
      totalDuration: data.total_duration,
      promptEvalCount: data.prompt_eval_count,
      evalCount: data.eval_count,
    };
  }
}

export async function chat(
  messages: LLMMessage[],
  opts?: OllamaConfig,
): Promise<LLMResponse> {
  return new OllamaProvider(opts).chat(messages);
}

export async function embed(text: string, model?: string): Promise<number[]> {
  const base = process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE;
  const res = await fetch(`${base}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model ?? process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text:latest",
      prompt: text,
    }),
  });

  if (!res.ok) throw new Error(`Ollama embed HTTP ${res.status}`);
  const data = (await res.json()) as { embedding?: number[] };
  return data.embedding ?? [];
}
