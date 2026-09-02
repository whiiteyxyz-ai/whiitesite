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
    const result = await service.generateParallel(parsed.data);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
