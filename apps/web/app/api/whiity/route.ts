import { NextRequest, NextResponse } from "next/server";
import { OllamaProvider } from "@whiite/llm";
import { WhiityService, ChatRequestSchema } from "@whiite/whiity";
import { JsonMemoryStore } from "@whiite/memory/store";

let memoryStore: JsonMemoryStore | null = null;
let whiityService: WhiityService | null = null;

function getWhiity(): WhiityService {
  if (!whiityService) {
    memoryStore = new JsonMemoryStore(process.env.MEMORY_PATH ?? "./data/memory.json");
    const ollama = new OllamaProvider();

    const memory = {
      entities: {
        query: (q: { tags?: string[]; limit?: number }) =>
          memoryStore!.entities.query({ ...q, limit: q.limit ?? 5 }),
      },
      conversations: {
        create: (data: { title: string }) =>
          memoryStore!.conversations.create({ ...data, messages: [], contextEntityIds: [] }),
        get: (id: string) => memoryStore!.conversations.get(id),
        addMessage: (id: string, msg: Parameters<(typeof memoryStore)["conversations"]["addMessage"]>[1]) =>
          memoryStore!.conversations.addMessage(id, msg),
        list: (limit?: number) => memoryStore!.conversations.list(limit),
      },
    };

    whiityService = new WhiityService({
      memory,
      chatFn: async (messages) => ollama.chat(messages as Parameters<typeof ollama.chat>[0]),
    });
  }
  return whiityService;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    // Initialize memory store
    if (!memoryStore) {
      memoryStore = new JsonMemoryStore(process.env.MEMORY_PATH ?? "./data/memory.json");
      await memoryStore.init();
    }

    const whiity = getWhiity();
    const result = await whiity.chat(parsed.data);

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        conversationId: result.conversationId,
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
