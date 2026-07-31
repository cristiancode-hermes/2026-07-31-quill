# Quill — Architecture

**Creative Writing & Story Development Platform** — build day 2026-07-31.
Angular 22 + NestJS monorepo. Specs: `/opt/data/hermes-design-specs/2026-07-31-quill/`.

## Overview

Quill is a writer's workspace for planning and drafting long-form fiction. Writers organize
work into **stories**, each containing **chapters**, **scenes**, **characters** (with a
relationship graph), **locations** (a nested world tree), and a **timeline** of story events.
A writing-session log and dashboard stats support daily word-count habits.

```
┌─────────────────────────────────────────────────────────────┐
│  apps/web  (Angular 22, standalone components, signals)     │
│  Inkwell design system (pure CSS, data-theme light/dark)    │
│  16 routes · authGuard · authInterceptor (JWT)              │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP /api (Bearer JWT)
┌──────────────────────────▼──────────────────────────────────┐
│  apps/api  (NestJS 11, TypeORM, SQLite)                     │
│  auth · stories · chapters · scenes · characters ·          │
│  locations · timeline · writing-sessions · stats · seed     │
│  Swagger at /docs · global prefix /api · ValidationPipe     │
└──────────────────────────┬──────────────────────────────────┘
                           │ TypeORM
                    ┌──────▼──────┐
                    │  SQLite DB  │  (9 tables)
                    └─────────────┘
```

## Stack

| Layer | Tech | Notes |
|---|---|---|
| Frontend | Angular 22 | Standalone components, zoneless change detection, signals |
| Backend | NestJS 11 | Modular, DI, guards, Swagger |
| ORM | TypeORM | `@Entity('snake_case_plural')`, string UUID-ish IDs |
| DB | SQLite | `data/quill.db` (env `DB_PATH`), dev/deploy friendly |
| Auth | JWT (passport-jwt) + bcryptjs | Bearer token, stored as `quill_token` in localStorage |
| Validation | class-validator + ValidationPipe | Global `whitelist` |
| Tests | Jest + ts-jest | 25 unit tests across 5 service suites |

## Monorepo layout

```
2026-07-31-quill/
├── package.json               # root scripts, hoisted deps (--legacy-peer-deps)
├── tsconfig.base.json
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── main.ts        # prefix api, Swagger /docs, ValidationPipe
│   │   │   ├── app.module.ts  # TypeOrmModule + feature modules + seed
│   │   │   ├── entities/      # 9 entities + barrel
│   │   │   ├── auth/          # register/login/me + JWT strategy + guards
│   │   │   ├── stories/       # CRUD + archive + per-story stats
│   │   │   ├── chapters/      # CRUD + PUT reorder
│   │   │   ├── scenes/        # CRUD + wordCount + reorder
│   │   │   ├── characters/    # CRUD + relationships graph
│   │   │   ├── locations/     # CRUD + parent/children tree
│   │   │   ├── timeline/      # CRUD, eventType, char/loc links
│   │   │   ├── writing-sessions/  # log sessions, date filters
│   │   │   ├── stats/         # dashboard aggregation
│   │   │   └── seed/          # OnModuleInit demo data (SEED_DB=true)
│   │   └── test/              # (e2e placeholder)
│   └── web/
│       └── src/
│           ├── styles.css     # Inkwell design system (917 lines)
│           ├── app/
│           │   ├── app.config.ts / app.routes.ts / app.ts
│           │   ├── models/models.ts
│           │   ├── guards/ interceptors/
│           │   ├── services/  # 9 HTTP services (signal-based)
│           │   ├── shared/    # story-card, character-card, modal, empty-state, …
│           │   ├── layout/layout-shell/
│           │   └── pages/     # 16 route components
└── scripts/
    └── smoke-test.mjs         # end-to-end API smoke test
```

## Data model (9 tables)

| Entity | Table | Key relations |
|---|---|---|
| User | `users` | 1:N stories, writing_sessions |
| Story | `stories` | N:1 user; 1:N chapters, characters, locations, timeline_events; per-story stats |
| Chapter | `chapters` | N:1 story; 1:N scenes; `position`, `status`, `wordGoal` |
| Scene | `scenes` | N:1 chapter; `position`, `content`, `wordCount` |
| Character | `characters` | N:1 story; 1:N relationships (source/target) |
| CharacterRelationship | `character_relationships` | source + target character, `type`, `description` |
| Location | `locations` | N:1 story; self-referential `parentId` tree |
| TimelineEvent | `timeline_events` | N:1 story; M:N characters, locations; `eventDate`, `eventType`, `importance` |
| WritingSession | `writing_sessions` | N:1 user; N:1 story; `wordsWritten`, `durationMinutes`, `sessionDate` |

## Auth & ownership model

- `POST /api/auth/register` + `login` return `{ token, user }`; `GET /api/auth/me` resolves the profile.
- All feature endpoints are guarded by `JwtAuthGuard` and resolve the caller via `@CurrentUser()`.
- **Ownership is enforced in `StoriesService`** (`assertOwnership`, `assertChapterOwnership`,
  `assertSceneOwnership`, `assertCharacterOwnership`, `assertLocationOwnership`) — every nested
  resource access checks that the parent story belongs to the caller. Cross-user access yields
  403/404.
- Passwords are hashed with bcryptjs (`$2a$`), never stored in plain text.

## Key design decisions

1. **Copy-from-huddle skeleton** — cloned `2026-07-30-huddle`'s apps/, tsconfig.base.json and
   package.json instead of scaffolding, guaranteeing identical strict tsconfig + nest-cli layout.
2. **Pure CSS design system ("Inkwell")** — no Tailwind; tokens as CSS custom properties,
   theme switched by `data-theme` on `<html>` (light default / dark "lamplight" variant),
   persisted under `quill_theme`.
3. **Word counts are computed server-side** (`countWords` in scenes service) on every
   create/update and stored on the scene; story-level stats aggregate via query builder joins.
4. **Soft archive for stories** (`isArchived`) instead of hard delete; locations **detach**
   children (set `parentId = null`) rather than cascade-deleting the world tree.
5. **Seed gated by `SEED_DB=true`** — real deployments start clean; smoke tests seed a demo
   writer (`demo@quill.app`).

## Verification

```bash
# API build + tests
cd apps/api
../../node_modules/.bin/nest build          # EXIT 0
../../node_modules/.bin/jest               # 25 passed

# Web build
cd ../web
../../node_modules/.bin/ng build           # EXIT 0 → dist/quill-web

# End-to-end smoke (needs seed)
cd ../api && SEED_DB=true DB_PATH=./data/quill.db PORT=3111 node dist/main.js &
node ../../scripts/smoke-test.mjs          # exercises auth + all CRUD endpoints
```

## Environment

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | API port |
| `DB_PATH` | `./data/quill.db` | SQLite file location |
| `SEED_DB` | unset | when `true`, SeedService loads demo data on boot |
| `JWT_SECRET` | dev fallback | JWT signing secret |
