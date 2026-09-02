import { z } from "zod";

// ============ ENTITIES ============
// Flexible, semantic. Generic enough for products, brands, people, places.

export const EntityTypeSchema = z.enum([
  "product",
  "brand",
  "person",
  "place",
  "concept",
  "campaign",
  "custom",
]);

export type EntityType = z.infer<typeof EntityTypeSchema>;

export const EntitySchema = z.object({
  id: z.string(),
  type: EntityTypeSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  attributes: z.record(z.string(), z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Entity = z.infer<typeof EntitySchema>;

export type CreateEntityInput = {
  type: EntityType;
  name: string;
  description?: string;
  attributes?: Record<string, unknown>;
  tags?: string[];
};

// ============ GENERATIONS ============

export const GenerationTypeSchema = z.enum(["image", "text", "audio", "video"]);
export type GenerationType = z.infer<typeof GenerationTypeSchema>;

export const GenerationSchema = z.object({
  id: z.string(),
  type: GenerationTypeSchema,
  status: z.enum(["pending", "success", "failed"]),
  provider: z.string(),
  model: z.string(),
  prompt: z.string(),
  result: z.unknown().optional(),
  error: z.string().optional(),
  durationMs: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
  entityIds: z.array(z.string()).default([]),
  createdAt: z.number(),
});

export type Generation = z.infer<typeof GenerationSchema>;

// ============ CONVERSATIONS (Whiity) ============

export const MessageRoleSchema = z.enum(["user", "assistant", "system", "tool"]);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  role: MessageRoleSchema,
  content: z.string(),
  toolCalls: z
    .array(
      z.object({
        name: z.string(),
        args: z.record(z.string(), z.unknown()),
        result: z.unknown().optional(),
      })
    )
    .default([]),
  tokens: z.number().optional(),
  createdAt: z.number(),
});

export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = z.object({
  id: z.string(),
  title: z.string().default("Neue Unterhaltung"),
  messages: z.array(MessageSchema).default([]),
  contextEntityIds: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

// ============ MEMORY STORE ============

export interface MemoryQuery {
  type?: EntityType;
  tags?: string[];
  search?: string;
  entityIds?: string[];
  limit?: number;
  from?: number;
  to?: number;
}

export interface MemoryStore {
  entities: {
    create(data: CreateEntityInput): Promise<Entity>;
    get(id: string): Promise<Entity | null>;
    update(id: string, patch: Partial<CreateEntityInput>): Promise<Entity | null>;
    delete(id: string): Promise<boolean>;
    query(q: MemoryQuery): Promise<Entity[]>;
  };
  generations: {
    create(data: Omit<Generation, "id" | "createdAt">): Promise<Generation>;
    get(id: string): Promise<Generation | null>;
    query(q: { type?: GenerationType; entityIds?: string[]; limit?: number }): Promise<Generation[]>;
  };
  conversations: {
    create(data: Omit<Conversation, "id" | "createdAt" | "updatedAt">): Promise<Conversation>;
    get(id: string): Promise<Conversation | null>;
    addMessage(id: string, message: Omit<Message, "id" | "createdAt">): Promise<Conversation | null>;
    list(limit?: number): Promise<Conversation[]>;
  };
  export(): Promise<MemoryExport>;
  import(data: MemoryExport): Promise<void>;
}

export interface MemoryExport {
  version: number;
  exportedAt: number;
  entities: Entity[];
  generations: Generation[];
  conversations: Conversation[];
}
