import { NextRequest, NextResponse } from "next/server";
import { OllamaProvider } from "@whiite/llm";
import { createLlmDescriptionProvider, DescriptionRequestSchema } from "@whiite/description";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = DescriptionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    // Use Ollama if available, otherwise try OpenAI
    let data;
    try {
      const ollama = new OllamaProvider();
      const models = await ollama.models();

      if (models.length > 0) {
        const provider = createLlmDescriptionProvider({
          id: "ollama",
          name: `Ollama (${ollama.defaultModel})`,
          chat: (messages) => ollama.chat(messages as Parameters<typeof ollama.chat>[0]),
        });
        data = await provider.generate(parsed.data);
      } else {
        throw new Error("No Ollama models");
      }
    } catch {
      // Fallback: use OpenAI if key is set
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { success: false, error: "Kein KI-Provider verfügbar. Starte Ollama oder setze OPENAI_API_KEY." },
          { status: 503 },
        );
      }

      const { OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey });
      const provider = createLlmDescriptionProvider({
        id: "openai",
        name: "OpenAI GPT-4o",
        chat: async (messages) => {
          const resp = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages as Parameters<typeof client.chat.completions.create>[0]["messages"],
          });
          return { content: resp.choices[0]?.message.content ?? "" };
        },
      });
      data = await provider.generate(parsed.data);
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
