import type { MessagingRequirements } from "@/lib/messaging/provider.server";
import type { ScheduleInput } from "@/lib/message-schedule";
import type { ScheduleCopy } from "@/lib/schedule-copy";

/**
 * The four conditions for automatic sending, in the order they must be fixed:
 * a missing sender is useless without credentials. Only the sender for the
 * channel and language on the form is listed — the other one is not what the
 * person is trying to set up right now.
 */
export function missingRequirements(
  requirements: MessagingRequirements,
  form: Pick<ScheduleInput, "channel" | "messageLocale">,
  copy: ScheduleCopy,
): { key: string; done: boolean; label: string; how: string }[] {
  const locale = form.messageLocale ?? "es";
  const sender =
    form.channel === "sms"
      ? {
          key: "sms",
          done: requirements.senders[locale].sms,
          label: copy.missingSenderSms,
          how: copy.missingSenderSmsHow,
        }
      : {
          key: "whatsapp",
          done: requirements.senders[locale].whatsapp,
          label: copy.missingSenderWhatsApp,
          how: copy.missingSenderWhatsAppHow,
        };
  return [
    {
      key: "allowed",
      done: requirements.allowed,
      label: copy.missingAllowed,
      how: copy.missingAllowedHow,
    },
    {
      key: "credentials",
      done: requirements.credentials,
      label: copy.missingCredentials,
      how: copy.missingCredentialsHow,
    },
    {
      key: "scheduler",
      done: requirements.scheduler,
      label: copy.missingScheduler,
      how: copy.missingSchedulerHow,
    },
    sender,
  ];
}
