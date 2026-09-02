# WhiiteSite

KI Multi-Tool Plattform von WHIITE Studio (Berlin).

Drei Werkzeuge in einer App:

- **🎨 Bild-Studio** – DALL-E 3 + Stable Diffusion XL
- **✍️ Produkt-Beschreibungen** – SEO-Texte mit Ollama (lokal) oder OpenAI
- **🤖 Whiity** – KI-Chat-Assistent mit Memory und Werkzeug-Zugriff

## Architektur

```
whiitesite/
├── packages/             # Geteilte Bibliotheken
│   ├── domain/           # Marken, Tones, Sprachen
│   ├── memory/           # JSON Memory Store
│   └── cache/            # Cache Layer
├── services/             # Backend-Services
│   ├── llm/              # Ollama + Embeddings
│   ├── imagegen/         # DALL-E + Stability
│   ├── description/      # Produktbeschreibungen
│   └── whiity/           # Chat Assistent
├── apps/
│   └── web/              # Next.js 15 Frontend
└── tests/                # Vitest
```

## Setup

```bash
npm install
cp .env.example .env
# Ollama lokal: https://ollama.com/download
ollama pull qwen3.5:9b
ollama pull nomic-embed-text
npm run dev
```

App läuft auf `http://localhost:3000`.

## KI-Provider

| Provider | Verwendung | Setup |
|----------|-----------|-------|
| **Ollama (lokal)** | Standard – qwen3.5:9b + nomic-embed-text | `ollama serve` |
| **OpenAI** | Fallback – wenn Ollama nicht läuft | `OPENAI_API_KEY=sk-...` |
| **Stability AI** | Optional – zusätzliches Bildmodell | `STABILITY_API_KEY=...` |

## Scripts

```bash
npm run dev         # Next.js dev server
npm run build       # Production build
npm test            # Vitest
npm run typecheck   # TypeScript ohne Build
```

## Memory

Whiity nutzt `@whiite/memory` (JSON-basiert, default `./data/memory.json`).
Drei Collections:

- `entities` – Marken, Produkte, Personen, Konzepte
- `generations` – Bild- und Textgenerierungen (mit Provider + Model)
- `conversations` – Whiity-Chat-Verlauf

## Marken-Identität

WHIITE Line: Premium, minimalistisch, klar, zeitlos.
Alle Outputs werden mit `WHIITE_BRAND_CONTEXT` versehen, sodass der LLM-Stil passt.

## Deployment

Monorepo mit `npm workspaces`. Jeder Service ist auch einzeln nutzbar.
Frontend ist Next.js 15 (App Router) – läuft als Container oder auf Vercel.
