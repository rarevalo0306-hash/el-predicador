import { MessageLanguageSelect } from "@/components/message-language-select";
import { messageLanguageCopy, messageLanguageName } from "@/lib/message-language";
import { SMS_FOOTER } from "@/lib/messaging/sms-footer";
import { providerStatusLine } from "@/lib/provider-status";
import { fallbackNotes } from "@/lib/messaging/compose";
import type { Locale } from "@/lib/i18n";
import {
  THEMES,
  getVerseById,
  versesForTheme,
  localizedTheme,
  localizeVerse,
  type ThemeId,
} from "@/lib/verses";
import { hydrateVerse } from "@/lib/recobro";
import { formatVerseMessage } from "@/lib/share";
import { useEffect, useId, useState, useRef } from "react";
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
import {
  validateSchedule,
  type ScheduleInput,
  type MessageSchedule,
  type MessageChannel,
} from "@/lib/message-schedule";
import {
  deleteMessageSchedule,
  getMessageSchedules,
  saveMessageSchedule,
  setMessageScheduleEnabled,
} from "@/lib/message-schedules";
import { scheduleCopy } from "@/lib/schedule-copy";
import { missingRequirements } from "@/lib/messaging-requirements";
import { cn } from "@/lib/utils";

const selectClass =
  "h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";
function localZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
}
function newForm(
  message = "",
  person?: { name: string; phone: string; channel?: MessageChannel },
  messageLocale: Locale = "es",
  verseId?: string,
): ScheduleInput {
  return {
    recipientName: person?.name ?? "",
    phone: person?.phone ?? "",
    message,
    messageLocale,
    verseId,
    // The person's own preference when we came from their card.
    channel: person?.channel ?? "whatsapp",
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
  initialLocale?: Locale;
  initialVerseId?: string;
  initialPerson?: { name: string; phone: string; channel?: MessageChannel };
};
export function MessageSchedulePanel(props: MessageSchedulePanelProps) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <MessageScheduleForm {...props} />
    </QueryClientProvider>
  );
}
function MessageScheduleForm({
  initialMessage = "",
  initialPerson,
  initialLocale,
  initialVerseId,
}: MessageSchedulePanelProps) {
  const { locale, t } = useI18n();
  const copy = scheduleCopy(locale);
  const { user, isPending } = useCurrentUserState();
  const recipients = useAppStore((s) => s.recipients);
  const displayName = useAppStore((s) => s.displayName);
  const id = useId();
  const [form, setForm] = useState(() =>
    newForm(initialMessage, initialPerson, initialLocale ?? locale, initialVerseId),
  );
  const languageCopy = messageLanguageCopy(locale);
  const [pickerTheme, setPickerTheme] = useState<ThemeId | "">(
    () => getVerseById(initialVerseId ?? "")?.themes[0] ?? "",
  );
  const [preparing, setPreparing] = useState(false);
  const requestVersion = useRef(0);
  const [busy, setBusy] = useState(false);
  // The form sits above the list, so editing a schedule further down filled it
  // off screen and looked like nothing happened. A counter, not the edited id,
  // so re-editing the same row scrolls back to it too.
  const formRef = useRef<HTMLFormElement>(null);
  const [editRequest, setEditRequest] = useState(0);
  const [zones] = useState(() => [
    ...new Set([
      localZone(),
      ...COMMON_ZONES,
      ...(typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : []),
    ]),
  ]);
  useEffect(() => {
    if (editRequest) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editRequest]);
  const query = useQuery({
    queryKey: ["message-schedules", user?.id],
    queryFn: () => getMessageSchedules(),
    enabled: Boolean(user),
    retry: false,
    refetchInterval: user ? 60_000 : false,
  });
  const connected = query.data?.channelsByLocale[form.messageLocale ?? "es"][form.channel] ?? false;
  const update = (patch: Partial<ScheduleInput>) =>
    setForm((current) => ({ ...current, ...patch }));
  async function chooseVerse(verseId: string, messageLocale = form.messageLocale ?? "es") {
    const base = getVerseById(verseId);
    if (!base) return;
    const version = ++requestVersion.current;
    setPreparing(true);
    try {
      const verse = await hydrateVerse(base, messageLocale);
      if (version !== requestVersion.current) return;
      update({
        verseId,
        messageLocale,
        message: formatVerseMessage(verse, undefined, undefined, messageLocale),
      });
    } catch {
      if (version === requestVersion.current) toast.error(languageCopy.error);
    } finally {
      if (version === requestVersion.current) setPreparing(false);
    }
  }
  function changeLanguage(messageLocale: Locale, patch: Partial<ScheduleInput> = {}) {
    // Apply the language up front: a verse that fails to load must not leave the
    // selector showing the previous language.
    update({ ...patch, messageLocale });
    if (form.verseId) void chooseVerse(form.verseId, messageLocale);
    else {
      requestVersion.current++;
      setPreparing(false);
    }
  }
  function editSchedule(row: MessageSchedule) {
    requestVersion.current++;
    setPreparing(false);
    setPickerTheme(getVerseById(row.verseId ?? "")?.themes[0] ?? "");
    setForm({ ...row });
    setEditRequest((n) => n + 1);
  }
  function resetForm() {
    requestVersion.current++;
    setPreparing(false);
    setPickerTheme("");
    setForm(newForm("", undefined, locale));
  }
  function showError(error: unknown) {
    const key = error instanceof Error ? error.message : "";
    toast.error(key in copy ? copy[key as keyof typeof copy] : copy.error);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!user || preparing) return;
    setBusy(true);
    try {
      await saveMessageSchedule({ data: validateSchedule(form) });
      toast.success(copy.saved);
      resetForm();
      await query.refetch();
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }
  async function remove(row: MessageSchedule) {
    if (!window.confirm(copy.deleteConfirm)) return;
    setBusy(true);
    try {
      await deleteMessageSchedule({ data: { id: row.id } });
      toast.success(copy.deleted);
      if (form.id === row.id) resetForm();
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
        <div
          role="status"
          className="rounded-lg border border-border bg-secondary p-3 text-sm leading-relaxed"
        >
          <p>{connected ? copy.ready : copy.notConnected}</p>
          {!connected && query.data.requirements ? (
            <>
              <p className="mt-3 font-medium">{copy.missingTitle}</p>
              <ul className="mt-1.5 space-y-1.5">
                {missingRequirements(query.data.requirements, form, copy).map((item) => (
                  <li key={item.key} className="flex gap-2">
                    <span aria-hidden="true">{item.done ? "\u2713" : "\u2022"}</span>
                    <span className={cn("min-w-0", item.done && "text-muted-foreground")}>
                      {item.label}
                      {item.done ? (
                        <span className="ml-1">({copy.missingDone})</span>
                      ) : (
                        <span className="block break-words font-mono text-xs">{item.how}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">{copy.missingHint}</p>
            </>
          ) : null}
        </div>
      ) : null}
      <form
        ref={formRef}
        className="min-w-0 scroll-mt-4 space-y-4 rounded-xl border border-border bg-card p-4 shadow-paper"
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
                  changeLanguage(person.messageLocale ?? form.messageLocale ?? locale, {
                    recipientName: person.name,
                    phone: person.phone,
                    // Their saved preference, so the channel is not chosen twice.
                    channel: person.channel ?? "whatsapp",
                    consent: false,
                  });
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
        <MessageLanguageSelect
          value={form.messageLocale ?? "es"}
          onChange={changeLanguage}
          disabled={busy || preparing}
          hint={languageCopy.customScheduleHint}
        />
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-theme`}>{languageCopy.theme}</Label>
          <select
            id={`${id}-theme`}
            className={selectClass}
            value={pickerTheme}
            disabled={preparing}
            onChange={(e) => {
              const theme = e.target.value as ThemeId | "";
              setPickerTheme(theme);
              update({ verseId: undefined, themeId: form.themeId ? theme || null : null });
            }}
          >
            <option value="">{languageCopy.custom}</option>
            {THEMES.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {localizedTheme(theme.id, locale).name}
              </option>
            ))}
          </select>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{copy.modeTitle}</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(
              [
                { theme: false, label: copy.modeFixed },
                { theme: true, label: copy.modeTheme },
              ] as const
            ).map((option) => {
              const active = Boolean(form.themeId) === option.theme;
              return (
                <Button
                  key={String(option.theme)}
                  type="button"
                  variant={active ? "default" : "outline"}
                  aria-pressed={active}
                  disabled={preparing}
                  onClick={() => {
                    requestVersion.current++;
                    setPreparing(false);
                    if (!option.theme) {
                      update({ themeId: null });
                      return;
                    }
                    // Theme mode needs a theme: without one the switch did
                    // nothing visible and only emptied the message, so the
                    // first theme is chosen and can be changed above.
                    const theme = pickerTheme || THEMES[0].id;
                    setPickerTheme(theme);
                    update({
                      themeId: theme,
                      verseId: undefined,
                      message: "",
                      senderName: form.senderName ?? displayName.trim() ?? "",
                    });
                  }}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
          {form.themeId ? (
            <p className="text-xs text-muted-foreground">
              {copy.modeThemeHint.replaceAll("{n}", String(versesForTheme(form.themeId).length))}
            </p>
          ) : null}
        </fieldset>
        {form.themeId ? (
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-sender`}>{copy.senderName}</Label>
            <Input
              id={`${id}-sender`}
              value={form.senderName ?? ""}
              maxLength={80}
              onChange={(e) => update({ senderName: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">{copy.senderNameHint}</p>
            <p className="text-xs text-muted-foreground">{copy.themeExample}</p>
            <pre className="rounded-md border border-border bg-secondary p-3 text-xs whitespace-pre-wrap break-words">
              {`${fallbackNotes(form.messageLocale ?? "es")[0]}\n\n«…»\n— ${(() => {
                const first = versesForTheme(form.themeId)[0];
                return first ? localizeVerse(first, form.messageLocale ?? "es").ref : "";
              })()}${form.senderName?.trim() ? `\n\n${t("signOff", { name: form.senderName.trim() })}` : ""}`}
            </pre>
          </div>
        ) : null}
        {pickerTheme && !form.themeId ? (
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-verse`}>{languageCopy.verse}</Label>
            <select
              id={`${id}-verse`}
              className={selectClass}
              value={form.verseId ?? ""}
              disabled={preparing}
              onChange={(e) => void chooseVerse(e.target.value)}
            >
              <option value="">{languageCopy.choose}</option>
              {versesForTheme(pickerTheme).map((verse) => (
                <option key={verse.id} value={verse.id}>
                  {verse.ref}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {preparing ? (
          <p role="status" className="text-sm">
            {languageCopy.loading}
          </p>
        ) : null}
        {form.themeId ? null : (
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-message`}>{copy.message}</Label>
            <Textarea
              id={`${id}-message`}
              value={form.message}
              onChange={(e) => {
                requestVersion.current++;
                setPreparing(false);
                update({ message: e.target.value, verseId: undefined });
              }}
              lang={form.messageLocale ?? "es"}
              required
              maxLength={1000}
              className="min-h-28"
              aria-describedby={`${id}-message-hint`}
            />
            <p id={`${id}-message-hint`} className="text-xs text-muted-foreground">
              {copy.messageHint}
              {form.channel === "sms"
                ? ` ${copy.smsFooterHint.replace("{footer}", SMS_FOOTER[form.messageLocale ?? "es"])}`
                : null}
            </p>
          </div>
        )}
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
          <span>
            {copy.consent}{" "}
            <Link to="/terms" className="underline underline-offset-4">
              {copy.consentTerms}
            </Link>
          </span>
        </label>
        <p className="text-xs text-muted-foreground">{copy.saveFirst}</p>
        <div className="flex flex-wrap gap-2">
          {form.id ? (
            <Button type="button" variant="outline" disabled={busy} onClick={resetForm}>
              {copy.cancel}
            </Button>
          ) : null}
          <Button
            type="submit"
            className="flex-1"
            disabled={busy || preparing || !user || query.isError || query.isPending}
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
                    {formatPhone(row.phone)} · {row.channel === "sms" ? "SMS" : "WhatsApp"} ·{" "}
                    {messageLanguageName(row.messageLocale ?? "es")}
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
              {row.themeId ? (
                <p className="text-sm">
                  {copy.cardTheme.replace("{theme}", localizedTheme(row.themeId, locale).name)}
                </p>
              ) : (
                <p className="whitespace-pre-wrap break-words text-sm">{row.message}</p>
              )}
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
              {row.lastProviderStatus ? (
                <p
                  className={cn(
                    "text-xs",
                    row.lastProviderStatus === "delivered"
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {providerStatusLine(copy, row.lastProviderStatus, row.lastProviderErrorCode)}
                </p>
              ) : null}
              {/* A bare provider code sends the owner searching; show its words.
                  Our own codes (not_configured, missed_time) already have copy
                  above, so only a numeric one from the provider is printed. */}
              {row.lastError ||
              /^\d+$/.test(row.lastErrorCode ?? "") ||
              (row.lastErrorCode && row.lastErrorCode in copy) ? (
                <p className="break-words text-xs text-muted-foreground">
                  {row.lastError
                    ? `${copy.reason}: ${row.lastError}`
                    : row.lastErrorCode && row.lastErrorCode in copy
                      ? copy[row.lastErrorCode as keyof typeof copy]
                      : `${copy.reasonCode}: ${row.lastErrorCode}`}
                </p>
              ) : null}
              {!query.data.channelsByLocale[row.messageLocale ?? "es"][row.channel] &&
              !row.enabled ? (
                <p className="text-xs text-muted-foreground">{copy.scheduleNotConnected}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => editSchedule(row)}
                >
                  {copy.edit}
                </Button>
                <Button
                  type="button"
                  disabled={
                    busy ||
                    (!row.enabled &&
                      !query.data.channelsByLocale[row.messageLocale ?? "es"][row.channel])
                  }
                  onClick={() => void toggle(row)}
                >
                  {row.enabled ? copy.pause : copy.activate}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void remove(row)}
                >
                  {copy.delete}
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
