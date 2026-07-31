# Quill — API Reference

Base URL: `/api` · Auth: `Authorization: Bearer <token>` (except auth endpoints) · Swagger: `/docs`

All endpoints return JSON. Errors use NestJS defaults: `{ statusCode, message, error }`.
Feature endpoints return **403 Forbidden** when the resource belongs to another user and
**404 Not Found** when it does not exist.

## Auth

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/auth/register` | `{ email, username, password, dailyWordGoal? }` | `{ token, user }` |
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |
| GET | `/auth/me` | — | user profile (authenticated) |
| PATCH | `/auth/me` | `{ username?, dailyWordGoal?, avatarUrl? }` | updated profile |
| POST | `/auth/change-password` | `{ currentPassword, newPassword }` | `{ ok: true }` |

`user` shape: `{ id, email, username, dailyWordGoal, avatarUrl, createdAt, updatedAt }`
(passwordHash never serialized).

## Stories

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/stories` | — | non-archived stories, updatedAt DESC |
| POST | `/stories` | `{ title, genre?, synopsis?, coverColor? }` | |
| GET | `/stories/:id` | — | includes stats |
| PATCH | `/stories/:id` | partial story fields | |
| DELETE | `/stories/:id` | — | soft archive (`isArchived = true`) |
| GET | `/stories/:id/stats` | — | `{ totalWords, chapterCount, sceneCount, characterCount, locationCount, eventCount, wordsPerChapter[] }` |

## Chapters

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/stories/:storyId/chapters` | — | ordered by position |
| POST | `/stories/:storyId/chapters` | `{ title, wordGoal?, status?, notes? }` | appended at end |
| GET | `/stories/:storyId/chapters/:id` | — | includes scenes + wordCount |
| PATCH | `/stories/:storyId/chapters/:id` | partial fields | |
| DELETE | `/stories/:storyId/chapters/:id` | — | |
| PUT | `/stories/:storyId/chapters/reorder` | `{ orderedIds: string[] }` | rewrites positions |

## Scenes

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/chapters/:chapterId/scenes` | — | ordered by position |
| POST | `/chapters/:chapterId/scenes` | `{ title, content, notes? }` | `wordCount` computed server-side |
| GET | `/scenes/:id` | — | |
| PATCH | `/scenes/:id` | partial fields | recalculates `wordCount` on content change |
| DELETE | `/scenes/:id` | — | |
| PUT | `/chapters/:chapterId/scenes/reorder` | `{ orderedIds: string[] }` | |

## Characters

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/stories/:storyId/characters` | — | |
| POST | `/stories/:storyId/characters` | `{ name, role?, archetype?, age?, traits?, appearance?, backstory?, goals?, flaws?, avatarColor? }` | |
| GET | `/stories/:storyId/characters/:id` | — | includes relationships |
| PATCH | `/stories/:storyId/characters/:id` | partial fields | |
| DELETE | `/stories/:storyId/characters/:id` | — | also removes both relationship directions |
| GET | `/stories/:storyId/characters/:id/relationships` | — | normalized: `{ id, type, description, direction: 'outgoing'\|'incoming', otherCharacter }` |
| POST | `/stories/:storyId/characters/:id/relationships` | `{ targetCharacterId, type, description? }` | 400 on self-relationship or duplicate type |
| DELETE | `/stories/:storyId/characters/:id/relationships/:relId` | — | |

## Locations

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/stories/:storyId/locations` | — | flat list |
| GET | `/stories/:storyId/locations/tree` | — | nested `children[]` tree |
| POST | `/stories/:storyId/locations` | `{ name, type?, parentId?, description?, climate?, population? }` | parent must belong to same story |
| GET | `/stories/:storyId/locations/:id` | — | |
| PATCH | `/stories/:storyId/locations/:id` | partial fields | |
| DELETE | `/stories/:storyId/locations/:id` | — | children detached (parentId → null) |

## Timeline

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/stories/:storyId/timeline` | — | ordered by eventDate |
| POST | `/stories/:storyId/timeline` | `{ title, description, eventDate?, eventType?, importance?, characterIds?, locationIds? }` | eventType ∈ plot/character/location/battle/revelation |
| GET | `/stories/:storyId/timeline/:id` | — | includes characters + locations |
| PATCH | `/stories/:storyId/timeline/:id` | partial fields | |
| DELETE | `/stories/:storyId/timeline/:id` | — | |

## Writing Sessions

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/writing-sessions` | query: `?dateFrom=&dateTo=` (YYYY-MM-DD) | user's sessions, newest first |
| POST | `/writing-sessions` | `{ storyId, wordsWritten, durationMinutes?, sessionDate?, notes? }` | |
| DELETE | `/writing-sessions/:id` | — | |

## Stats

| Method | Path | Returns |
|---|---|---|
| GET | `/stats/dashboard` | `{ totalStories, totalWords, totalSessions, weeklyWords: [{ date, words }], streakDays, todayWords, dailyWordGoal }` |

## Health

| Method | Path | Returns |
|---|---|---|
| GET | `/` | `{ name, version, description, docs }` |

## Validation rules (class-validator)

- `email`: IsEmail, `password` ≥ 8 chars, `username` 3–30 chars
- `eventType`: IsIn([plot, character, location, battle, revelation])
- `role` (character): IsIn([protagonist, antagonist, supporting, minor, mentor, ally, villain, other])
- `archetype`: IsIn([hero, antihero, mentor, sidekick, trickster, guardian, rebel, lover, ruler, explorer, innocent, creator, other])
- Numbers (`eventDate`, `importance`, `age`, `population`, `wordGoal`) are IsInt with sane Min/Max.
