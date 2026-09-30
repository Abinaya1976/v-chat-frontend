// Scripts for Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// 
// Parse Firebase config from the URL query parameters
// This is the Vite-compatible approach for injecting environment variables 
// into a static service worker without requiring a dedicated SW bundler plugin.
const urlParams = new URLSearchParams(location.search);

const firebaseConfig = {
  apiKey: urlParams.get('apiKey'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  storageBucket: urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId')
};


// Initialize Firebase
try {
  firebase.initializeApp(firebaseConfig);
  console.log('[firebase-messaging-sw.js] Firebase initialized successfully in background.');
} catch (err) {
  console.error('[firebase-messaging-sw.js] Firebase initialization failed:', err);
}

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message (FCM automatically displays system notification):', payload);
  // Do NOT call showNotification here if the backend sends `notification` payload, 
  // as it will cause duplicate notifications.
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Focus the window or open a new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Find if we already have a window open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.indexOf('/') >= 0 && 'focus' in client) {
          // Send a message to the client so it can navigate internally
          client.postMessage({
            type: 'fcm-notification-click',
            data: event.notification.data
          });
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
