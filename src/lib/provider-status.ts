import type { ScheduleCopy } from "./schedule-copy";

/**
 * What the card says about the provider's final word on a message.
 *
 * The carrier's numeric codes mean nothing to the owner, so the few that
 * account for most failures get a sentence; the rest show the number.
 */
export function providerStatusLine(
  copy: ScheduleCopy,
  status: string | null | undefined,
  errorCode: string | null | undefined,
): string | null {
  if (!status) return null;
  const reason =
    errorCode && errorCode in KNOWN_CODES
      ? copy[KNOWN_CODES[errorCode as keyof typeof KNOWN_CODES]]
      : errorCode
        ? `${copy.reasonCode}: ${errorCode}`
        : null;
  switch (status) {
    case "delivered":
      return copy.providerDelivered;
    case "undelivered":
    case "failed":
      return reason ? `${copy.providerUndelivered} · ${reason}` : copy.providerUndelivered;
    case "sent":
      return copy.providerSent;
    default:
      return copy.providerQueued;
  }
}

const KNOWN_CODES = {
  "30003": "providerErr30003",
  "30004": "providerErr30004",
  "30005": "providerErr30005",
  "30006": "providerErr30006",
  "30007": "providerErr30007",
  "30034": "providerErr30034",
  "21610": "providerErr21610",
} as const satisfies Record<string, keyof ScheduleCopy>;
