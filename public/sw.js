const CACHE_NAME = 'toeic-sprint-shell-v3'
const VISUAL_ASSET_PREFIX = '/assets/visuals/'
const VISUAL_ASSETS = [
  '/assets/visuals/learning-hero.svg',
  '/assets/visuals/practice-documents.svg',
  '/assets/visuals/result-progress.svg',
  '/assets/visuals/review-empty.svg',
  '/assets/visuals/favorites-bookmark.svg',
  '/assets/visuals/weakness-insights.svg',
  '/assets/visuals/empty-study.svg',
]
const APP_SHELL = ['/', '/manifest.webmanifest', '/favicon.svg', '/app-icon.svg', ...VISUAL_ASSETS]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))))
  self.clients.claim()
})

async function cacheVisualAsset(event, request) {
  const cached = await caches.match(request)
  const networkRequest = fetch(request).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(request, response.clone())
    }
    return response
  })

  if (cached) {
    event.waitUntil(networkRequest.catch(() => undefined))
    return cached
  }
  return networkRequest.catch(() => Response.error())
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/rest/')) return
  if (url.pathname.startsWith(VISUAL_ASSET_PREFIX)) {
    event.respondWith(cacheVisualAsset(event, request))
    return
  }

  event.respondWith((async () => {
    try {
      const response = await fetch(request)
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME)
        await cache.put(request, response.clone())
      }
      return response
    } catch {
      const cached = await caches.match(request)
      if (cached) return cached
      if (request.mode === 'navigate') return caches.match('/')
      return Response.error()
    }
  })())
})
