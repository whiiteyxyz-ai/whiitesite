import { NextRequest, NextResponse } from "next/server";
import { createImageGenService } from "@whiite/imagegen";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ImageGenRequestSchema } = await import("@whiite/imagegen");
    const parsed = ImageGenRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const service = createImageGenService();
    const result = await service.generate(parsed.data);

    let status = 200;
    if (!result.success) {
      const err = String(result.error ?? "");
      if (err.includes("not set")) status = 503;
      else if (err.includes("Unknown model")) status = 400;
      else status = 500;
    }

    return NextResponse.json({ ...result, provider: parsed.data.model }, { status });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
