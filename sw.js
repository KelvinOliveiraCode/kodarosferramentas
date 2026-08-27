/* KODAROS FERRAMENTAS — Service Worker (offline-first) */
const CACHE = 'kodaros-tools-v4';
const CORE = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'kodaros_logo.png',
  'kodaros_icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-512-maskable.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(CORE); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){
        return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
      })
      .then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if(url.origin !== location.origin) return; // não intercepta fonts/CDN externos
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function(hit){
      if(hit) return hit;
      return fetch(e.request).then(function(res){
        if(res && res.ok && res.type === 'basic'){
          const copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); }).catch(function(){});
        }
        return res;
      }).catch(function(){
        return caches.match('./');
      });
    })
  );
});
