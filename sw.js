/* OIL PALM管理 網頁版的離線快取（build 43）
   App 本身（index.html、圖示）存起來，芭裡沒訊號也打得開；
   天氣、AI 這些要網路的照常走網路，不快取。 */
var CACHE = "oilpalm-43";
var CORE = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "fb-app.js", "fb-auth.js", "fb-store.js"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf("oilpalm-") === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("message", function (e) { if (e.data === "skip") self.skipWaiting(); });
self.addEventListener("fetch", function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  if (r.mode === "navigate") {                       /* 打開 App：先試網路拿新版，沒網路用存著的 */
    e.respondWith(fetch(r).then(function (res) {
      var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put("index.html", cp); }); return res;
    }).catch(function () { return caches.match("index.html"); }));
    return;
  }
  if (u.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(function (hit) {
      var net = fetch(r).then(function (res) {
        if (res && (res.ok || res.type === "opaque")) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    }));
  }
});
