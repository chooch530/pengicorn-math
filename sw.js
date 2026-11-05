// Service worker: caches every game file so it runs offline after the first load.
// IMPORTANT: bump VERSION on every deploy, or iPads keep running the old cached game.
// Add any new file to FILES.
const VERSION = 'v1.7.0';
const CACHE = `pengicorn-${VERSION}`;

const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './js/main.js',
  './js/logic/rng.js',
  './js/logic/levels.js',
  './js/logic/problems.js',
  './js/logic/distractors.js',
  './js/logic/difficulty.js',
  './js/logic/scoring.js',
  './js/logic/round.js',
  './js/logic/progress.js',
  './js/logic/words.js',
  './js/audio/speech.js',
  './js/audio/sfx.js',
  './js/art/registry.js',
  './js/art/penguin.js',
  './js/art/unicorn.js',
  './js/art/objects.js',
  './js/ui/dom.js',
  './js/ui/chrome.js',
  './js/ui/confetti.js',
  './js/ui/splash.js',
  './js/ui/kidSelect.js',
  './js/ui/home.js',
  './js/ui/play.js',
  './js/ui/levelSelect.js',
  './js/ui/wordsPlay.js',
  './js/ui/listEditor.js',
  './js/logic/sight.js',
  './js/logic/battle.js',
  './js/art/battleship.js',
  './js/ui/battleScene.js',
  './js/ui/wordsMenu.js',
  './js/ui/reward.js',
  './js/ui/parent.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache first (offline-friendly). Falls back to network, then to the cached index page.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(
      (hit) => hit || fetch(e.request).catch(() => caches.match('./index.html'))
    )
  );
});
