begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text not null default 'Learner' check (char_length(username) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  app_data jsonb not null default '{}'::jsonb check (jsonb_typeof(app_data) = 'object'),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_public_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Learner' check (char_length(display_name) between 1 and 80),
  streak_days integer not null default 0 check (streak_days >= 0),
  today_completion_rate integer not null default 0 check (today_completion_rate between 0 and 100),
  total_questions_answered integer not null default 0 check (total_questions_answered >= 0),
  total_wrong_count integer not null default 0 check (total_wrong_count >= 0),
  mock_high_score integer not null default 0 check (mock_high_score between 0 and 990),
  updated_at timestamptz not null default now()
);

create index if not exists user_data_updated_at_idx on public.user_data(updated_at desc);
create index if not exists user_public_stats_rank_idx on public.user_public_stats(total_questions_answered desc, streak_days desc);

alter table public.profiles enable row level security;
alter table public.user_data enable row level security;
alter table public.user_public_stats enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "profiles_write_own" on public.profiles;
create policy "profiles_write_own" on public.profiles for all to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "user_data_select_own" on public.user_data;
create policy "user_data_select_own" on public.user_data for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "user_data_insert_own" on public.user_data;
create policy "user_data_insert_own" on public.user_data for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "user_data_update_own" on public.user_data;
create policy "user_data_update_own" on public.user_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "user_data_delete_own" on public.user_data;
create policy "user_data_delete_own" on public.user_data for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "public_stats_read_authenticated" on public.user_public_stats;
create policy "public_stats_read_authenticated" on public.user_public_stats for select to authenticated using (true);
drop policy if exists "public_stats_write_own" on public.user_public_stats;
create policy "public_stats_write_own" on public.user_public_stats for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.profiles, public.user_data, public.user_public_stats from anon;
grant select, insert, update, delete on public.profiles, public.user_data, public.user_public_stats to authenticated;

commit;
