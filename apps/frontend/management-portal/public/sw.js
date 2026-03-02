/* Minimal Service Worker for Web Push */

/* eslint-disable no-restricted-globals */

self.addEventListener('install', (event) => {
    // Activate worker immediately after install
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Become the active service worker for all clients
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    try {
        const data = event.data ? event.data.json() : {};
        const title = data.title || 'Notification';
        const body = data.body || data.content || '';
        const options = {
            body,
            icon: '/images/icon-192.png',
            badge: '/images/icon-192.png',
            data: {
                url: data.url || '/',
                notificationId: data.notificationId,
            },
        };
        event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
        // Fallback if payload is not JSON
        event.waitUntil(self.registration.showNotification('Notification', { body: event.data && event.data.text() }));
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = (event.notification && event.notification.data && event.notification.data.url) || '/';
    event.waitUntil(
        (async () => {
            const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            let client = allClients.find((c) => c.url.includes(url));
            if (client) {
                client.focus();
            } else {
                client = await self.clients.openWindow(url);
            }
            return client;
        })()
    );
});
