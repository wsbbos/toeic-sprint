# Production MVP Baseline Audit

Date: 2026-07-13
Branch: `feat/toeic-sprint-production-mvp`
Baseline HEAD: `95d50ad fix: restore Part 5 MVP and resolve runtime blank screen`

## Verified starting state

- The only working directory is `C:\dev\toeic-sprint-original`.
- The worktree was clean before Phase 1 changes.
- `origin` remains `https://github.com/wsbbos/toeic-sprint.git`; no remote settings were changed.
- Existing scripts were `dev`, `build`, `lint`, and `preview`; there was no automated test command.
- `npm run build` passed. The unminified main JavaScript bundle was 1,547.25 kB (321.28 kB gzip).
- `npm run lint` passed with zero reported errors.

## Protected working features and assets

The repeatable baseline check fails if any of these regress:

- Part 5 remains available with at least the original 20 structured questions.
- Part 7 remains separate and available with its 30 reading questions.
- Listening, practice, mock test, wrong-book, and result page entry points remain present.
- The Supabase client and the existing study-group migration remain present.

Run the complete baseline gate with:

`npm run verify:baseline`

Run only the fast Node baseline tests with:

`npm run test:baseline`

## Current data inventory

- Formal Part 5 bank: 20 questions.
- Part 5 answer positions: A=9, B=8, C=3, D=0.
- Part 5 schema currently lacks a dedicated category and version field.
- Part 7 bank: 30 questions in the unified adapter.
- `questions.js` also contains a legacy 100-item compact Part 5 array that is not exported or used.
- The legacy array duplicates the active Part 5 concern and materially inflates maintenance cost.

## Runtime and architecture findings

1. `App.jsx` is 1,275 lines and mixes routing, authentication, data migration, cloud sync, sanitization, study progress, wrong-book logic, and rendering.
2. When Supabase environment variables are absent, the whole app returns a configuration warning. Core guest practice is unavailable.
3. The cached cloud user is parsed at startup without a guard; malformed local storage can crash before the UI renders.
4. User updates are deep-cloned, persisted, and synced from multiple handlers, creating race and duplication risk.
5. Practice and mock-test session state is mostly component-local, so refresh recovery and duplicate-submit protection are incomplete.
6. `Friends.jsx` contains verbose diagnostic logging and direct token/local-storage access alongside UI code.
7. `Dashboard.jsx`, `Friends.jsx`, and `App.jsx` are oversized and combine derivation with rendering.
8. Import specifiers in `questions.js` rely on Vite extension resolution and cannot be imported directly by Node ESM.
9. Vite production minification is disabled, and the current bundle includes large eager data modules.
10. Only one database migration is present; the repository does not yet define the full user-data tables, indexes, constraints, and RLS policies needed for reproducible setup.
11. Loading, offline, empty, and permission states are handled inconsistently across pages.
12. There is no Vitest, React Testing Library, Playwright, CI, or question-bank validation infrastructure.

## Safety decisions for the upgrade

- Keep React and Vite; do not rewrite the application or replace the routing model without need.
- Preserve Part 7 and Supabase behavior while extracting boundaries around them.
- Build guest/local fallback before changing cloud behavior.
- Add tests before every new behavior or bug fix.
- Keep every phase buildable and independently revertible.
- Do not push, merge, deploy, switch to `main`, or change remote settings.
