# Supabase setup and data boundary

The app is local-first. Without Supabase environment variables, guest mode remains fully usable and stores the normalized user profile in local storage. No secret, service-role key, or private credential belongs in `VITE_*` variables.

For cloud sync, configure only the public project URL and anonymous key, then apply migrations in `supabase/migrations` in filename order. The production migration creates `profiles`, private `user_data`, and intentionally limited `user_public_stats` tables.

- `user_data.app_data` contains answers, mistakes, favorites, goals, and learning progress. RLS restricts every operation to `auth.uid() = user_id`.
- `profiles` is private to the signed-in owner.
- `user_public_stats` contains only leaderboard-safe aggregate fields. Authenticated users may read it for the existing friends feature, while only the owner can write their row.
- Anonymous users receive no table grants.

If a sync request fails, the application keeps the locally saved update and exposes a retry state rather than blocking practice.
