import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('PWA manifest and service worker expose an installable local-first shell', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../public/manifest.webmanifest', import.meta.url), 'utf8'))
  const worker = await readFile(new URL('../../public/sw.js', import.meta.url), 'utf8')
  assert.equal(manifest.display, 'standalone')
  assert.ok(manifest.icons.some((icon) => icon.purpose.includes('maskable')))
  assert.match(worker, /url\.origin !== self\.location\.origin/)
  assert.match(worker, /caches\.match\('\/'\)/)
})
