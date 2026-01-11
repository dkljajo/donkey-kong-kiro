const CACHE_NAME = 'donkey-kong-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/game.js',
  '/manifest.json',
  '/achievements.js',
  '/leaderboard.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Background sync for offline score submission
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncScores());
  }
});

async function syncScores() {
  const scores = await getStoredScores();
  // Sync with server when online
  console.log('Syncing scores:', scores);
}