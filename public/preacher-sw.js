/** Daily verse reminder via service worker (works better on installed PWA). */
const NOTIFY_KEY = "preacher-daily-notify";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate?.(target);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
      return undefined;
    }),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  if (data.type === "SHOW_DAILY") {
    const title = typeof data.title === "string" ? data.title : "The Preacher";
    const body = typeof data.body === "string" ? data.body : "";
    const tag = typeof data.tag === "string" ? data.tag : "daily-verse";
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        tag,
        data: { url: "/" },
      }),
    );
  }
  if (data.type === "SCHEDULE_DAILY") {
    try {
      self.localStorage?.setItem?.(NOTIFY_KEY, JSON.stringify(data));
    } catch {
      /* SW has no localStorage — app schedules via setTimeout / alarm */
    }
  }
});
