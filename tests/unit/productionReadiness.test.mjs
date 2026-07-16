import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')

test('production build is minified and split into stable cache groups', async () => {
  const config = await read('vite.config.js')

  assert.doesNotMatch(config, /minify\s*:\s*false/)
  assert.match(config, /manualChunks/)
  assert.match(config, /question-bank/)
  assert.match(config, /supabase/)
})

test('unified question data does not ship the retired Part 5 source', async () => {
  const source = await read('src/data/questions.js')

  assert.doesNotMatch(source, /rawPart5Data/)
  assert.match(source, /rawPart7Data/)
  assert.match(source, /part5QuestionBank/)
})

test('application source avoids direct HTML injection and embedded service keys', async () => {
  const sourceFiles = [
    'src/App.jsx',
    'src/components/AppRoutes.jsx',
    'src/hooks/useAppController.js',
    'src/services/cloudUserService.js',
  ]
  const sources = await Promise.all(sourceFiles.map(read))
  const combined = sources.join('\n')

  assert.doesNotMatch(combined, /dangerouslySetInnerHTML|\.innerHTML\s*=|\beval\s*\(/)
  assert.doesNotMatch(combined, /service_role|SUPABASE_SERVICE_ROLE_KEY|eyJ[a-zA-Z0-9_-]{20,}/)
})

test('study-group UI never reads auth tokens or logs raw RPC payloads', async () => {
  const source = await read('src/pages/Friends.jsx')
  assert.doesNotMatch(source, /localStorage|access_token|VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY/)
  assert.doesNotMatch(source, /console\.log\s*\(/)
})