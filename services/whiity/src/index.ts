import { z } from "zod";
import type { LLMMessage } from "@whiite/llm";

export const TONES = ["professional", "casual", "luxurious", "playful", "technical", "storytelling"] as const;
export const LANGUAGES = ["de", "en"] as const;

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string(),
  toolCalls: z
    .array(
      z.object({
        name: z.string(),
        args: z.record(z.string(), z.unknown()),
        result: z.unknown().optional(),
      }),
    )
    .default([]),
  createdAt: z.number(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ConversationSchema = z.object({
  id: z.string(),
  title: z.string().default("Neue Unterhaltung"),
  messages: z.array(ChatMessageSchema).default([]),
  contextEntityIds: z.array(z.string()).default([]),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().optional(),
  language: z.enum(LANGUAGES).default("de"),
  useMemory: z.boolean().default(true),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const WHIITY_SYSTEM = `Du bist Whiity, der KI-Assistent von WhiiteSite – einem Premium Brand-Studio aus Berlin-Mitte.

Deine Stärken:
- Deutsch und Englisch, klar und präzise
- Kreative Texte, Strategie, Branding
- Bildgenerierung, Produktbeschreibungen, Kampagnen
- Freundlich, professionell, auf den Punkt

Antworte auf Deutsch wenn die Anfrage auf Deutsch ist, auf Englisch wenn sie auf Englisch ist.
Halte Antworten fokussiert und nutzerfreundlich.
Wenn du unsicher bist, sage es offen.
`;

const MAX_HISTORY = 20;

interface MemoryFacade {
  entities: {
    query(q: { tags?: string[]; limit?: number }): Promise<Array<{ id: string; name: string; description?: string; tags: string[] }>>;
  };
  conversations: {
    create(data: { title: string; messages?: Array<{ role: string; content: string; toolCalls: unknown[] }>; contextEntityIds?: string[] }): Promise<{ id: string }>;
    get(id: string): Promise<Conversation | null>;
    addMessage(id: string, msg: { role: string; content: string; toolCalls?: unknown[] }): Promise<unknown>;
    list(limit?: number): Promise<Conversation[]>;
  };
}

interface LlmChatFn {
  (messages: LLMMessage[]): Promise<{ content: string }>;
}

export class WhiityService {
  private memory: MemoryFacade;
  private llm: LlmChatFn;
  private model: string;

  constructor(opts: {
    memory: MemoryFacade;
    chatFn: LlmChatFn;
    model?: string;
  }) {
    this.memory = opts.memory;
    this.llm = opts.chatFn;
    this.model = opts.model ?? "qwen3.5:9b";
  }

  async chat(req: ChatRequest): Promise<{ message: ChatMessage; conversationId: string }> {
    const language = req.language;
    const isGerman = language === "de";

    // Get or create conversation
    let conversationId = req.conversationId;
    let conversation = conversationId
      ? await this.memory.conversations.get(conversationId)
      : null;

    if (!conversation) {
      const created = await this.memory.conversations.create({
        title: req.message.slice(0, 60),
      });
      conversationId = created.id;
      conversation = await this.memory.conversations.get(conversationId);
    }

    if (!conversation) throw new Error("Failed to create conversation");

    // Build messages with memory context
    const systemMsg: LLMMessage = {
      role: "system",
      content: WHIITY_SYSTEM,
    };

    const history: LLMMessage[] = conversation.messages.slice(-MAX_HISTORY).map((m) => ({
      role: m.role as LLMMessage["role"],
      content: m.content,
    }));

    // Memory context
    let memoryContext = "";
    if (req.useMemory) {
      const entities = await this.memory.entities.query({ limit: 5 });
      if (entities.length > 0) {
        memoryContext = `\nKontext aus dem Memory:\n${entities
          .map((e) => `- ${e.name}: ${e.description ?? ""}`)
          .join("\n")}`;
      }
    }

    const userMsg: LLMMessage = {
      role: "user",
      content: req.message + memoryContext,
    };

    // Call LLM
    const response = await this.llm([systemMsg, ...history, userMsg]);

    const assistantMsg: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: response.content,
      toolCalls: [],
      createdAt: Date.now(),
    };

    // Persist
    if (conversationId) {
      await this.memory.conversations.addMessage(conversationId, {
        role: "user",
        content: req.message,
        toolCalls: [],
      });
      await this.memory.conversations.addMessage(conversationId, assistantMsg);
    }

    return { message: assistantMsg, conversationId: conversationId ?? "" };
  }

  async listConversations(): Promise<Conversation[]> {
    return this.memory.conversations.list(20);
  }

  async getConversation(id: string): Promise<Conversation | null> {
    return this.memory.conversations.get(id);
  }
}
