# TOEIC Sprint Frontend Architecture

## Runtime layers

- `App.jsx`: application shell only. It selects the setup/loading state, navbar, route outlet, and import modal.
- `hooks/useAppController.js`: coordinates page state and delegates persistence, progress, and cloud work.
- `hooks/useSupabaseSession.js`: owns the Supabase auth subscription lifecycle and cleanup.
- `components/AppRoutes.jsx`: the single page-to-component mapping. Existing page IDs remain compatible.
- `components/AppLoadingState.jsx`, `SupabaseSetupScreen.jsx`, and `LocalImportModal.jsx`: shared system states.
- `services/localUserRepository.js`: guarded local JSON access and auth-cache cleanup.
- `services/cloudUserService.js`: Supabase profile, app-data, and public-stat projections.
- `services/userProgressService.js`: immutable practice, mock, vocabulary, and wrong-book updates.
- `data/userProfile.js`: canonical default values and backward-compatible profile normalization.
- `utils/errorSanitizer.js`: stale-session classification and sensitive error masking.

## Data flow

1. The auth hook receives a session from Supabase.
2. The controller asks the cloud service for the user's app data or creates a normalized default profile.
3. The repository caches the normalized profile locally.
4. Pages emit domain events through `actions`.
5. The progress service returns a new profile without mutating the previous state.
6. The controller stores locally first, then attempts cloud sync.
7. A cloud failure changes `syncStatus` to `failed` while preserving the local update.

## Error and loading conventions

- `syncStatus` is one of `synced`, `syncing`, or `failed`.
- Errors shown to UI are produced by `sanitizeError`; JWTs and Supabase project URLs are masked.
- Malformed local JSON returns `null` instead of crashing application startup.
- Initial session loading uses a shared status component.
- Public leaderboard statistics are a deliberate projection and exclude email and private study payloads.

## Compatibility boundaries

- Existing page IDs and Navbar navigation are unchanged.
- Part 7 stays inside the unified `questionsData` adapter and is not mixed into Part 5 source data.
- Existing Supabase table names remain `profiles`, `user_data`, and `user_public_stats`.
- Guest mode and offline fallback use the same repository/service boundaries and remain available when Supabase is absent or unavailable.


## Production loading boundary

- AppRoutes.jsx lazy-loads page modules behind the shell-level React Suspense fallback.
- Route adapters load the unified question bank and vocabulary only when their feature is opened.
- Vite emits stable cache groups for React, Supabase, and Part 5 question data.
- Part 5 validation remains a Node/CI concern; runtime imports only the validated production bank.


## Visual content boundary

- Part 7 legacy passages enter a backward-compatible document model before rendering; Part 5 and Part 7 source banks remain separate.
- Answer evidence is source-backed data, not presentation-only highlighting. Production tests require all 30 Part 7 quotes to exist in their passages.
- Route-level pages use original standalone SVG assets through a manifest and lazy image component. Small icons remain inline SVG.
- Standalone assets have fixed dimensions, CSS placeholders, an inline fallback, and service-worker cache coverage.
- Visual implementation and extension rules are documented in [visual-content-system.md](visual-content-system.md).
