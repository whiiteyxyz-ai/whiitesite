import { z } from "zod";
import { readFile } from "node:fs/promises";

export const ImageGenRequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  model: z.enum(["dalle", "stability-ai"]).default("dalle"),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  count: z.number().positive().optional(),
});

export type ImageGenRequest = z.infer<typeof ImageGenRequestSchema>;

export interface ImageGenResult {
  id: string;
  prompt: string;
  url: string;
  dimensions: { width: number; height: number };
  timestamp: number;
}

export interface ImageGenProvider {
  name: string;
  generate(req: ImageGenRequest): Promise<ImageGenResult[]>;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function dalleSize(w?: number, h?: number): "1024x1024" | "1024x1792" | "1792x1024" {
  if (!w || !h) return "1024x1024";
  return w > h ? "1792x1024" : h > w ? "1024x1792" : "1024x1024";
}

function snap(v: number): number {
  if (v <= 256) return 256;
  if (v <= 512) return 512;
  if (v <= 1024) return 1024;
  return 1792;
}

export async function dalleProvider(req: ImageGenRequest): Promise<ImageGenResult[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const { OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });

  const w = snap(req.width ?? 1024);
  const h = snap(req.height ?? 1024);
  const n = Math.min(Math.max(req.count ?? 1, 1), 4);

  const resp = await client.images.generate({
    model: "dall-e-3",
    prompt: req.prompt,
    n,
    size: dalleSize(w, h),
    response_format: "url",
  });

  const now = Date.now();
  return (resp.data as Array<{ url?: string }>).map((img, i) => ({
    id: generateId(),
    prompt: req.prompt,
    url: img.url ?? "",
    dimensions: { width: w, height: h },
    timestamp: now + i,
  }));
}

export async function stabilityProvider(req: ImageGenRequest): Promise<ImageGenResult[]> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) throw new Error("STABILITY_API_KEY is not set");

  const StabilityAI = (await import("stability-ai")).default;
  const stability = new StabilityAI(apiKey);

  const w = req.width ?? 1024;
  const h = req.height ?? 1024;
  const n = Math.min(Math.max(req.count ?? 1, 1), 4);

  const results = await stability.v1.generation.textToImage(
    "stable-diffusion-xl-1024-v1-0",
    [{ text: req.prompt, weight: 1.0 }],
    { width: w, height: h, samples: n },
  );

  const now = Date.now();
  return await Promise.all(
    results.slice(0, n).map(async (r, i) => {
      const buf = await readFile(r.filepath);
      const mime = r.contentType === "image" ? `image/${r.outputFormat}` : "application/octet-stream";
      return {
        id: generateId(),
        prompt: req.prompt,
        url: `data:${mime};base64,${buf.toString("base64")}`,
        dimensions: { width: w, height: h },
        timestamp: now + i,
      };
    }),
  );
}
