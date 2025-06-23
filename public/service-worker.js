// 오프라인 -> 캐시 데이터 뿌려
// pwa -> self
// 브라우저 -> window
// node -> global
self.addEventListener('install', event => {
    console.log('[Service Worker] Installed');
    self.skipWaiting(); // 설치 후 즉시 활성화
  });
  
  self.addEventListener('activate', event => {
    console.log('[Service Worker] Activated');
  });
  
  self.addEventListener('fetch', event => {
    // 기본 네트워크 요청 처리
    event.respondWith(fetch(event.request));
  });
  
  // 푸시 알림 이벤트 처리
  self.addEventListener('push', function(event) {
    let data = {};
    if (event.data) {
      try {
        data = event.data.json();
      } catch (e) {
        data = { title: '알림', body: event.data.text() };
      }
    }
    const title = data.title || '알림';
    const options = {
      body: data.body || '',
      icon: '/android-chrome-192x192.png', // 원하는 아이콘 경로로 수정
      badge: '/android-chrome-192x192.png',
      data: {
        url: data.url || '/'
      }
    };
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  });
  
  // 알림 클릭 시 처리
  self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  });