import { describe, expect, it, vi } from "vitest";
import { DescriptionRequestSchema } from "@whiite/description";
import type { DescriptionData } from "@whiite/description";
import { createLlmDescriptionProvider } from "@whiite/description";

describe("DescriptionRequestSchema", () => {
  it("accepts a minimal request", () => {
    const r = DescriptionRequestSchema.parse({ productName: "Espresso" });
    expect(r.productName).toBe("Espresso");
    expect(r.language).toBe("de");
    expect(r.tone).toBe("professional");
  });

  it("accepts full request", () => {
    const r = DescriptionRequestSchema.parse({
      productName: "Kaffee",
      category: "Getränke",
      keywords: ["bio", "fair"],
      features: ["handgemacht"],
      targetAudience: "b2c",
      tone: "luxurious",
      length: "long",
      language: "de",
      includeBullets: true,
      includeMeta: true,
    });
    expect(r.tone).toBe("luxurious");
    expect(r.length).toBe("long");
  });

  it("rejects empty productName", () => {
    const r = DescriptionRequestSchema.safeParse({ productName: "" });
    expect(r.success).toBe(false);
  });

  it("rejects unknown tone", () => {
    const r = DescriptionRequestSchema.safeParse({ productName: "X", tone: "aggressive" });
    expect(r.success).toBe(false);
  });

  it("rejects too many keywords", () => {
    const r = DescriptionRequestSchema.safeParse({
      productName: "X",
      keywords: Array(20).fill("x"),
    });
    expect(r.success).toBe(false);
  });
});

describe("createLlmDescriptionProvider", () => {
  it("returns description data from LLM", async () => {
    const provider = createLlmDescriptionProvider({
      id: "test",
      name: "Test",
      chat: async () => ({
        content: JSON.stringify({
          headline: "Premium Espresso",
          body: "Der beste Espresso der Welt. Reichhaltig und aromatisch.",
          cta: "Jetzt kaufen",
          metaDescription: "Premium Espresso kaufen.",
          language: "de",
        }),
      }),
    });

    const result = await provider.generate({
      productName: "Espresso",
      language: "de",
      tone: "luxurious",
      length: "short",
      includeCta: true,
      includeMeta: true,
      includeHeadline: true,
      includeBullets: false,
    });

    expect(result.headline).toBe("Premium Espresso");
    expect(result.body).toBe("Der beste Espresso der Welt. Reichhaltig und aromatisch.");
    expect(result.cta).toBe("Jetzt kaufen");
    expect(result.language).toBe("de");
  });

  it("falls back to raw content on parse error", async () => {
    const provider = createLlmDescriptionProvider({
      id: "test",
      name: "Test",
      chat: async () => ({ content: "Das ist eine Produktbeschreibung ohne JSON." }),
    });

    const result = await provider.generate({
      productName: "Tee",
      language: "de",
      tone: "professional",
      length: "medium",
      includeHeadline: true,
      includeCta: true,
      includeMeta: true,
      includeBullets: false,
    });

    expect(result.body).toBe("Das ist eine Produktbeschreibung ohne JSON.");
    expect(result.wordCount).toBeGreaterThan(0);
  });
});
