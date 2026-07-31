# Quill

**Creative Writing & Story Development Platform** — plan stories, draft chapters and scenes,
build characters and their relationships, map worlds as nested locations, track plot timelines,
and keep a daily writing habit with word-count sessions.

## Stack

- **Frontend:** Angular 22 (standalone components, zoneless, signals) — "Inkwell" pure-CSS design system with light/dark themes
- **Backend:** NestJS 11 + TypeORM (SQLite), JWT auth (bcryptjs), Swagger at `/docs`
- **Tests:** 25 Jest unit tests across 5 service suites

## Getting started

```bash
npm install --legacy-peer-deps

# API (dev)
cd apps/api
DB_PATH=./data/quill.db SEED_DB=true npm run start:dev   # seeded demo writer: demo@quill.app

# Web (dev)
cd ../web && npm start   # http://localhost:4200
```

## Build & test

```bash
cd apps/api && ../../node_modules/.bin/nest build && ../../node_modules/.bin/jest
cd apps/web && ../../node_modules/.bin/ng build          # → dist/quill-web
```

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system layout, data model, decisions
- [`docs/API.md`](docs/API.md) — full REST reference
- [`docs/FRONTEND.md`](docs/FRONTEND.md) — frontend guide, design system, routes
- [`scripts/smoke-test.mjs`](scripts/smoke-test.mjs) — end-to-end API smoke test

## Features

- Stories with genre/synopsis/cover, soft-archive
- Chapters with status, word goals, drag reorder
- Scenes with server-computed word counts and a distraction-light editor
- Characters with roles, archetypes, traits, and a relationship graph (both directions)
- Locations as a nested world tree (parent/children), detach-on-delete
- Timeline of plot/character/location/battle/revelation events linked to characters and places
- Writing-session logging and dashboard stats (weekly words, streak, per-story totals)
