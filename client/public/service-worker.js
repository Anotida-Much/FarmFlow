// Service Worker for FarmFlow PWA

const CACHE_NAME = 'farmflow-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return the cached response
        if (response) {
          return response;
        }

        // Clone the request because it's a one-time-use stream
        const fetchRequest = event.request.clone();

        // Try the network first
        return fetch(fetchRequest)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a one-time-use stream
            const responseToCache = response.clone();

            // Don't cache API calls
            if (!event.request.url.includes('/api/')) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // If both cache and network fail, try to return a fallback for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
          });
      })
  );
});

// Handle background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  } else if (event.tag === 'sync-inventory') {
    event.waitUntil(syncInventory());
  }
});

// Background sync function for tasks
const syncTasks = async () => {
  try {
    const offlineTaskQueue = await getOfflineTaskQueue();
    
    if (offlineTaskQueue.length > 0) {
      for (const task of offlineTaskQueue) {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task),
          credentials: 'include'
        });
      }
      
      // Clear the queue after successful sync
      await clearOfflineTaskQueue();
      
      // Show notification to user
      self.registration.showNotification('FarmFlow', {
        body: 'Your tasks have been synced successfully!',
        icon: '/icon.png'
      });
    }
  } catch (error) {
    console.error('Task sync failed:', error);
  }
};

// Background sync function for inventory
const syncInventory = async () => {
  try {
    const offlineInventoryQueue = await getOfflineInventoryQueue();
    
    if (offlineInventoryQueue.length > 0) {
      for (const item of offlineInventoryQueue) {
        await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
          credentials: 'include'
        });
      }
      
      // Clear the queue after successful sync
      await clearOfflineInventoryQueue();
      
      // Show notification to user
      self.registration.showNotification('FarmFlow', {
        body: 'Your inventory updates have been synced successfully!',
        icon: '/icon.png'
      });
    }
  } catch (error) {
    console.error('Inventory sync failed:', error);
  }
};

// Helper functions for IndexedDB operations
const getOfflineTaskQueue = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FarmFlowOfflineDB', 1);
    
    request.onerror = () => reject('Could not open offline database');
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('inventory')) {
        db.createObjectStore('inventory', { autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction('tasks', 'readonly');
      const store = transaction.objectStore('tasks');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };
      
      getAllRequest.onerror = () => {
        reject('Could not get offline tasks');
      };
    };
  });
};

const clearOfflineTaskQueue = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FarmFlowOfflineDB', 1);
    
    request.onerror = () => reject('Could not open offline database');
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction('tasks', 'readwrite');
      const store = transaction.objectStore('tasks');
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        resolve();
      };
      
      clearRequest.onerror = () => {
        reject('Could not clear offline tasks');
      };
    };
  });
};

const getOfflineInventoryQueue = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FarmFlowOfflineDB', 1);
    
    request.onerror = () => reject('Could not open offline database');
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction('inventory', 'readonly');
      const store = transaction.objectStore('inventory');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };
      
      getAllRequest.onerror = () => {
        reject('Could not get offline inventory items');
      };
    };
  });
};

const clearOfflineInventoryQueue = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FarmFlowOfflineDB', 1);
    
    request.onerror = () => reject('Could not open offline database');
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction('inventory', 'readwrite');
      const store = transaction.objectStore('inventory');
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        resolve();
      };
      
      clearRequest.onerror = () => {
        reject('Could not clear offline inventory items');
      };
    };
  });
};

// Listen for push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.png',
      badge: '/badge.png',
      data: data.data
    });
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
