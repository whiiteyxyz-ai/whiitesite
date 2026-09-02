# AGENTS.md

## Projekt-Übersicht
- **Name**: WhiiteSite
- **Stack**: Next.js 15, TypeScript, Zod, Vitest
- **Architektur**: npm workspaces Monorepo
- **Marke**: WHIITE Studio (Berlin) – Premium, minimalistisch, klar

## Commands

```bash
npm install          # Install (root, alle Workspaces)
npm run dev          # Next.js dev
npm run build        # Production build
npm test             # Vitest (Tests in tests/)
npm run typecheck    # TypeScript check
```

## Conventions

- **TypeScript strict mode** – keine `any`, keine `@ts-ignore`
- **ESM** – `"type": "module"`, relative imports mit `.js`-Endung
- **Zod für Validation** – alle externen Inputs (API-Routes, File-Reads) parsen
- **Keine Kommentare** – Code soll selbsterklärend sein
- **Deutsche User-Texte**, englische Code-Kommentare / Variablen
- **PR-Konvention**: Branch `feature/<name>`, Conventional Commits

## LLM-Provider

- **Ollama** ist default. Konfiguration: `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_EMBED_MODEL`
- OpenAI ist Fallback wenn Ollama nicht erreichbar
- Whiity nutzt `qwen3.5:9b`, Embeddings `nomic-embed-text:latest`

## Memory Schema

- `Entity`: type, name, attributes, tags
- `Generation`: type (image/description/chat), provider, model, prompt, output
- `Conversation`: messages (role, content, toolCalls), contextEntityIds
- `Message`: id, role, content, toolCalls, createdAt

## Adding a new Service

1. `services/<name>/` mit `package.json` + `src/index.ts`
2. Workspace-Dependencies in service's `package.json`
3. Frontend-Page in `apps/web/app/(app)/<name>/page.tsx`
4. API-Route in `apps/web/app/api/<name>/route.ts`
5. Test in `tests/unit/<name>.test.ts`
6. `npm install` im Root
