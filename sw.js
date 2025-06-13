const CACHE_NAME = 'qr-scanner-v1';
const ASSETS = [
  '/',
  'index.html',
  'styles.css',
  'app.js',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js',
  'icon-192x192.png',
  'icon-512x512.png'
];

// Instalar el Service Worker y guardar en caché los recursos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS);
      })
  );
});

// Interceptar solicitudes y servir desde caché si está disponible
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Devuelve la respuesta en caché o realiza la petición
        return response || fetch(event.request);
      })
  );
});

// Eliminar caches antiguos al activar una nueva versión
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
