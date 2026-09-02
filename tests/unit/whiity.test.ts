/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import { WhiityService } from "@whiite/whiity";

const makeMemory = () => {
  const convs: Array<{
    id: string;
    title: string;
    messages: Array<{
      id: string;
      role: "user" | "assistant" | "system" | "tool";
      content: string;
      toolCalls: Array<{ name: string; args: Record<string, unknown>; result?: unknown }>;
      createdAt: number;
    }>;
    contextEntityIds: string[];
    createdAt: number;
    updatedAt: number;
  }> = [];
  let nextId = 1;

  return {
    convs,
    memory: {
      entities: { query: async () => [] as any },
      conversations: {
        create: async (data: { title: string }) => {
          const c = {
            id: `c${nextId++}`,
            title: data.title,
            messages: [],
            contextEntityIds: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          convs.push(c);
          return { id: c.id };
        },
        get: async (id: string) => convs.find((c) => c.id === id) ?? null,
        addMessage: async (id: string, msg: any) => {
          const c = convs.find((c) => c.id === id);
          if (!c) return null;
          c.messages.push({ id: `m${nextId++}`, ...msg, createdAt: Date.now() });
          c.updatedAt = Date.now();
          return c;
        },
        list: async () => [...convs].sort((a, b) => b.updatedAt - a.updatedAt),
      },
    } as any,
  };
};

describe("WhiityService", () => {
  it("creates a conversation and responds", async () => {
    const { memory } = makeMemory();
    let calls = 0;
    const whiity = new WhiityService({
      memory,
      chatFn: async () => { calls++; return { content: "Hallo!" }; },
    });

    const result = await whiity.chat({ message: "Hi", language: "de", useMemory: false } as any);
    expect(result.conversationId).toBeTruthy();
    expect(result.message.content).toBe("Hallo!");
    expect(calls).toBe(1);
  });

  it("continues same conversation when id is provided", async () => {
    const { memory } = makeMemory();
    let calls = 0;
    const whiity = new WhiityService({
      memory,
      chatFn: async () => { calls++; return { content: "Weiter!" }; },
    });

    const first = await whiity.chat({ message: "Start", language: "de", useMemory: false } as any);
    const second = await whiity.chat({ message: "Weiter", language: "de", useMemory: false, conversationId: first.conversationId } as any);
    expect(second.conversationId).toBe(first.conversationId);
    expect(calls).toBe(2);
  });

  it("creates a new conversation when no id is given", async () => {
    const { memory } = makeMemory();
    const whiity = new WhiityService({ memory, chatFn: async () => ({ content: "OK" }) });
    const a = await whiity.chat({ message: "Eins", language: "de", useMemory: false } as any);
    const b = await whiity.chat({ message: "Zwei", language: "de", useMemory: false } as any);
    expect(a.conversationId).not.toBe(b.conversationId);
  });

  it("lists conversations", async () => {
    const { memory } = makeMemory();
    const whiity = new WhiityService({ memory, chatFn: async () => ({ content: "Hi" }) });
    await whiity.chat({ message: "Hi", language: "de", useMemory: false } as any);
    const list = await whiity.listConversations();
    expect(list.length).toBeGreaterThan(0);
  });

  it("retrieves a conversation by id", async () => {
    const { memory } = makeMemory();
    const whiity = new WhiityService({ memory, chatFn: async () => ({ content: "Hi" }) });
    const result = await whiity.chat({ message: "Hi", language: "de", useMemory: false } as any);
    const conv = await whiity.getConversation(result.conversationId);
    expect(conv?.id).toBe(result.conversationId);
    expect(conv?.messages.length).toBeGreaterThan(0);
  });
});
