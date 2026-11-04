// Service worker : met l'application en cache pour qu'elle fonctionne hors connexion.
// Augmentez VERSION à chaque mise à jour de GFP.html pour forcer le rafraîchissement.
const VERSION = 'gfp-v22';
const FILES = ['./', './GFP.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // cache:'reload' : on télécharge la vraie dernière version, jamais une copie gardée par le navigateur
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'version') e.source.postMessage({ version: VERSION }); });
// Réseau d'abord, en revalidant auprès du serveur (pas de copie périmée du navigateur), cache en secours hors connexion.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' })
      .then(r => { if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); } return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./GFP.html')))
  );
});
