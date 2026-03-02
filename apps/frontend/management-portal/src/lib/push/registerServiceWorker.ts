/** Service Worker registration & Push subscription helper */

const API_BASE = process.env.NEXT_PUBLIC_NOTIFICATION_MANAGEMENT_API_URL || 'http://localhost:8080';

export async function ensureServiceWorkerRegistered() {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    // Wait until ready to ensure registration.active is available
    const ready = await navigator.serviceWorker.ready;
    return ready || reg;
  } catch (e) {
    console.error('SW registration failed:', e);
    return null;
  }
}

async function getVapidPublicKey(): Promise<Uint8Array | null> {
  try {
    const res = await fetch(`${API_BASE}/api/push/vapid-public-key`);
    if (!res.ok) return null;
    const data = await res.json();
    const base64 = data.publicKey;
    if (!base64) return null;
    return urlBase64ToUint8Array(base64);
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

export async function subscribeUserToPush(authToken?: string, deviceId?: string) {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;

  // Require auth token to ensure we have user context
  if (!authToken) {
    console.warn('[subscribeUserToPush] No auth token provided, skipping subscription');
    return null;
  }

  try {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notifications permission not granted');
      return null;
    }
    const registration = await ensureServiceWorkerRegistered();
    if (!registration || !registration.pushManager) return null;

    // If already subscribed, reuse
    const existing = await registration.pushManager.getSubscription();
    let subscription = existing;
    if (!subscription) {
      const appServerKey = await getVapidPublicKey();
      if (!appServerKey) {
        console.warn('Missing VAPID public key; cannot subscribe');
        return null;
      }
      // Ensure the key is a plain Uint8Array backed by an ArrayBuffer for TS's BufferSource typing
      const appServerKeyView = new Uint8Array(appServerKey); // copy into a new Uint8Array backed by ArrayBuffer
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKeyView.buffer as ArrayBuffer,
      });
    }

    // Send subscription to backend with auth token and deviceId
    try {
      console.log('[subscribeUserToPush] Sending subscription to backend with auth token');
      const response = await fetch(`${API_BASE}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ subscription, deviceId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to subscribe' }));
        console.error('Backend subscription failed:', errorData);
        throw new Error(errorData.message || 'Failed to subscribe to push notifications');
      }

      const result = await response.json();
      console.log('[subscribeUserToPush] Successfully subscribed:', result);

      // Store subscription info if available
      if (result.subscriptionId) {
        localStorage.setItem('pushSubscriptionId', result.subscriptionId);
      }
    } catch (e) {
      console.error('Failed to send subscription to backend', e);
      throw e;
    }

    return subscription;
  } catch (e) {
    console.error('Push subscribe failed:', e);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function unsubscribeUserFromPush(authToken?: string) {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration || !registration.pushManager) return;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      console.log('[unsubscribeUserFromPush] No subscription found');
      return;
    }

    // Get stored subscription ID
    const subscriptionId = localStorage.getItem('pushSubscriptionId');

    // Unsubscribe from push manager
    await subscription.unsubscribe();
    console.log('[unsubscribeUserFromPush] Unsubscribed from push manager');

    // Notify backend to remove subscription
    if (subscriptionId) {
      try {
        await fetch(`${API_BASE}/api/push/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({ subscriptionId }),
        });
        console.log('[unsubscribeUserFromPush] Notified backend of unsubscription');
      } catch (e) {
        console.error('Failed to notify backend of unsubscription', e);
      }
    }

    // Clear local storage
    localStorage.removeItem('pushSubscriptionId');
  } catch (e) {
    console.error('Push unsubscribe failed:', e);
  }
}
