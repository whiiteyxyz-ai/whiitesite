import { z } from "zod";

export const LANGUAGES = ["de", "en"] as const;
export const TONES = ["professional", "casual", "luxurious", "playful", "technical", "storytelling"] as const;

export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface GenerationMetadata {
  prompt: string;
  model: string;
  provider: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  success: boolean;
  error?: string;
}

export interface MemoryConfig {
  storage: "json" | "postgres" | "sqlite";
  path?: string;
  connectionString?: string;
  embeddingEnabled: boolean;
}
