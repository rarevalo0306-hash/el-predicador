const SW_URL = "/preacher-sw.js";

export async function ensurePreacherServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(SW_URL, { scope: "/" });
  } catch {
    return null;
  }
}

export async function showDailyNotification(opts: {
  title: string;
  body: string;
  tag?: string;
}): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return false;
  }
  const registration = await ensurePreacherServiceWorker();
  if (registration?.active) {
    registration.active.postMessage({
      type: "SHOW_DAILY",
      title: opts.title,
      body: opts.body,
      tag: opts.tag ?? "daily-verse",
    });
    return true;
  }
  if (registration?.showNotification) {
    await registration.showNotification(opts.title, {
      body: opts.body,
      tag: opts.tag ?? "daily-verse",
      data: { url: "/" },
    });
    return true;
  }
  try {
    new Notification(opts.title, { body: opts.body, tag: opts.tag ?? "daily-verse" });
    return true;
  } catch {
    return false;
  }
}

/** Ms until the next occurrence of `hour` (0–23) in local time. */
export function msUntilNotifyHour(hour: number, now = new Date()): number {
  const target = new Date(now);
  target.setHours(Math.min(23, Math.max(0, Math.round(hour))), 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}
