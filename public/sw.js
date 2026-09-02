// PWA 설치 조건(설치 가능한 fetch 핸들러) 충족용 최소 서비스워커.
// 관리자 데이터는 항상 최신이어야 해서 오프라인 캐싱은 하지 않고 항상 네트워크로 통과시킨다.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
