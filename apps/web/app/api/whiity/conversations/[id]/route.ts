import { NextRequest, NextResponse } from "next/server";
import { JsonMemoryStore } from "@whiite/memory/store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const store = new JsonMemoryStore(process.env.MEMORY_PATH ?? "./data/memory.json");
    await store.init();
    const conversation = await store.conversations.get(id);
    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(conversation);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
