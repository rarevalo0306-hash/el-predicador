import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { SITE } from "@/lib/legal/site";
import { parseStatusCallback, recordProviderStatus } from "@/lib/messaging/delivery-status";
import { validTwilioSignature } from "@/lib/messaging/twilio-signature";

/** The address the provider is told to report to, and signs its reports with. */
const STATUS_CALLBACK_URL = `${SITE.url}/api/twilio/status`;

export const Route = createFileRoute("/api/twilio/status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const params: Record<string, string> = {};
        for (const [key, value] of await request.formData()) {
          if (typeof value === "string") params[key] = value;
        }
        // The signature covers the public URL the provider posted to, not
        // whatever host a proxy in between rewrote it to.
        if (
          !validTwilioSignature(
            STATUS_CALLBACK_URL,
            params,
            process.env.TWILIO_AUTH_TOKEN,
            request.headers.get("x-twilio-signature"),
          )
        ) {
          return new Response("Forbidden", { status: 403 });
        }
        const callback = parseStatusCallback(params);
        if (callback) await recordProviderStatus(await getSql(), callback);
        // Always 204: the provider retries anything else, and there is nothing
        // to retry — a malformed report will not become well-formed.
        return new Response(null, { status: 204 });
      },
    },
  },
});
