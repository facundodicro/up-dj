/* Service worker mínimo de Up!: solo habilita la instalación PWA.
 * No cachea nada a propósito: cada visita trae los archivos frescos
 * de la red, así nunca se sirve una versión vieja de la app. */
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Handler de fetch presente para instalabilidad, sin caché: todo pasa a la red.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
