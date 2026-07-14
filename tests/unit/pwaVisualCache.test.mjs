import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('service worker precaches visual assets and serves them cache-first offline', async () => {
  const worker = await readFile(new URL('../../public/sw.js', import.meta.url), 'utf8')
  assert.match(worker, /\/assets\/visuals\/learning-hero\.svg/)
  assert.match(worker, /VISUAL_ASSET_PREFIX/)
  assert.match(worker, /if \(cached\)[\s\S]*return cached/)
  assert.match(worker, /event\.waitUntil\(networkRequest/)
  assert.match(worker, /toeic-sprint-shell-v3/)
})
