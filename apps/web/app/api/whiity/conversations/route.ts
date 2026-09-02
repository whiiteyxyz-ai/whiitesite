import { NextResponse } from "next/server";
import { JsonMemoryStore } from "@whiite/memory/store";

async function getStore() {
  const store = new JsonMemoryStore(process.env.MEMORY_PATH ?? "./data/memory.json");
  await store.init();
  return store;
}

export async function GET() {
  try {
    const store = await getStore();
    const conversations = await store.conversations.list(20);
    return NextResponse.json({ conversations });
  } catch (err) {
    return NextResponse.json(
      { conversations: [], error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
