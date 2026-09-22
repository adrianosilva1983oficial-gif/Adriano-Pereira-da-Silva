/**
 * AquaSane Pro - Service Worker Principal
 * Integra suporte a Offline Caching e Notificações Push em Segundo Plano.
 */

// Importa o handler de notificações push
importScripts('/sw-push.js');

const CACHE_NAME = 'aquasane-offline-cache-v2';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest-mobile.webmanifest',
  '/manifest-web.webmanifest',
  '/icon-mobile.svg',
  '/icon-web.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Pré-cacheamento parcial concluído:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      }),
    ])
  );
});

// Cache-First para recursos estáticos locais com Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // Não intercepta chamadas de WebSocket, APIs externas ou scripts de terceiros dinâmicos
  if (url.protocol.startsWith('ws') || url.pathname.startsWith('/api')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
          return networkResponse;
        })
        .catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
