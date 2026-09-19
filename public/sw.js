// Service Worker para FisMovie PWA (Lightweight & Safe)
const CACHE_NAME = 'fismovie-pwa-v2';
const OFFLINE_URL = '/offline';

const PRECACHE_ASSETS = [
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// Install: Pré-armazena apenas os ativos essenciais de emergência
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate: Limpa caches legados
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Apenas intercepta se a navegação falhar por estar sem internet (Fallback Offline)
// NUNCA duplica requisições e NUNCA intercepta arquivos internos de compilação (_next)
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Apenas requisições GET normais
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);

  // Ignora chamadas de API, hot reload, dev server e chunks dinâmicos
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next') ||
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.port === '3000' ||
    url.port === '3001' ||
    url.port === '3333'
  ) {
    return; // Pass-through direto e nativo do navegador
  }

  // Se for navegação de página HTML, tenta a rede; se falhar (sem internet), serve o /offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedFallback = await cache.match(OFFLINE_URL);
        return cachedFallback || new Response('Offline', { status: 503, statusText: 'Offline' });
      })
    );
  }
});
