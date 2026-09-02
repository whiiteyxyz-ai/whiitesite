import { z } from "zod";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import {
  EntitySchema,
  EntityTypeSchema,
  GenerationSchema,
  GenerationTypeSchema,
  MessageSchema,
  ConversationSchema,
  type Entity,
  type CreateEntityInput,
  type Generation,
  type GenerationType,
  type Message,
  type Conversation,
  type MemoryStore,
  type MemoryQuery,
  type MemoryExport,
} from "./index.js";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface StoreData {
  entities: Entity[];
  generations: Generation[];
  conversations: Conversation[];
}

function emptyStore(): StoreData {
  return { entities: [], generations: [], conversations: [] };
}

export class JsonMemoryStore implements MemoryStore {
  private path: string;
  private data: StoreData;

  constructor(path = "./data/memory.json") {
    this.path = path;
    this.data = emptyStore();
  }

  async init(): Promise<void> {
    try {
      await mkdir(require("node:path").dirname(this.path), { recursive: true });
    } catch {}
    if (existsSync(this.path)) {
      try {
        const raw = await readFile(this.path, "utf-8");
        const parsed = JSON.parse(raw) as StoreData;
        this.data = {
          entities: (parsed.entities ?? []).map((e) => EntitySchema.parse(e)),
          generations: (parsed.generations ?? []).map((g) => GenerationSchema.parse(g)),
          conversations: (parsed.conversations ?? []).map((c) => ConversationSchema.parse(c)),
        };
      } catch {
        this.data = emptyStore();
      }
    }
  }

  private async save(): Promise<void> {
    await mkdir(require("node:path").dirname(this.path), { recursive: true });
    await writeFile(this.path, JSON.stringify(this.data, null, 2), "utf-8");
  }

  // ============ ENTITIES ============
  async createEntity(data: CreateEntityInput): Promise<Entity> {
    const entity = EntitySchema.parse({
      ...data,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    this.data.entities.push(entity);
    await this.save();
    return entity;
  }

  async getEntity(id: string): Promise<Entity | null> {
    return this.data.entities.find((e) => e.id === id) ?? null;
  }

  async updateEntity(id: string, patch: Partial<Omit<Entity, "id" | "createdAt">>): Promise<Entity | null> {
    const idx = this.data.entities.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    const existing = this.data.entities[idx];
    const merged = { ...existing, ...patch, id, updatedAt: Date.now() } as Entity;
    this.data.entities[idx] = EntitySchema.parse(merged);
    await this.save();
    return this.data.entities[idx];
  }

  async deleteEntity(id: string): Promise<boolean> {
    const before = this.data.entities.length;
    this.data.entities = this.data.entities.filter((e) => e.id !== id);
    if (this.data.entities.length !== before) {
      await this.save();
      return true;
    }
    return false;
  }

  async queryEntities(q: MemoryQuery): Promise<Entity[]> {
    let results = this.data.entities;
    if (q.type) {
      results = results.filter((e) => e.type === q.type);
    }
    if (q.tags && q.tags.length > 0) {
      results = results.filter((e) => q.tags!.some((t) => e.tags.includes(t)));
    }
    if (q.entityIds && q.entityIds.length > 0) {
      results = results.filter((e) => q.entityIds!.includes(e.id));
    }
    if (q.from || q.to) {
      const from = q.from ?? 0;
      const to = q.to ?? results.length;
      results = results.slice(from, to);
    }
    const limit = q.limit ?? 50;
    return results.slice(0, limit);
  }

  // ============ GENERATIONS ============
  async createGeneration(data: Omit<Generation, "id" | "createdAt">): Promise<Generation> {
    const gen: Generation = { ...data, id: generateId(), createdAt: Date.now() };
    this.data.generations.push(gen);
    await this.save();
    return gen;
  }

  async getGeneration(id: string): Promise<Generation | null> {
    return this.data.generations.find((g) => g.id === id) ?? null;
  }

  async queryGenerations(q: { type?: GenerationType; entityIds?: string[]; limit?: number }): Promise<Generation[]> {
    let results = this.data.generations;
    if (q.type) results = results.filter((g) => g.type === q.type);
    if (q.entityIds && q.entityIds.length > 0) {
      results = results.filter((g) => q.entityIds!.some((id) => g.entityIds.includes(id)));
    }
    const limit = q.limit ?? 50;
    return results.slice(0, limit);
  }

  // ============ CONVERSATIONS ============
  async createConversation(data: { title: string; messages?: Array<unknown>; contextEntityIds?: string[]; metadata?: Record<string, unknown> }): Promise<Conversation> {
    const now = Date.now();
    const conv: Conversation = ConversationSchema.parse({
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    });
    this.data.conversations.push(conv);
    await this.save();
    return conv;
  }

  async getConversation(id: string): Promise<Conversation | null> {
    return this.data.conversations.find((c) => c.id === id) ?? null;
  }

  async addMessage(convId: string, message: Omit<Message, "id" | "createdAt">): Promise<Conversation | null> {
    const conv = this.data.conversations.find((c) => c.id === convId);
    if (!conv) return null;
    const msg: Message = { ...message, id: generateId(), createdAt: Date.now() };
    conv.messages.push(msg);
    conv.updatedAt = Date.now();
    await this.save();
    return conv;
  }

  async listConversations(limit = 20): Promise<Conversation[]> {
    return [...this.data.conversations].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
  }

  async export(): Promise<MemoryExport> {
    return {
      version: 1,
      exportedAt: Date.now(),
      entities: this.data.entities,
      generations: this.data.generations,
      conversations: this.data.conversations,
    };
  }

  async import(data: MemoryExport): Promise<void> {
    this.data = {
      entities: data.entities.map((e) => EntitySchema.parse(e)),
      generations: data.generations.map((g) => GenerationSchema.parse(g)),
      conversations: data.conversations.map((c) => ConversationSchema.parse(c)),
    };
    await this.save();
  }

  get entities() {
    return {
      create: (data: CreateEntityInput) => this.createEntity(data),
      get: (id: string) => this.getEntity(id),
      update: (id: string, patch: Partial<CreateEntityInput>) => this.updateEntity(id, patch),
      delete: (id: string) => this.deleteEntity(id),
      query: (q: MemoryQuery) => this.queryEntities(q),
    };
  }

  get generations() {
    return {
      create: (data: Omit<Generation, "id" | "createdAt">) => this.createGeneration(data),
      get: (id: string) => this.getGeneration(id),
      query: (q: { type?: GenerationType; entityIds?: string[]; limit?: number }) => this.queryGenerations(q),
    };
  }

  get conversations() {
    return {
      create: (data: { title: string; messages?: Array<unknown>; contextEntityIds?: string[]; metadata?: Record<string, unknown> }) => this.createConversation(data),
      get: (id: string) => this.getConversation(id),
      addMessage: (id: string, msg: Omit<Message, "id" | "createdAt">) => this.addMessage(id, msg),
      list: (limit?: number) => this.listConversations(limit),
    };
  }
}
