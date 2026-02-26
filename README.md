# Sapling (Local-First Language Learning MVP)

Desktop-first web app for French learning inspired by Duolingo progression, with child-acquisition pedagogy:
- meaning-first comprehension in early units
- high repetition
- implicit pattern exposure
- gradual production and speaking
- optional grammar clarifiers unlocked later

## Stack
- TypeScript everywhere
- Monorepo: npm/pnpm workspaces
- Backend: Fastify + Zod
- DB: SQLite + Prisma (local file)
- Frontend: Next.js App Router + Tailwind CSS
- Server data: TanStack Query
- Client state: Zustand
- Testing: Vitest
- Lint/format: ESLint + Prettier

## Workspace Structure
- `apps/web` - Next.js desktop UI
- `apps/api` - Fastify local API server
- `packages/shared` - shared config, grading, scheduler, types
- `prisma` - schema, migration SQL, seed script

## Prerequisites
- Node.js 20+
- npm 9+
- sqlite3 CLI available on your machine

## Setup
```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

If you previously installed dependencies with `pnpm`, clean before switching to npm:
```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install
```

Optional pnpm flow:
```bash
pnpm i
pnpm db:migrate
pnpm db:seed
pnpm dev
```

### Local URLs
- Web: `http://localhost:3000`
- API: `http://localhost:4000`

### SQLite Location
- DB file: `prisma/dev.db`

## Run Tests
```bash
npm test
```

## Lint
```bash
npm run lint
```

## Developer Tools
- Route: `http://localhost:3000/dev`
- Visibility is controlled by either:
  - `NEXT_PUBLIC_ENABLE_DEVTOOLS=true` in `.env`
  - hidden shortcut: `Shift + D`

Developer Tools include:
- CRUD for Course, Unit, Lesson, Item, Pattern, Exercise
- Lesson exercise composition by linking items/patterns
- JSON export/import with conflict handling (`skip` / `replace`)
- basic exercise preview with TTS

## Product Features Implemented
- Local profiles with optional PIN (hashed) + guest auto profile
- Onboarding (goal + audio voice check)
- Linear course map with sequential unlock and due review count
- Learning session loop with 5+ exercise types
- Immediate feedback + near-miss grading
- Spaced repetition state updates (SM-2-like variant)
- Review injection into sessions
- ASR endpoint stub + browser ASR fallback behavior
- Progress page with streak, XP, due reviews, strengths, scene stage placeholder
- Content Viewer page for seeded content

## Seeded Course Content
- Language pair: English -> French (`en` -> `fr-FR`)
- Units 1-3 seeded
  - Unit 1-2: comprehension-heavy
  - Unit 3: guided production + speaking emphasis
- Vocabulary, patterns, exercises, and image placeholders included

## Shared Config Constants
Defined in `packages/shared/src/config.ts`:
- `TARGET_LANGUAGE = "fr"`
- `TARGET_LOCALE = "fr-FR"`
- `NATIVE_LANGUAGE = "en"`
- `DAILY_GOAL_DEFAULT = 10`
- `GRAMMAR_UNLOCK_UNIT = 4`
- `COMPREHENSION_PHASE_UNITS = 2`
- `SHORT_RETRY_WINDOW_MINUTES = 10`

## API Surface (MVP)
- `GET /profiles`
- `POST /profiles`
- `POST /profiles/login`
- `POST /profiles/:id/upgrade`
- `PATCH /profiles/:id/settings`
- `GET /course-map?profileId=...`
- `POST /sessions/start`
- `POST /sessions/attempt`
- `POST /sessions/complete`
- `GET /progress/:profileId`
- `POST /asr/transcribe` (stub)
- `GET /dev/overview`
- `GET /dev/export`
- `POST /dev/import`
- CRUD:
  - `/dev/courses`
  - `/dev/units`
  - `/dev/lessons`
  - `/dev/items`
  - `/dev/patterns`
  - `/dev/exercises`

## Notes
- This MVP is local-first and intentionally has no cloud deployment/auth.
- Browser speech APIs vary by browser/OS; typed fallback is available whenever ASR is unsupported.
