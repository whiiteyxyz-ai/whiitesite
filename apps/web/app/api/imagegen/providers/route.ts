import { NextResponse } from "next/server";
import { createImageGenService } from "@whiite/imagegen";

export async function GET() {
  const dalleConfigured = Boolean(process.env.OPENAI_API_KEY);
  const stabilityConfigured = Boolean(process.env.STABILITY_API_KEY);

  return NextResponse.json({
    providers: [
      {
        id: "dalle",
        name: "DALL-E 3",
        description: "OpenAIs neuestes Bildmodell. Hervorragende Detailtiefe und Kohärenz.",
        configured: dalleConfigured,
        supports: ["text-to-image", "512-1792px"],
      },
      {
        id: "stability-ai",
        name: "Stable Diffusion XL",
        description: "Offenes Modell über Stability AI API. Kreativ, flexibel, viele Stile.",
        configured: stabilityConfigured,
        supports: ["text-to-image", "512-1024px"],
      },
    ],
    defaults: { model: "dalle", width: 1024, height: 1024, count: 1 },
  });
}
