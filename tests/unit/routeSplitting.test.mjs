import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')

test('page routes are lazy and large learning data is not imported by the shell', async () => {
  const [app, routes] = await Promise.all([
    read('src/App.jsx'),
    read('src/components/AppRoutes.jsx'),
  ])

  assert.match(app, /Suspense/)
  assert.match(routes, /lazy\(\(\) => import/)
  assert.doesNotMatch(routes, /\.\.\/data\/(questions|vocabulary)/)
})
