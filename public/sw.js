// SportKompas Service Worker (Offline Shell & Asset Caching)
const CACHE_NAME = "sportkompas-shell-v1";

const PRECACHE_URLS = [
  "/",
  "/training",
  "/cardio",
  "/voeding",
  "/profiel",
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/icons/icon-maskable.svg",
];

// Installatie: Pre-cache de belangrijkste pagina's en assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("[SportKompas SW] Pre-cache fout:", err);
      })
  );
});

// Activatie: Oude caches opruimen
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-first voor navigatie met offline fallback, stale-while-revalidate voor statische assets
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Alleen GET-verzoeken cachen
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Sla API verzoeken over van caching
  if (url.pathname.startsWith("/api/")) return;

  // Navigatieverzoeken (HTML pagina's)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Bewaar een kopie van de nieuwste HTML in de cache
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback: probeer de specifieke gecachede route, anders de root
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallback = await caches.match("/");
          if (fallback) return fallback;
          return new Response("SportKompas is momenteel offline.", {
            headers: { "Content-Type": "text/html" },
          });
        })
    );
    return;
  }

  // Statische Next.js chunks, fonts en CSS (stale-while-revalidate)
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".svg")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Netwerk niet bereikbaar; cachedResponse wordt geretourneerd indien beschikbaar
          });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
