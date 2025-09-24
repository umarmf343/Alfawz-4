// Service Worker for AlFawz Qur'an Institute PWA
// Provides offline functionality and caching strategies

const CACHE_NAME = "alfawz-quran-v1.0.0"
const STATIC_CACHE = "alfawz-static-v1.0.0"
const DYNAMIC_CACHE = "alfawz-dynamic-v1.0.0"
const QURAN_CACHE = "alfawz-quran-v1.0.0"
const AUDIO_CACHE = "alfawz-audio-v1.0.0"

// Assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  // Core CSS and JS will be added by Next.js automatically
]

// Quran API endpoints to cache
const QURAN_API_PATTERNS = [
  /^https:\/\/api\.alquran\.cloud\/v1\/surah$/,
  /^https:\/\/api\.alquran\.cloud\/v1\/surah\/\d+$/,
  /^https:\/\/api\.alquran\.cloud\/v1\/ayah\/\d+:\d+/,
  /^https:\/\/api\.alquran\.cloud\/v1\/edition$/,
]

// Audio patterns to cache
const AUDIO_PATTERNS = [/^https:\/\/.*\.mp3$/, /^https:\/\/.*\.wav$/, /^https:\/\/.*\.m4a$/]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...")

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching static assets")
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log("[SW] Static assets cached successfully")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("[SW] Failed to cache static assets:", error)
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== QURAN_CACHE &&
              cacheName !== AUDIO_CACHE
            ) {
              console.log("[SW] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("[SW] Service worker activated")
        return self.clients.claim()
      }),
  )
})

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Handle different types of requests with appropriate strategies
  if (isQuranAPIRequest(url)) {
    event.respondWith(handleQuranAPIRequest(request))
  } else if (isAudioRequest(url)) {
    event.respondWith(handleAudioRequest(request))
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request))
  } else if (isPageRequest(request)) {
    event.respondWith(handlePageRequest(request))
  } else {
    event.respondWith(handleDynamicRequest(request))
  }
})

// Handle Quran API requests with cache-first strategy
async function handleQuranAPIRequest(request) {
  try {
    const cache = await caches.open(QURAN_CACHE)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      console.log("[SW] Serving Quran API from cache:", request.url)

      // Update cache in background if online
      if (navigator.onLine) {
        fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone())
            }
          })
          .catch(() => {}) // Ignore background update errors
      }

      return cachedResponse
    }

    // Fetch from network and cache
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.error("[SW] Quran API request failed:", error)
    return new Response(
      JSON.stringify({
        error: "Offline - Quran data not available",
        code: 503,
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// Handle audio requests with cache-first strategy
async function handleAudioRequest(request) {
  try {
    const cache = await caches.open(AUDIO_CACHE)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      console.log("[SW] Serving audio from cache:", request.url)
      return cachedResponse
    }

    // Fetch from network
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      // Only cache smaller audio files to avoid storage issues
      const contentLength = networkResponse.headers.get("content-length")
      if (!contentLength || Number.parseInt(contentLength) < 10 * 1024 * 1024) {
        // 10MB limit
        cache.put(request, networkResponse.clone())
      }
    }

    return networkResponse
  } catch (error) {
    console.error("[SW] Audio request failed:", error)
    return new Response("Audio not available offline", { status: 503 })
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.error("[SW] Static asset request failed:", error)
    return new Response("Asset not available", { status: 503 })
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  try {
    // Try network first for fresh content
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }

    throw new Error("Network response not ok")
  } catch (error) {
    // Fallback to cache
    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      console.log("[SW] Serving page from cache:", request.url)
      return cachedResponse
    }

    // Fallback to offline page
    const offlineResponse = await cache.match("/offline")
    if (offlineResponse) {
      return offlineResponse
    }

    return new Response("Page not available offline", {
      status: 503,
      headers: { "Content-Type": "text/html" },
    })
  }
}

// Handle dynamic requests with network-first strategy
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    return new Response("Request failed", { status: 503 })
  }
}

// Helper functions
function isQuranAPIRequest(url) {
  return QURAN_API_PATTERNS.some((pattern) => pattern.test(url.href))
}

function isAudioRequest(url) {
  return AUDIO_PATTERNS.some((pattern) => pattern.test(url.href))
}

function isStaticAsset(url) {
  return url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
}

function isPageRequest(request) {
  return request.headers.get("accept")?.includes("text/html")
}

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag)

  if (event.tag === "sync-progress") {
    event.waitUntil(syncProgressData())
  } else if (event.tag === "sync-recordings") {
    event.waitUntil(syncRecordings())
  }
})

// Sync progress data when back online
async function syncProgressData() {
  try {
    const progressData = await getStoredProgressData()
    if (progressData.length > 0) {
      for (const data of progressData) {
        await fetch("/api/sync/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      }
      await clearStoredProgressData()
      console.log("[SW] Progress data synced successfully")
    }
  } catch (error) {
    console.error("[SW] Failed to sync progress data:", error)
  }
}

// Sync recordings when back online
async function syncRecordings() {
  try {
    const recordings = await getStoredRecordings()
    if (recordings.length > 0) {
      for (const recording of recordings) {
        const formData = new FormData()
        formData.append("audio", recording.blob)
        formData.append("metadata", JSON.stringify(recording.metadata))

        await fetch("/api/sync/recordings", {
          method: "POST",
          body: formData,
        })
      }
      await clearStoredRecordings()
      console.log("[SW] Recordings synced successfully")
    }
  } catch (error) {
    console.error("[SW] Failed to sync recordings:", error)
  }
}

// IndexedDB helpers for offline storage
async function getStoredProgressData() {
  // Implementation would use IndexedDB to retrieve stored progress
  return []
}

async function clearStoredProgressData() {
  // Implementation would clear stored progress from IndexedDB
}

async function getStoredRecordings() {
  // Implementation would use IndexedDB to retrieve stored recordings
  return []
}

async function clearStoredRecordings() {
  // Implementation would clear stored recordings from IndexedDB
}

// Push notification handling
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received")

  const options = {
    body: "Time for your daily Quran practice!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [200, 100, 200],
    data: {
      url: "/student/practice",
    },
    actions: [
      {
        action: "practice",
        title: "Start Practice",
        icon: "/icons/action-practice.png",
      },
      {
        action: "dismiss",
        title: "Later",
        icon: "/icons/action-dismiss.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("AlFawz Quran Institute", options))
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action)

  event.notification.close()

  if (event.action === "practice") {
    event.waitUntil(clients.openWindow("/student/practice"))
  } else if (event.action === "dismiss") {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow("/"))
  }
})

console.log("[SW] Service worker script loaded")
