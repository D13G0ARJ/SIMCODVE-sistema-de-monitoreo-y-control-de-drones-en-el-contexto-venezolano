/* Service worker de SIMCODVE. Guarda en caché lo estático (scripts con hash,
   fuentes, capturas WebP) para que la página vuelva a abrir al instante y sin
   señal. El HTML va red primero con respaldo en caché. El PDF nunca se cachea. */
const VERSION = 'simcodve-v1'
const CACHEABLE = [/^\/assets\//, /^\/sistema\/webp\//, /^\/unefa\.png$/]

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.endsWith('.pdf')) return

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copia = res.clone()
          caches.open(VERSION).then((c) => c.put('/', copia))
          return res
        })
        .catch(() => caches.match('/')),
    )
    return
  }

  if (CACHEABLE.some((re) => re.test(url.pathname))) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copia = res.clone(); caches.open(VERSION).then((c) => c.put(req, copia)) }
        return res
      })),
    )
  }
})
