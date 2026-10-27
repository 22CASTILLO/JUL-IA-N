// Sin conexión: guarda la app y los últimos datos. Con conexión, siempre pide la versión nueva primero.
const V = "finanzas-7fd195490a";
const BASE = ["./", "index.html", "app.js?v=7fd195490a", "manifest.webmanifest", "icono-180.png", "icono-192.png", "icono-512.png", "llave.json", "datos.enc.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  e.respondWith(fetch(r).then(resp => { if (resp.ok || resp.type === "opaque"){ const copia = resp.clone(); caches.open(V).then(c => c.put(r, copia)); } return resp; })
    .catch(() => caches.match(r, {ignoreSearch: r.url.includes("app.js") ? false : true}).then(m => m || caches.match("index.html"))));
});
