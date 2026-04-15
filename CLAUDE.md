# Whitman Fitman

A React-based workout tracker built for personal use. Mobile-first, installable as a web app, entirely client-side. Users log sets-based lifts and interval-based work, build reusable templates, and review progress through trends and a calendar heatmap. Tier-based auto-progression handles weight increases when rep goals are hit.

## Stack

- **React 18** + **Vite** (no TypeScript)
- **Tailwind CSS** with class-based dark mode (`darkMode: 'class'`)
- **Recharts** for trends charts
- **localStorage only** — no backend, no API, no auth
- **JSDoc types** with `checkJs` for editor-based type safety — no TypeScript compiler step

## Running locally

```bash
npm install
npm run dev     # start Vite dev server
npm run build   # production build to dist/
npm run preview # preview the production build
```

## Structure at a glance

| Path | Role |
|---|---|
| `src/FitnessTracker.jsx` | Top-level shell. Holds all app state, handles tab routing, theme, default-merging, and the backup reminder |
| `src/components/features/` | Tab-level views and feature components (workout, templates, trends, calendar, settings) |
| `src/components/ui/` | Generic UI primitives (`Button`, `Modal`, `Card`, `Tabs`, steppers, etc.) |
| `src/components/icons/Icons.jsx` | Centralized SVG icon set |
| `src/hooks/` | Reusable hooks — `useLocalStorage`, `useTimer`, `useIntervalTimer`, `useWakeLock`, `useLongPress` |
| `src/utils/constants.js` | Storage keys, defaults, difficulty levels, tier system constants |
| `src/utils/workoutUtils.js` | Domain logic — tier auto-progression, template migration, difficulty averaging, volume calc |
| `src/utils/helpers.js` | Small generic utilities (date keys, time formatting, id generation) |
| `src/utils/storage.js` | `localStorage` get/set wrappers |
| `src/types.js` | JSDoc `@typedef`s for all core data shapes — the source of truth |
| `jsconfig.json` | Enables `checkJs` so the editor type-checks JSDoc annotations |

## Core conventions

- **Persistence.** All state that outlives a render goes through `useLocalStorage` keyed off `STORAGE_KEYS` in `src/utils/constants.js`. Never write to `localStorage` directly from components.
- **No backend.** No API calls. No auth. Everything lives in the browser. Backups are user-initiated exports.
- **State ownership.** App-wide state is declared in `FitnessTracker.jsx` and passed down as props. No context, no Redux. Keep it that way unless prop drilling genuinely becomes painful.
- **Dark mode.** Controlled from `FitnessTracker.jsx` via a class on `<html>`. Theme setting (`system | light | dark`) lives in the settings object.
- **Icons.** Always import from `src/components/icons/Icons.jsx`. Do not inline SVGs in feature components.
- **Feature vs. UI split.** `src/components/features/` = tab-level views and workout-specific components. `src/components/ui/` = generic, reusable, no domain knowledge. Don't cross the line.
- **Types.** Data shapes are defined in `src/types.js` as JSDoc `@typedef`s. Reference them from other files via `import('./types').TypeName`. When a shape changes, update `src/types.js` in the same commit. Two exceptions that stay untyped by design: icon components in `Icons.jsx` (no meaningful props) and `main.jsx` (trivial entry point).

## Where to look deeper

- **Non-obvious behaviors, data flow, storage schema:** [`docs/architecture.md`](docs/architecture.md)
- **Data shapes (workouts, exercises, templates, etc.):** [`src/types.js`](src/types.js)

## Gotchas

_Things that have tripped us up. Add an entry when something is non-obvious, bit us twice, or would save a future session work. Format:_

### [Short title]
- **Date:** YYYY-MM-DD
- **Context:** What we were doing
- **Problem:** What went wrong or was confusing
- **Root cause:** Why it happened
- **Resolution:** What we did, or how to avoid in future

---

_No entries yet._
