/**
 * Bridge to the iPhone app's real push reminders. WKWebView exposes the
 * handler only inside the app's first-party main frame; elsewhere it is absent.
 */
type PushMessage = { action: "enable"; hour: number; locale: "es" | "en" } | { action: "disable" };

function bridge() {
  if (typeof window === "undefined") return undefined;
  return (
    window as Window & {
      webkit?: {
        messageHandlers?: { preacherPush?: { postMessage: (body: PushMessage) => void } };
      };
    }
  ).webkit?.messageHandlers?.preacherPush;
}

export function nativePushAvailable() {
  return Boolean(bridge());
}

export function setNativePush(message: PushMessage) {
  bridge()?.postMessage(message);
}

/** The app answers once the iPhone permission prompt is settled. */
export const NATIVE_PUSH_EVENT = "preacher-push";
export type NativePushResult = { granted: boolean };
