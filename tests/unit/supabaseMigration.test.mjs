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
