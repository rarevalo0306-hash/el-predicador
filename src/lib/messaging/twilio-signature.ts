import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Whether a status callback really came from the provider.
 *
 * Twilio signs each callback: HMAC-SHA1 with the auth token over the full URL
 * it posted to, followed by every form field's name and value in key order,
 * base64-encoded in the X-Twilio-Signature header. Anyone can post to the
 * route, so a callback that does not carry a valid signature is ignored.
 */
export function validTwilioSignature(
  url: string,
  params: Record<string, string>,
  authToken: string | undefined,
  signature: string | null,
): boolean {
  if (!authToken || !signature) return false;
  const payload = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  const expected = Buffer.from(createHmac("sha1", authToken).update(payload).digest("base64"));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
