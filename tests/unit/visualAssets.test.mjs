import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'

import { VISUAL_ASSETS, VISUAL_ASSET_NAMES } from '../../src/assets/visuals/manifest.js'

test('visual manifest uses unique, dimensioned, descriptive local SVG assets', async () => {
  assert.deepEqual(VISUAL_ASSET_NAMES, ['hero', 'practice', 'result', 'review', 'favorites', 'weakness', 'empty'])
  const sources = new Set()

  for (const name of VISUAL_ASSET_NAMES) {
    const asset = VISUAL_ASSETS[name]
    assert.match(asset.src, /^\/assets\/visuals\/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/)
    assert.equal(asset.width, 320)
    assert.equal(asset.height, 240)
    assert.ok(asset.alt.length >= 4)
    assert.ok(!sources.has(asset.src), `${asset.src} must be unique`)
    sources.add(asset.src)

    const fileUrl = new URL(`../../public${asset.src}`, import.meta.url)
    const [source, details] = await Promise.all([readFile(fileUrl, 'utf8'), stat(fileUrl)])
    assert.ok(details.size < 12_000, `${asset.src} should stay below 12 KB`)
    assert.match(source, /viewBox="0 0 320 240"/)
    assert.doesNotMatch(source, /<script|(?:href|src)=["\']https?:\/\/|xlink:href/i)
  }
})

test('only the first-screen hero is marked as a priority asset', () => {
  assert.equal(VISUAL_ASSETS.hero.priority, true)
  assert.ok(VISUAL_ASSET_NAMES.filter((name) => VISUAL_ASSETS[name].priority).length === 1)
})
