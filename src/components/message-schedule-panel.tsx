import { useId, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/phone-input";
import { useI18n } from "@/components/language-switch";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useAppStore } from "@/lib/store";
import { WEEKDAY_KEYS } from "@/lib/church";
import { formatPhone } from "@/lib/phone";
import { validateSchedule, type ScheduleInput, type MessageSchedule } from "@/lib/message-schedule";
import {
  getMessageSchedules,
  saveMessageSchedule,
  setMessageScheduleEnabled,
} from "@/lib/message-schedules";
import { scheduleCopy } from "@/lib/schedule-copy";
import { cn } from "@/lib/utils";

const selectClass =
  "h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";
function localZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
}
function newForm(message = "", person?: { name: string; phone: string }): ScheduleInput {
  return {
    recipientName: person?.name ?? "",
    phone: person?.phone ?? "",
    message,
    channel: "whatsapp",
    days: [1, 2, 3, 4, 5],
    time: "09:00",
    timeZone: localZone(),
    consent: false,
  };
}
const COMMON_ZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Puerto_Rico",
  "America/Santo_Domingo",
  "America/Mexico_City",
  "America/Guatemala",
  "America/Bogota",
  "America/Lima",
  "America/Caracas",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "Europe/Madrid",
  "UTC",
];

type MessageSchedulePanelProps = {
  initialMessage?: string;
  initialPerson?: { name: string; phone: string };
};
export function MessageSchedulePanel(props: MessageSchedulePanelProps) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <MessageScheduleForm {...props} />
    </QueryClientProvider>
  );
}
function MessageScheduleForm({ initialMessage = "", initialPerson }: MessageSchedulePanelProps) {
  const { locale, t } = useI18n();
  const copy = scheduleCopy(locale);
  const { user, isPending } = useCurrentUserState();
  const recipients = useAppStore((s) => s.recipients);
  const id = useId();
  const [form, setForm] = useState(() => newForm(initialMessage, initialPerson));
  const [busy, setBusy] = useState(false);
  const [zones] = useState(() => [
    ...new Set([
      localZone(),
      ...COMMON_ZONES,
      ...(typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : []),
    ]),
  ]);
  const query = useQuery({
    queryKey: ["message-schedules", user?.id],
    queryFn: () => getMessageSchedules(),
    enabled: Boolean(user),
    retry: false,
    refetchInterval: user ? 60_000 : false,
  });
  const connected = query.data?.channels[form.channel] ?? false;
  const update = (patch: Partial<ScheduleInput>) =>
    setForm((current) => ({ ...current, ...patch }));
  function showError(error: unknown) {
    const key = error instanceof Error ? error.message : "";
    toast.error(key in copy ? copy[key as keyof typeof copy] : copy.error);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      await saveMessageSchedule({ data: validateSchedule(form) });
      toast.success(copy.saved);
      setForm(newForm());
      await query.refetch();
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }
  async function toggle(row: MessageSchedule) {
    setBusy(true);
    try {
      await setMessageScheduleEnabled({ data: { id: row.id, enabled: !row.enabled } });
      toast.success(row.enabled ? copy.pausedToast : copy.activated);
      await query.refetch();
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }
  function toggleDay(day: number) {
    update({
      days: form.days.includes(day)
        ? form.days.filter((d) => d !== day)
        : [...form.days, day].sort(),
    });
  }
  function dateLabel(value: string, zone: string) {
    return new Intl.DateTimeFormat(locale, {
      timeZone: zone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }
  return (
    <section className="min-w-0 space-y-5">
      <div>
        <h2 className="flex items-center gap-2 font-serif text-2xl">
          <CalendarClock className="size-5" />
          {copy.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.intro}</p>
      </div>
      {!user && !isPending ? (
        <div className="space-y-2 rounded-lg border border-border bg-secondary p-3 text-sm">
          <p>{copy.login}</p>
          <Button asChild variant="outline">
            <Link to="/login">{copy.loginButton}</Link>
          </Button>
        </div>
      ) : null}
      {user && query.isError ? (
        <div role="alert" className="space-y-2 rounded-lg border p-3">
          <p>{copy.loadError}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            {copy.retry}
          </Button>
        </div>
      ) : null}
      {query.data ? (
        <p
          role="status"
          className="rounded-lg border border-border bg-secondary p-3 text-sm leading-relaxed"
        >
          {connected ? copy.ready : copy.notConnected}
        </p>
      ) : null}
      <form
        className="min-w-0 space-y-4 rounded-xl border border-border bg-card p-4 shadow-paper"
        onSubmit={(event) => void save(event)}
      >
        <h3 className="font-medium">{form.id ? copy.edit : copy.new}</h3>
        {recipients.length ? (
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-contact`}>{copy.contact}</Label>
            <select
              id={`${id}-contact`}
              className={selectClass}
              value=""
              onChange={(e) => {
                const person = recipients.find((r) => r.id === e.target.value);
                if (person)
                  update({ recipientName: person.name, phone: person.phone, consent: false });
              }}
            >
              <option value="">{copy.manual}</option>
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {formatPhone(r.phone)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-name`}>{copy.name}</Label>
          <Input
            id={`${id}-name`}
            value={form.recipientName}
            onChange={(e) => update({ recipientName: e.target.value, consent: false })}
            required
            maxLength={80}
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-phone`}>{copy.phone}</Label>
          <PhoneInput
            id={`${id}-phone`}
            value={form.phone}
            onChange={(phone) => update({ phone, consent: false })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-channel`}>{copy.channel}</Label>
          <select
            id={`${id}-channel`}
            className={selectClass}
            value={form.channel}
            onChange={(e) =>
              update({ channel: e.target.value as ScheduleInput["channel"], consent: false })
            }
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-message`}>{copy.message}</Label>
          <Textarea
            id={`${id}-message`}
            value={form.message}
            onChange={(e) => update({ message: e.target.value })}
            required
            maxLength={1000}
            className="min-h-28"
            aria-describedby={`${id}-message-hint`}
          />
          <p id={`${id}-message-hint`} className="text-xs text-muted-foreground">
            {copy.messageHint}
          </p>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{copy.days}</legend>
          <div className="grid grid-cols-7 gap-1">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => (
              <button
                type="button"
                key={day}
                aria-pressed={form.days.includes(day)}
                onClick={() => toggleDay(day)}
                className={cn(
                  "h-11 min-w-0 rounded-md border text-xs font-medium",
                  form.days.includes(day)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background",
                )}
              >
                {t(WEEKDAY_KEYS[day])}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => update({ days: [0, 1, 2, 3, 4, 5, 6] })}
            >
              {copy.everyDay}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => update({ days: [1, 2, 3, 4, 5] })}
            >
              {copy.weekdays}
            </Button>
          </div>
        </fieldset>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-time`}>{copy.time}</Label>
          <Input
            id={`${id}-time`}
            type="time"
            step={60}
            value={form.time}
            onChange={(e) => update({ time: e.target.value })}
            onInput={(e) => update({ time: e.currentTarget.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-zone`}>{copy.zone}</Label>
          <select
            id={`${id}-zone`}
            className={selectClass}
            value={form.timeZone}
            onChange={(e) => update({ timeZone: e.target.value })}
          >
            {[...new Set([form.timeZone, ...zones])].map((zone) => (
              <option key={zone} value={zone}>
                {zone.replaceAll("_", " ").replaceAll("/", " / ")}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">{copy.zoneHint}</p>
        </div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 accent-primary"
            checked={form.consent}
            onChange={(e) => update({ consent: e.target.checked })}
          />
          <span>{copy.consent}</span>
        </label>
        <p className="text-xs text-muted-foreground">{copy.saveFirst}</p>
        <div className="flex flex-wrap gap-2">
          {form.id ? (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setForm(newForm())}
            >
              {copy.cancel}
            </Button>
          ) : null}
          <Button
            type="submit"
            className="flex-1"
            disabled={busy || !user || query.isError || query.isPending}
          >
            {busy ? t("wait") : copy.save}
          </Button>
        </div>
      </form>
      {user && query.isPending ? <p role="status">{copy.loading}</p> : null}
      {query.data ? (
        <div className="space-y-3">
          <h3 className="font-medium">{copy.list}</h3>
          {!query.data.schedules.length ? (
            <p className="text-sm text-muted-foreground">{copy.none}</p>
          ) : null}
          {query.data.schedules.map((row) => (
            <article key={row.id} className="space-y-2 rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium">{row.recipientName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatPhone(row.phone)} · {row.channel === "sms" ? "SMS" : "WhatsApp"}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                  {row.enabled ? copy.active : copy.paused}
                </span>
              </div>
              <p className="text-sm font-medium">
                {row.days.map((d) => t(WEEKDAY_KEYS[d])).join(", ")} · {row.time}
              </p>
              <p className="text-xs text-muted-foreground">{row.timeZone.replaceAll("_", " ")}</p>
              <p className="whitespace-pre-wrap break-words text-sm">{row.message}</p>
              {row.nextRunAt ? (
                <p className="text-sm">
                  {copy.next}: {dateLabel(row.nextRunAt, row.timeZone)}
                </p>
              ) : null}
              {row.lastStatus ? (
                <p className="text-xs text-muted-foreground">
                  {copy[row.lastStatus]}
                  {row.lastRunAt ? ` · ${dateLabel(row.lastRunAt, row.timeZone)}` : ""}
                </p>
              ) : null}
              {!query.data.channels[row.channel] && !row.enabled ? (
                <p className="text-xs text-muted-foreground">{copy.scheduleNotConnected}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setForm({ ...row })}
                >
                  {copy.edit}
                </Button>
                <Button
                  type="button"
                  disabled={busy || (!row.enabled && !query.data.channels[row.channel])}
                  onClick={() => void toggle(row)}
                >
                  {row.enabled ? copy.pause : copy.activate}
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
