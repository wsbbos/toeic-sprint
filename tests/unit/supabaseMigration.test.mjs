import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migrationUrl = new URL('../../supabase/migrations/202607130001_production_mvp_user_data.sql', import.meta.url)

test('production migration creates private user data with RLS owner policies', async () => {
  const sql = (await readFile(migrationUrl, 'utf8')).toLowerCase()
  assert.match(sql, /create table if not exists public\.user_data/)
  assert.match(sql, /alter table public\.user_data enable row level security/)
  assert.match(sql, /auth\.uid\(\).*user_id/)
  assert.match(sql, /revoke all on public\.profiles, public\.user_data, public\.user_public_stats from anon/)
  assert.doesNotMatch(sql, /service_role|eyj[a-z0-9_-]{20,}/)
})

test('historical study-group migration is safe on a fresh database', async () => {
  const url = new URL('../../supabase/migrations/202606300001_join_study_group_by_invite_code.sql', import.meta.url)
  const sql = (await readFile(url, 'utf8')).toLowerCase()
  const createGroupsAt = sql.indexOf('create table if not exists public.study_groups')
  const createMembersAt = sql.indexOf('create table if not exists public.group_members')
  const joinFunctionAt = sql.indexOf('create or replace function public.join_study_group_by_invite_code')
  assert.ok(createGroupsAt >= 0 && createGroupsAt < joinFunctionAt)
  assert.ok(createMembersAt >= 0 && createMembersAt < joinFunctionAt)
  assert.doesNotMatch(sql.slice(0, joinFunctionAt), /from public\.profiles/)
})
test('study-group migration creates constrained tables, owner-safe RLS and authenticated RPCs', async () => {
  const url = new URL('../../supabase/migrations/202607160001_study_groups_hardening.sql', import.meta.url)
  const sql = (await readFile(url, 'utf8')).toLowerCase()
  assert.match(sql, /create table if not exists public\.study_groups/)
  assert.match(sql, /create table if not exists public\.group_members/)
  assert.match(sql, /alter table public\.study_groups enable row level security/)
  assert.match(sql, /alter table public\.group_members enable row level security/)
  assert.match(sql, /create or replace function public\.create_study_group/)
  assert.match(sql, /security definer/)
  assert.match(sql, /grant execute on function public\.create_study_group/)
  assert.match(sql, /grant execute on function public\.join_study_group_by_invite_code/)
  assert.match(sql, /revoke all on public\.study_groups, public\.group_members from anon/)
})