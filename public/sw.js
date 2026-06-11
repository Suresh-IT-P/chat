self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus the first open window
      for (let client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Or open a new window if none is open
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
