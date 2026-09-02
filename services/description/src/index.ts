import { z } from "zod";
import type { LLMMessage } from "@whiite/llm";

export const TONES = ["professional", "casual", "luxurious", "playful", "technical", "storytelling"] as const;
export const LENGTHS = ["short", "medium", "long"] as const;
export const LANGUAGES = ["de", "en"] as const;
export const AUDIENCES = ["b2c", "b2b", "young", "family", "premium", "technical"] as const;

export const DescriptionRequestSchema = z.object({
  productName: z.string().min(1).max(200),
  category: z.string().min(1).max(100).optional(),
  keywords: z.array(z.string().min(1).max(50)).max(15).optional(),
  features: z.array(z.string().min(1).max(300)).max(10).optional(),
  targetAudience: z.enum(AUDIENCES).optional(),
  tone: z.enum(TONES).default("professional"),
  length: z.enum(LENGTHS).default("medium"),
  language: z.enum(LANGUAGES).default("de"),
  includeHeadline: z.boolean().default(true),
  includeCta: z.boolean().default(true),
  includeMeta: z.boolean().default(true),
  includeBullets: z.boolean().default(false),
  brandContext: z.string().max(1000).optional(),
});

export type DescriptionRequest = z.infer<typeof DescriptionRequestSchema>;

export const DescriptionDataSchema = z.object({
  headline: z.string().optional(),
  body: z.string(),
  bullets: z.array(z.string()).optional(),
  cta: z.string().optional(),
  metaDescription: z.string().optional(),
  language: z.enum(LANGUAGES),
  wordCount: z.number(),
});

export type DescriptionData = z.infer<typeof DescriptionDataSchema>;

export interface DescriptionProvider {
  id: string;
  name: string;
  generate(req: DescriptionRequest): Promise<DescriptionData>;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const WHIITE_BRAND_CONTEXT =
  "WHIITE Studio (Berlin) – Premium Brand-Studio. Stil: minimalistisch, premium, zeitlos. Keine Übertreibungen, keine Superlative, klare Aussagen.";

const TONE_GUIDE: Record<typeof TONES[number], string> = {
  professional: "professionell, sachlich, vertrauenserweckend",
  casual: "locker, nahbar, freundlich",
  luxurious: "edel, exklusiv, hochwertig",
  playful: "verspielt, kreativ, fröhlich",
  technical: "präzise, faktisch, detailorientiert",
  storytelling: "erzählerisch, atmosphärisch, emotional",
};

const LENGTH_GUIDE: Record<typeof LENGTHS[number], { body: string; meta: string }> = {
  short: { body: "1 kurzer Absatz (50-80 Wörter)", meta: "max 120 Zeichen" },
  medium: { body: "2 Absätze (120-180 Wörter)", meta: "max 150 Zeichen" },
  long: { body: "3-4 Absätze (250-350 Wörter)", meta: "max 160 Zeichen" },
};

export function buildPrompt(req: DescriptionRequest): string {
  const tone = TONE_GUIDE[req.tone];
  const len = LENGTH_GUIDE[req.length];

  const sections: string[] = [
    `Produkt: ${req.productName}`,
  ];
  if (req.category) sections.push(`Kategorie: ${req.category}`);
  if (req.keywords?.length) sections.push(`Keywords: ${req.keywords.join(", ")}`);
  if (req.features?.length) sections.push(`Features:\n- ${req.features.join("\n- ")}`);
  if (req.targetAudience) sections.push(`Zielgruppe: ${req.targetAudience}`);
  sections.push(`Sprache: ${req.language === "de" ? "Deutsch" : "Englisch"}`);
  sections.push(`Tonalität: ${tone}`);
  sections.push(`Länge Haupttext: ${len.body}`);
  sections.push(`Länge Meta-Description: ${len.meta}`);
  sections.push(`Brand-Kontext: ${req.brandContext ?? WHIITE_BRAND_CONTEXT}`);

  sections.push("");
  sections.push("Antworte ausschließlich mit validem JSON in folgendem Schema (keine Markdown-Formatierung, kein Codeblock):");
  sections.push("{");
  if (req.includeHeadline) sections.push(`  "headline": "Aufmerksamkeitsstarke Überschrift (max 60 Zeichen)",`);
  sections.push(`  "body": "Der Haupttext (${len.body})",`);
  if (req.includeBullets) sections.push(`  "bullets": ["Bullet 1", "Bullet 2", "Bullet 3"],`);
  if (req.includeCta) sections.push(`  "cta": "Handlungsaufforderung (max 50 Zeichen)",`);
  if (req.includeMeta) sections.push(`  "metaDescription": "SEO-Meta-Description (${len.meta})",`);
  sections.push(`  "language": "${req.language}"`);
  sections.push("}");

  return sections.join("\n");
}

function safeParseJson<T>(text: string): T | null {
  // Strip markdown fences if present
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/g, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // try to extract the first JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

interface LlmChatFn {
  (messages: LLMMessage[]): Promise<{ content: string }>;
}

export function createLlmDescriptionProvider(opts: {
  id: string;
  name: string;
  systemPrompt?: string;
  chat: LlmChatFn;
}): DescriptionProvider {
  return {
    id: opts.id,
    name: opts.name,
    async generate(req: DescriptionRequest): Promise<DescriptionData> {
      const userPrompt = buildPrompt(req);
      const response = await opts.chat([
        {
          role: "system",
          content: opts.systemPrompt ?? "Du bist ein erfahrener Werbetexter. Antworte ausschließlich mit validem JSON.",
        },
        { role: "user", content: userPrompt },
      ]);

      const parsed = safeParseJson<Partial<DescriptionData>>(response.content);
      if (!parsed || !parsed.body) {
        // Fallback: use the raw content as body
        const wordCount = response.content.trim().split(/\s+/).length;
        return {
          body: response.content,
          language: req.language,
          wordCount,
        };
      }

      const wordCount = parsed.body.trim().split(/\s+/).length;
      return {
        headline: req.includeHeadline ? parsed.headline : undefined,
        body: parsed.body,
        bullets: req.includeBullets ? parsed.bullets : undefined,
        cta: req.includeCta ? parsed.cta : undefined,
        metaDescription: req.includeMeta ? parsed.metaDescription : undefined,
        language: req.language,
        wordCount,
      };
    },
  };
}

export function generateRequestId(): string {
  return generateId();
}
