import { spawn, spawnSync } from 'node:child_process'
import process from 'node:process'

const host = '127.0.0.1'
const port = 4174
const localBaseURL = `http://${host}:${port}`
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL

const waitForServer = async (url, timeoutMs = 30000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

const stopOwnedProcess = (child) => {
  if (!child?.pid) return
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' })
  } else {
    child.kill('SIGTERM')
  }
}

const runPlaywright = (baseURL) => {
  const environment = {
    ...process.env,
    PLAYWRIGHT_BASE_URL: baseURL,
    PLAYWRIGHT_LOCAL_DEV: externalBaseURL ? '0' : '1',
  }
  delete environment.FORCE_COLOR
  delete environment.NO_COLOR
  const result = spawnSync(
    process.execPath,
    ['./node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)],
    {
      stdio: 'inherit',
      env: environment,
    },
  )
  if (result.error) throw result.error
  return result.status ?? 1
}

let server
try {
  if (!externalBaseURL) {
    server = spawn(
      process.execPath,
      ['./node_modules/vite/bin/vite.js', '--host', host, '--port', String(port)],
      { stdio: 'ignore', windowsHide: true, detached: true },
    )
    server.unref()
    await waitForServer(localBaseURL)
  }
  process.exitCode = runPlaywright(externalBaseURL || localBaseURL)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  stopOwnedProcess(server)
}
