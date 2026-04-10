// Thoth's Notebook — Service Worker
// Handles notification display (so OS shows the app icon, not the browser icon)
// and notification click routing.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Page sends { type: 'SHOW_NOTIFICATION', title, body, icon, image, badge, tag, url }
// We show it from SW context so Android uses the app icon, not the browser icon.
self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'SHOW_NOTIFICATION') return;
  const { title, body, icon, image, badge, tag, url } = event.data;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      image,
      badge,
      tag,
      renotify: true,
      data: { url: url ?? '/iphty-link' },
    })
  );
});

// Open / focus the Iphty Link page when the user taps a notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? '/iphty-link';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client) client.navigate(targetUrl);
            return;
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
