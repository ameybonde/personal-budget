const CACHE="budget-local-v1";
const ASSETS=["./","./index.html","./app.js","./manifest.json","./icon.svg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(x=>{const c=x.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c));return x}).catch(()=>caches.match("./")))));
