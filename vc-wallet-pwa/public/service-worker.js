/**
 * Service Worker for the Verifiable Credential Wallet PWA.
 *
 * Strategy for GET /api/credentials:
 *   Network-first, cache-fallback.
 *   - Try the network. If it succeeds, clone the response into Cache Storage
 *     and return the live data.
 *   - If the network fails (offline), read the last successful response
 *     from Cache Storage and serve that instead, so the dashboard still
 *     renders the user's last known credential list.
 *
 * Implemented in vanilla JS (no Workbox) so the logic is easy to audit —
 * important for a security-sensitive identity app.
 */

const CACHE_NAME = "vc-wallet-cache-v1";
const CREDENTIALS_ENDPOINT = "/api/credentials";
const APP_SHELL = ["/", "/index.html", "/manifest.json"];

// --- Install: pre-cache the app shell so the UI itself loads offline ---
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// --- Activate: clean up old cache versions ---
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// --- Fetch: intercept the credentials API specifically ---
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === "GET" && url.pathname === CREDENTIALS_ENDPOINT) {
    event.respondWith(networkFirstWithCacheFallback(event.request));
    return;
  }

  // Everything else: cache-first for app shell assets, fall through to network.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

async function networkFirstWithCacheFallback(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);

    // Only cache successful responses.
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      // Also mirror into IndexedDB as a durable structured store,
      // useful if the app wants to query individual credentials offline.
      networkResponse
        .clone()
        .json()
        .then((data) => saveCredentialsToIndexedDB(data))
        .catch(() => {
          /* non-JSON or already consumed — ignore */
        });
    }

    return networkResponse;
  } catch (err) {
    // Network is down — serve the last cached response.
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // No cache entry yet — try IndexedDB as a secondary fallback.
    const idbData = await readCredentialsFromIndexedDB();
    if (idbData) {
      return new Response(JSON.stringify(idbData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Truly nothing available offline.
    return new Response(
      JSON.stringify({ error: "Offline and no cached credentials available." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

// --- Minimal IndexedDB helpers (no external deps) ---

const IDB_NAME = "vc-wallet-db";
const IDB_STORE = "credentials";

function openIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveCredentialsToIndexedDB(credentials) {
  if (!Array.isArray(credentials)) return;
  const db = await openIDB();
  const tx = db.transaction(IDB_STORE, "readwrite");
  const store = tx.objectStore(IDB_STORE);
  credentials.forEach((cred) => store.put(cred));
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

async function readCredentialsFromIndexedDB() {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);
    const all = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return all.length ? all : null;
  } catch {
    return null;
  }
}
