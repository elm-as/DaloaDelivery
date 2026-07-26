// Service Worker pour PWA DaloaDelivery
// Mode Network-First avec fallback cache pour l'App Shell
// Important: Ne JAMAIS mettre en cache les requêtes API Supabase (cross-origin)
const CACHE_NAME = 'daloa-delivery-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.png',
  '/apple-touch-icon.png',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorer les requêtes non-GET ou cross-origin (ex: Supabase)
  if (request.method !== 'GET') return;
  try {
    const u = new URL(request.url);
    if (u.origin !== self.location.origin) {
      return;
    }
    // Ignorer en mode dev Vite
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.pathname.startsWith('/@vite') || u.pathname.startsWith('/src/')) {
      return;
    }
  } catch {
    return;
  }

  // Strategie Network-First avec secours sur le cache
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
        });
      })
  );
});

// ========================================
// Web Push Notification & Vibration Handlers pour DaloaDelivery
// ========================================

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: '🛵 DaloaDelivery',
      body: event.data.text(),
      icon: '/android-chrome-192x192.png',
      url: '/dashboard',
    };
  }

  const options = {
    body: data.body || 'Une nouvelle course est disponible à Daloa !',
    icon: data.icon || '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    data: { url: data.url || '/dashboard' },
    // Pattern de vibration prolongée spécifique aux livreurs (500ms vibrer, 200ms pause, 500ms vibrer...)
    vibrate: [500, 200, 500, 200, 500],
    tag: data.tag || 'daloadelivery-course-alert',
    renotify: true,
    actions: [
      { action: 'open', title: '⚡ Voir la course', icon: '/favicon-32x32.png' },
      { action: 'dismiss', title: 'Fermer' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🛵 Nouvelle Course Disponible !', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      return self.clients.openWindow(urlToOpen);
    })
  );
});
