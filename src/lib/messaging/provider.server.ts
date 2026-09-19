import type { MessageChannel } from "../message-schedule.ts";

type Config = Record<string, string | undefined>;
function whatsappTemplate(config: Config, locale: "es" | "en" = "es") {
  return locale === "en"
    ? config.TWILIO_WHATSAPP_CONTENT_SID_EN
    : (config.TWILIO_WHATSAPP_CONTENT_SID_ES ?? config.TWILIO_WHATSAPP_CONTENT_SID);
}
export type MessagingRequirements = {
  /** This account is listed in MESSAGING_ALLOWED_USER_IDS. */
  allowed: boolean;
  /** TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are both set. */
  credentials: boolean;
  /** CRON_SECRET is set and MESSAGING_ENABLED is exactly "true". */
  scheduler: boolean;
  /** A usable sender exists for each channel, per message language. */
  senders: Record<"es" | "en", Record<MessageChannel, boolean>>;
};

/**
 * Which of the four conditions for automatic sending hold right now.
 *
 * "Not connected" on its own leaves the owner guessing among six environment
 * variables, so the panel shows this breakdown instead. Every field is a
 * boolean: whether a setting is present, never what it contains. A credential
 * must not reach the browser even in part.
 *
 * The breakdown goes to any signed-in visitor, because the owner cannot be
 * told apart from anyone else until `allowed` is true — and `allowed` being
 * false is exactly what they need to see to fix it. What that reveals is
 * whether this deployment has messaging configured, which is not a secret.
 */
export function messagingRequirements(
  userId: string,
  config: Config = process.env,
): MessagingRequirements {
  // An unset list splits to [""], so an empty caller id must never match it.
  const allowed =
    Boolean(userId) &&
    (config.MESSAGING_ALLOWED_USER_IDS ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .includes(userId);
  const sender = (locale: "es" | "en"): Record<MessageChannel, boolean> => ({
    whatsapp: Boolean(config.TWILIO_WHATSAPP_FROM && whatsappTemplate(config, locale)),
    sms: Boolean(config.TWILIO_SMS_FROM),
  });
  return {
    allowed,
    credentials: Boolean(config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN),
    scheduler: Boolean(config.CRON_SECRET && config.MESSAGING_ENABLED === "true"),
    senders: { es: sender("es"), en: sender("en") },
  };
}

export function messagingStatus(
  userId: string,
  config: Config = process.env,
  locale: "es" | "en" = "es",
) {
  const { allowed, credentials, scheduler, senders } = messagingRequirements(userId, config);
  const ready = allowed && credentials && scheduler;
  return {
    whatsapp: ready && senders[locale].whatsapp,
    sms: ready && senders[locale].sms,
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
    messageLocale?: "es" | "en";
  },
  config: Config = process.env,
  request: typeof fetch = fetch,
): Promise<DeliveryOutcome> {
  if (!messagingStatus(data.userId, config, data.messageLocale)[data.channel])
    return { status: "failed", errorCode: "not_configured" };
  const body = new URLSearchParams();
  if (data.channel === "whatsapp") {
    body.set("To", `whatsapp:${data.phone}`);
    body.set("From", `whatsapp:${config.TWILIO_WHATSAPP_FROM!.replace(/^whatsapp:/, "")}`);
    body.set("ContentSid", whatsappTemplate(config, data.messageLocale)!);
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
