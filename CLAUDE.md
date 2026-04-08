# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # Install deps, generate Prisma client, run migrations
npm run dev          # Start dev server (Next.js + Turbopack)
npm run dev:daemon   # Start dev server writing output to logs.txt
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (all tests)
npm run db:reset     # Force reset SQLite database (destroys data)
```

Run a single test file:
```bash
npx vitest run src/path/to/file.test.ts
```

Environment: copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. Without it, the app uses a `MockLanguageModel` fallback that generates static component code.

## Architecture

UIGen is an AI-powered React component generator with live preview. The user describes a component in chat, Claude uses tool calls to write files into a **virtual (in-memory) file system**, and an iframe renders the result live.

### Request Flow

1. User sends chat message → `POST /api/chat` ([src/app/api/chat/route.ts](src/app/api/chat/route.ts))
2. Route calls Claude via Vercel AI SDK with two tools: `str_replace_editor` and `file_manager`
3. Claude's tool calls stream back to the client
4. `ChatContext` ([src/lib/contexts/chat-context.tsx](src/lib/contexts/chat-context.tsx)) intercepts tool call results and applies them to the `VirtualFileSystem`
5. `FileSystemContext` ([src/lib/contexts/file-system-context.tsx](src/lib/contexts/file-system-context.tsx)) holds the in-memory FS state; changes trigger re-render of the preview iframe
6. `PreviewFrame` ([src/components/preview/PreviewFrame.tsx](src/components/preview/PreviewFrame.tsx)) uses Babel standalone + esm.sh CDN to transform JSX and resolve imports entirely in the browser — no bundler involved

### Virtual File System

`VirtualFileSystem` ([src/lib/file-system.ts](src/lib/file-system.ts)) is a plain in-memory tree. No disk writes occur for generated components. It serializes to/from JSON for database persistence. All AI-generated file mutations go through this class.

### AI Tools

- `str_replace_editor` ([src/lib/tools/str-replace.ts](src/lib/tools/str-replace.ts)) — creates/overwrites files or applies diff-style edits
- `file_manager` ([src/lib/tools/file-manager.ts](src/lib/tools/file-manager.ts)) — renames, deletes files/directories

The system prompt lives in [src/lib/prompts/generation.tsx](src/lib/prompts/generation.tsx). Model selection is in [src/lib/provider.ts](src/lib/provider.ts) (Claude Haiku by default; falls back to `MockLanguageModel` if no API key).

### State Management

Two React contexts handle all shared state:
- `FileSystemContext` — current virtual FS tree, selected file, CRUD operations
- `ChatContext` — message list, streaming state, tool call dispatch into the FS

No external state library (no Redux/Zustand).

### Auth & Persistence

- JWT sessions via `jose`, stored as httpOnly cookies, 7-day expiry ([src/lib/auth.ts](src/lib/auth.ts))
- Passwords hashed with bcrypt
- SQLite + Prisma — two models: `User` and `Project` (stores chat messages + serialized FS as JSON blobs)
- Server actions in [src/actions/](src/actions/) handle auth and project CRUD
- Middleware ([src/middleware.ts](src/middleware.ts)) guards `/api/projects` and `/api/filesystem`

### UI Layout

Three-panel split layout (react-resizable-panels): chat | preview/code editor | file tree. Preview and code editor share one panel and can be toggled. Monaco editor is used for code view. shadcn/ui + Radix UI + Tailwind CSS v4 throughout.

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

### Testing

Vitest with jsdom. Tests live alongside source files. Use `@testing-library/react` for component tests.
