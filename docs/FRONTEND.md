# Quill — Frontend Guide

Angular 22 standalone-component app. No NgModules, no Tailwind — a hand-rolled design system
named **Inkwell** lives in `src/styles.css` (917 lines of CSS custom-property tokens).

## Bootstrapping

- `main.ts` → `bootstrapApplication(App, appConfig)`
- `app.config.ts`: `provideZonelessChangeDetection()`, `provideHttpClient(withInterceptors([authInterceptor]))`,
  `provideRouter(routes)`, `provideAnimationsAsync()`
- `app.routes.ts`: 16 routes — public (login, register) and protected (everything else via `authGuard`).

## Design system — Inkwell

Tokens are CSS custom properties on `:root` / `[data-theme="dark"]`:

```css
:root {
  --color-bg: #F7F4EE;        /* parchment */
  --color-surface: #FFFFFF;
  --color-ink: #26221C;       /* near-black brown */
  --color-muted: #6E675C;
  --color-accent: #A65E2E;    /* burnt sienna */
  --color-border: #E4DED2;
  --color-success: #3E7C4F;
  --color-danger: #B23A3A;
  --space-xs: 4px; --space-sm: 8px; --space-md: 16px; --space-lg: 24px; --space-xl: 40px;
  --radius: 10px;
  --font-body: "Alegreya Sans", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Alegreya", Georgia, serif;   /* prose / story text */
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
html[data-theme="dark"] { /* warm lamplight variant */ }
```

Semantic classes used across pages: `.sidebar`, `.topbar`, `.container`, `.page`, `.page-header`,
`.card`, `.story-card`, `.character-card`, `.btn` / `.btn-primary` / `.btn-secondary` / `.btn-danger`,
`.badge` (+ `.badge-accent`, `.badge-warning`), `.chip` (+ `.active`), `.empty-state`, `.modal-overlay`,
`.modal`, `.confirm-dialog`, `.form-group`, `.form-alert`, `.progress-track` / `.progress-fill`,
`.word-counter`, `.timeline` / `.timeline-item` / `.timeline-dot`, `.tree-item`, `.skeleton`,
`.muted`, `.serif`, `.mono`, `.flex`, `.flex-between`, `.grid`, `.gap-sm`, `.wrap`.

### Theme

`ThemeService` reads `quill_theme` from localStorage ('light' default), exposes an `isDark` signal,
and flips `document.documentElement.dataset.theme`. The layout shell's toggle calls `theme.toggle()`.
`index.html` pre-sets `data-theme="light"` to avoid a dark flash.

## State management

Signals only — no NgRx. Each service holds the list it manages as a signal and exposes
`isLoading()`:

```ts
export class StoryService {
  private http = inject(HttpClient);
  stories = signal<Story[]>([]);
  isLoading = signal(false);
  async loadStories() { this.isLoading.set(true);
    this.stories.set(await firstValueFrom(this.http.get<Story[]>(`${API}/stories`)));
    this.isLoading.set(false); }
}
```

`AuthService` keeps `currentUser` as a signal and persists the JWT under `quill_token`;
`authInterceptor` attaches the Bearer header; `authGuard` redirects to `/login` when absent.

## Routing (16)

| Route | Page | Purpose |
|---|---|---|
| `/login` · `/register` | auth pages | public |
| `/` | dashboard | stats overview + recent stories + new-story modal |
| `/stories` | story-list | grid of story cards, create/edit/archive |
| `/stories/:storyId` | story-detail | tabs: overview / chapters / characters / locations / timeline + stats |
| `/stories/:storyId/chapters` | chapter-list | list + drag-style reorder (PUT reorder) |
| `/stories/:storyId/chapters/:id` | chapter-detail | scene list per chapter |
| `/stories/:storyId/chapters/:id/scenes/new` | scene-editor | textarea with live word counter |
| `/stories/:storyId/characters` | character-list | cards grid |
| `/stories/:storyId/characters/new` · `/:id/edit` | character-form | create/edit |
| `/stories/:storyId/characters/:id` | character-detail | profile + relationship graph + add-relationship modal |
| `/stories/:storyId/locations` | location-list | recursive tree view |
| `/stories/:storyId/locations/new` · `/:id/edit` | location-form | create/edit with parent picker |
| `/stories/:storyId/locations/:id` | location-detail | location card + child locations |
| `/stories/:storyId/timeline` | timeline-view | vertical timeline, type filters, importance stars |
| `/settings` | settings | profile, word goal, appearance, password, recent sessions |

All story-scoped routes resolve the story once via `StoryService.getStory(id)` (cached in
`currentStory` signal) so every child page shows the breadcrumb title.

## Shared components

| Component | Usage |
|---|---|
| `story-card` | title, genre badge, synopsis, word count, cover color bar |
| `character-card` | avatar circle (initials + color), name, role, tags |
| `empty-state` | icon + title + description + optional action button |
| `modal` | overlay + dialog shell with title and close |
| `confirm-dialog` | destructive-action confirmation |
| `word-counter` | `current / goal` words + progress bar |
| `progress-bar` | thin track/fill |
| `location-node` | recursive tree row (depth indentation, icons per type) |

## Key flows

**Create story → first chapter → first scene:** dashboard "+ New story" opens a modal;
story-detail shows an empty-state CTA to add a chapter; chapter-detail lists scenes with an
empty-state CTA to open the editor. The scene editor counts words live and saves via PATCH;
the server recomputes `wordCount` and story stats update on return.

**Timeline:** pick a type chip to filter, "+ Add event" opens a modal with character/location
multi-select chips, importance 1–5 selector; events render with color-coded dots per type.

**Settings:** profile form (username, daily word goal, avatar URL), appearance toggle, change
password (with inline error from the API), and the last 8 writing sessions.

## Conventions

- Standalone components with `template` inline; no separate `.html` files.
- `inject()` everywhere; constructor param injection only in pages that subscribe to `paramMap`.
- `firstValueFrom` + `async/await` in services; `signal`/`input`/`output` for state.
- Models in `models/models.ts` mirror the API DTOs 1:1.
- Error handling: try/catch in page actions, `.form-alert` for inline messages, empty-states for
  missing data — no unhandled promise rejections.
- All lists show `.skeleton` placeholders while `isLoading()`.
