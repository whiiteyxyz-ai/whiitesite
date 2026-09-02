import { describe, expect, it, vi } from "vitest";
import { JsonMemoryStore } from "../../packages/memory/src/store.js";

describe("JsonMemoryStore", () => {
  const tmp = `/tmp/whiite-memory-test-${Date.now()}.json`;
  let store: JsonMemoryStore;

  it("init creates empty store", async () => {
    store = new JsonMemoryStore(tmp);
    await store.init();
    expect(await store.entities.query({})).toHaveLength(0);
  });

  it("creates and retrieves an entity", async () => {
    const entity = await store.entities.create({
      type: "product",
      name: "Kaffee",
      description: "Bio Kaffee aus Kolumbien",
      tags: ["bio", "food"],
    });
    expect(entity.id).toBeTruthy();
    expect(entity.name).toBe("Kaffee");
    expect(entity.tags).toContain("bio");

    const found = await store.entities.get(entity.id);
    expect(found?.name).toBe("Kaffee");
  });

  it("updates an entity", async () => {
    const entity = await store.entities.create({ type: "product", name: "Tee" });
    const updated = await store.entities.update(entity.id, { name: "Grüner Tee", tags: ["green"] });
    expect(updated?.name).toBe("Grüner Tee");
    expect(updated?.tags).toContain("green");
  });

  it("deletes an entity", async () => {
    const entity = await store.entities.create({ type: "product", name: "Delete Me" });
    const ok = await store.entities.delete(entity.id);
    expect(ok).toBe(true);
    expect(await store.entities.get(entity.id)).toBeNull();
  });

  it("creates and lists conversations", async () => {
    const conv = await store.conversations.create({ title: "Test Gespräch" });
    expect(conv.id).toBeTruthy();

    const list = await store.conversations.list(10);
    expect(list.some((c) => c.id === conv.id)).toBe(true);
  });

  it("adds messages to a conversation", async () => {
    const conv = await store.conversations.create({ title: "Chat" });
    await store.conversations.addMessage(conv.id, {
      role: "user",
      content: "Hallo",
      toolCalls: [],
    });

    const updated = await store.conversations.get(conv.id);
    expect(updated?.messages).toHaveLength(1);
    expect(updated?.messages[0]?.content).toBe("Hallo");
  });

  it("exports and imports", async () => {
    const entity = await store.entities.create({ type: "brand", name: "Export Brand" });
    const exp = await store.export();
    expect(exp.entities.some((e) => e.id === entity.id)).toBe(true);
  });
});
