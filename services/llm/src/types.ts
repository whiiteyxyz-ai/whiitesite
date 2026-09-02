export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  done: boolean;
  totalDuration?: number;
  promptEvalCount?: number;
  evalCount?: number;
}

export interface LLMProvider {
  id: string;
  name: string;
  chat(messages: LLMMessage[]): Promise<LLMResponse>;
  models(): Promise<string[]>;
}

export interface OllamaConfig {
  baseUrl?: string;
  model?: string;
}
