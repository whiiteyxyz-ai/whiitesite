export { ImageGenRequestSchema } from "./provider.js";
export type { ImageGenProvider, ImageGenRequest, ImageGenResult } from "./provider.js";
import type { ImageGenProvider, ImageGenRequest, ImageGenResult } from "./provider.js";
import { dalleProvider, stabilityProvider } from "./provider.js";

type CacheEntry<T> = { value: T; expiresAt: number };

const imageGenCache = new Map<string, CacheEntry<ImageGenResult[]>>();

function cacheKey(req: ImageGenRequest): string {
  return `${req.model}:${req.prompt}:${req.width ?? "x"}:${req.height ?? "x"}`;
}

async function getCached(req: ImageGenRequest): Promise<ImageGenResult[] | null> {
  const entry = imageGenCache.get(cacheKey(req));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    imageGenCache.delete(cacheKey(req));
    return null;
  }
  return entry.value;
}

async function setCached(req: ImageGenRequest, results: ImageGenResult[]): Promise<void> {
  if (imageGenCache.size > 5_000) {
    const now = Date.now();
    for (const [k, v] of imageGenCache) {
      if (now > v.expiresAt) imageGenCache.delete(k);
    }
  }
  imageGenCache.set(cacheKey(req), { value: results, expiresAt: Date.now() + 300_000 });
}

export type ParallelResult = { provider: string; generated: ImageGenResult[]; error?: string };

export class ImageGenService {
  private providers = new Map<string, ImageGenProvider>();

  register(name: string, p: ImageGenProvider) {
    this.providers.set(name, p);
  }

  async generate(req: ImageGenRequest): Promise<{ success: boolean; generated: ImageGenResult[]; error?: string }> {
    const cached = await getCached(req);
    if (cached) return { success: true, generated: cached };

    const provider = this.providers.get(req.model);
    if (!provider) return { success: false, generated: [], error: `Unknown model: ${req.model}` };

    try {
      const generated = await provider.generate(req);
      await setCached(req, generated);
      return { success: true, generated };
    } catch (err) {
      return { success: false, generated: [], error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  async generateParallel(req: ImageGenRequest): Promise<{ success: boolean; results: ParallelResult[] }> {
    const tasks = [...this.providers.entries()].map(async ([name, p]): Promise<ParallelResult> => {
      try {
        const generated = await p.generate(req);
        return { provider: name, generated };
      } catch (err) {
        return { provider: name, generated: [], error: err instanceof Error ? err.message : "Unknown error" };
      }
    });

    const results = await Promise.all(tasks);
    return { success: results.some((r) => r.generated.length > 0), results };
  }
}

export function createImageGenService(): ImageGenService {
  const svc = new ImageGenService();
  svc.register("dalle", { name: "dalle", generate: dalleProvider });
  svc.register("stability-ai", { name: "stability-ai", generate: stabilityProvider });
  return svc;
}
