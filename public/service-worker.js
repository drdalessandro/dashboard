// service-worker.js - Gandall Healthcare Platform
// Enhanced service worker for comprehensive offline-first functionality

const CACHE_NAME = 'gandall-healthcare-v2';
const RUNTIME_CACHE = 'gandall-runtime-v2';
const API_CACHE = 'gandall-api-v2';

// Version control
const VERSION = '1.1.0';

// Resources to cache on install
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/static/css/',
  '/static/js/'
];

// API cache strategies
const API_STRATEGIES = {
  'GET_PATIENT': {
    networkTimeoutSeconds: 5,
    cacheExpiration: 1 * 60 * 60, // 1 hour
    staleWhileRevalidate: true
  },
  'GET_PATIENTS_LIST': {
    networkTimeoutSeconds: 4,
    cacheExpiration: 30 * 60, // 30 minutes
    staleWhileRevalidate: true
  },
  'DEFAULT': {
    networkTimeoutSeconds: 3,
    cacheExpiration: 15 * 60, // 15 minutes
    staleWhileRevalidate: true
  }
};

// Install event - cache static resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching static assets');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('gandall-') &&
            cacheName !== CACHE_NAME &&
            cacheName !== RUNTIME_CACHE;
        }).map(cacheName => {
          console.log('[Service Worker] Removing old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper to determine if request is for an API
const isApiRequest = (url) => {
  return url.pathname.includes('/api/') || url.pathname.includes('/fhir/');
};

// Helper to determine request category for cache strategy
const getRequestCategory = (url) => {
  if (url.pathname.includes('/Patient/') && !url.pathname.includes('_search')) {
    return 'GET_PATIENT';
  } else if (url.pathname.includes('/Patient') && url.pathname.includes('_search')) {
    return 'GET_PATIENTS_LIST';
  }
  return 'DEFAULT';
};

// Fetch event - network first with cache fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // For API requests - use stale-while-revalidate
  if (isApiRequest(url)) {
    const category = getRequestCategory(url);
    const strategy = API_STRATEGIES[category] || API_STRATEGIES.DEFAULT;

    event.respondWith(handleApiRequest(event.request, strategy));
    return;
  }

  // For non-API requests - use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached response
          return cachedResponse;
        }

        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200) {
              return response;
            }

            // Cache successful responses
            return caches.open(RUNTIME_CACHE)
              .then(cache => {
                cache.put(event.request, response.clone());
                return response;
              });
          })
          .catch(error => {
            console.error('[Service Worker] Fetch failed:', error);

            // If it's a page navigation, show offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }

            return new Response('Network error occurred', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Handle API requests with stale-while-revalidate pattern
async function handleApiRequest(request, strategy) {
  const cacheKey = request.url;

  // Try to get from cache first
  const cachedResponse = await caches.match(request);

  // Start the network request
  const networkPromise = fetch(request.clone())
    .then(response => {
      if (!response || response.status !== 200) {
        return response;
      }

      // Update the cache with the new response
      const responseCopy = response.clone();
      caches.open(RUNTIME_CACHE).then(cache => {
        cache.put(request, responseCopy);

        // Post message to client about updated cache
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'CACHE_UPDATED',
              url: request.url
            });
          });
        });
      });

      return response;
    })
    .catch(error => {
      console.error('[Service Worker] API Fetch failed:', error);

      // If we have a cached response, we'll use that instead
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise, return an error response
      return new Response(JSON.stringify({
        error: 'Network request failed',
        offline: true,
        timestamp: new Date().toISOString()
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    });

  // If we have a cached response, return it immediately (stale)
  if (cachedResponse) {
    // Clone the cached response
    const staleResponse = cachedResponse.clone();

    // Start revalidation in background if staleWhileRevalidate is enabled
    if (strategy.staleWhileRevalidate) {
      event.waitUntil(networkPromise);
    }

    return staleResponse;
  }

  // No cached response, wait for the network
  return networkPromise;
}

// Listen for messages from clients
self.addEventListener('message', event => {
  if (!event.data) return;

  const data = event.data;
  console.log('[Service Worker] Message received:', data.type);

  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.filter(name => name.startsWith('gandall-'))
              .map(cacheName => {
                console.log('[Service Worker] Deleting cache:', cacheName);
                return caches.delete(cacheName);
              })
          );
        }).then(() => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: true });
          }
          return self.clients.matchAll();
        }).then(clients => {
          // Notify clients about cache cleared
          clients.forEach(client => {
            client.postMessage({
              type: 'CACHE_CLEARED',
              timestamp: new Date().toISOString()
            });
          });
        }).catch(error => {
          console.error('[Service Worker] Cache clearing failed:', error);
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
              success: false,
              error: error.message || 'Unknown error'
            });
          }
        })
      );
      break;

    case 'ONLINE_STATUS_CHANGED':
      // Broadcast to all clients
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          if (client.id !== event.source?.id) {
            client.postMessage({
              type: 'ONLINE_STATUS_CHANGED',
              status: data.status,
              timestamp: new Date().toISOString()
            });
          }
        });
      });

      // Trigger sync if coming online
      if (data.status === 'online') {
        event.waitUntil(self.registration.sync.register('sync-pending-changes'));
      }
      break;
  }
});

// Background sync for offline operations
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pending-changes') {
    console.log('[Service Worker] Background sync triggered');
    event.waitUntil(syncPendingChanges());
  }
});

// Function to sync pending changes
async function syncPendingChanges() {
  console.log('[Service Worker] Performing background sync');

  try {
    const clients = await self.clients.matchAll();

    if (clients.length === 0) {
      console.log('[Service Worker] No active clients, opening a window');
      await self.clients.openWindow('/');
      // Wait a bit for the window to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newClients = await self.clients.matchAll();

      // Notify new clients
      newClients.forEach(client => {
        client.postMessage({
          type: 'PERFORM_SYNC',
          initiator: 'service-worker',
          timestamp: new Date().toISOString()
        });
      });
    } else {
      // Notify existing clients
      clients.forEach(client => {
        client.postMessage({
          type: 'PERFORM_SYNC',
          initiator: 'service-worker',
          timestamp: new Date().toISOString()
        });
      });
    }

    console.log('[Service Worker] Sync notification sent to clients');
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
    return Promise.reject(error);
  }
}
