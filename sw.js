// Service Worker - قائمة مهامي
// بيعمل cache لكل ملفات التطبيق علشان يشتغل بدون انترنت

const CACHE_NAME = "todo-pwa-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-96.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// ===== التثبيت - تخزين الملفات =====
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function(err) {
        // لو أي ملف فشل، نكمل الباقي
        console.log("Cache error:", err);
        return Promise.all(
          ASSETS.map(function(url) {
            return cache.add(url).catch(function() { return null; });
          })
        );
      });
    })
  );
  self.skipWaiting();
});

// ===== التفعيل - تنظيف الـ cache القديم =====
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key !== CACHE_NAME; })
          .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// ===== التعامل مع الطلبات =====
self.addEventListener("fetch", function(event) {
  // بس الـ GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      // لو الملف في الـ cache، نرجعه
      if (cached) {
        return cached;
      }
      // لو مش في الـ cache، نحمله من النت
      return fetch(event.request).then(function(response) {
        // لو الاتصال نجح، نضيفه للـ cache
        if (response && response.status === 200 && response.type === "basic") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        // لو مفيش نت، نرجع أقرب صفحة
        return caches.match("./index.html");
      });
    })
  );
});
