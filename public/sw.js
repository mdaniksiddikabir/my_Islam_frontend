const CACHE_NAME = 'islamic-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Hind+Siliguri:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker installed');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Cache install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔧 Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests like Google Fonts
  if (event.request.url.startsWith('http') && !event.request.url.startsWith(self.location.origin)) {
    // For cross-origin requests, just fetch normally
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response
          return cachedResponse;
        }

        // Clone the request for fetch
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((networkResponse) => {
            // Check if valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone for caching
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Only cache same-origin requests
                if (event.request.url.startsWith(self.location.origin)) {
                  cache.put(event.request, responseToCache);
                }
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('❌ Fetch failed:', error);
            // Return offline fallback
            return caches.match('/offline.html');
          });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  let data = {};
  
  try {
    data = event.data.json();
  } catch (e) {
    console.error('❌ Push data parse error:', e);
    data = {
      title: 'Islamic App',
      body: 'You have a new notification',
      url: '/'
    };
  }

  const options = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'খুলুন'
      },
      {
        action: 'close',
        title: 'বন্ধ করুন'
      }
    ],
    tag: 'prayer-notification',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Islamic App', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Background sync for prayer times
self.addEventListener('sync', (event) => {
  if (event.tag === 'prayer-sync') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(syncPrayerTimes());
  }
});

// Helper function for background sync
async function syncPrayerTimes() {
  try {
    console.log('🔄 Syncing prayer times...');
    
    const cache = await caches.open(CACHE_NAME);
    
    // Get user's location from IndexedDB or localStorage
    // For now, use default location
    const defaultLocation = {
      lat: 23.8103,
      lng: 90.4125
    };
    
    const response = await fetch(`/api/prayer/times?lat=${defaultLocation.lat}&lng=${defaultLocation.lng}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Store in cache for offline use
    await cache.put('/api/prayer/times', new Response(JSON.stringify(data)));
    
    // Also cache individual prayer times for offline access
    if (data.data?.timings) {
      await cache.put('/api/prayer/today', new Response(JSON.stringify(data.data.timings)));
    }
    
    console.log('✅ Prayer times synced successfully');
    
    // Show sync complete notification
    await self.registration.showNotification('Sync Complete', {
      body: 'Prayer times updated for offline use',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png'
    });
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    
    // Notify user of sync failure
    await self.registration.showNotification('Sync Failed', {
      body: 'Unable to update prayer times. Check your connection.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png'
    });
  }
}

// Optional: Periodic sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-prayer-times') {
    event.waitUntil(syncPrayerTimes());
  }
});

// Message event for client communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
  }
});
