self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  /* Network-only: needed so the app can be installed on Android Chrome. */
});

self.addEventListener("push", (event) => {
  let data = { title: "Shree Lagna", body: "You have a new update.", url: "/app/alerts" };
  try {
    const parsed = event.data ? event.data.json() : null;
    if (parsed && typeof parsed === "object") {
      data = {
        title: String(parsed.title || data.title),
        body: String(parsed.body || data.body),
        url: String(parsed.url || data.url),
      };
    }
  } catch {
    const text = event.data ? event.data.text() : "";
    if (text) data.body = text;
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: { url: data.url },
      icon: "/pwa/192",
      badge: "/pwa/192",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/app/alerts";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate?.(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
      return undefined;
    }),
  );
});
