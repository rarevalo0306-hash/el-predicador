import type { MessageChannel } from "../message-schedule.ts";

type Config = Record<string, string | undefined>;
export function messagingStatus(userId: string, config: Config = process.env) {
  const allowed = (config.MESSAGING_ALLOWED_USER_IDS ?? "")
    .split(",")
    .map((v) => v.trim())
    .includes(userId);
  const credentials = Boolean(config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN);
  const scheduler = Boolean(config.CRON_SECRET && config.MESSAGING_ENABLED === "true");
  return {
    whatsapp:
      allowed &&
      credentials &&
      scheduler &&
      Boolean(config.TWILIO_WHATSAPP_FROM && config.TWILIO_WHATSAPP_CONTENT_SID),
    sms: allowed && credentials && scheduler && Boolean(config.TWILIO_SMS_FROM),
  };
}

export type DeliveryOutcome = {
  status: "accepted" | "failed" | "unknown";
  providerId?: string;
  errorCode?: string;
};

/** Templates: {{1}} is the recipient's name; {{2}} is the scheduled message. */
export async function deliverMessage(
  data: {
    userId: string;
    channel: MessageChannel;
    phone: string;
    recipientName: string;
    message: string;
  },
  config: Config = process.env,
  request: typeof fetch = fetch,
): Promise<DeliveryOutcome> {
  if (!messagingStatus(data.userId, config)[data.channel])
    return { status: "failed", errorCode: "not_configured" };
  const body = new URLSearchParams();
  if (data.channel === "whatsapp") {
    body.set("To", `whatsapp:${data.phone}`);
    body.set("From", `whatsapp:${config.TWILIO_WHATSAPP_FROM!.replace(/^whatsapp:/, "")}`);
    body.set("ContentSid", config.TWILIO_WHATSAPP_CONTENT_SID!);
    body.set(
      "ContentVariables",
      JSON.stringify({ "1": data.recipientName, "2": data.message.replace(/\s+/g, " ") }),
    );
  } else {
    body.set("To", data.phone);
    body.set("From", config.TWILIO_SMS_FROM!);
    body.set("Body", data.message);
  }
  try {
    const response = await request(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.TWILIO_ACCOUNT_SID!)}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
        signal: AbortSignal.timeout(10_000),
      },
    );
    const result = (await response.json()) as {
      sid?: string;
      code?: number;
      error_code?: number;
      status?: string;
    };
    if (!response.ok)
      return {
        status: response.status >= 500 ? "unknown" : "failed",
        errorCode: String(result.code ?? response.status),
      };
    if (!result.sid) return { status: "unknown", errorCode: "missing_receipt" };
    if (result.status === "failed" || result.status === "undelivered")
      return {
        status: "failed",
        providerId: result.sid,
        errorCode: String(result.error_code ?? result.status),
      };
    return { status: "accepted", providerId: result.sid };
  } catch {
    // The provider might have accepted a timed-out request. Do not resend it.
    return { status: "unknown", errorCode: "unconfirmed_request" };
  }
}
