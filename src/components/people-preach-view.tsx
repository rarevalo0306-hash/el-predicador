import { messageLanguageName } from "@/lib/message-language";
import { MessageSchedulePanel } from "@/components/message-schedule-panel";
import { scheduleCopy } from "@/lib/schedule-copy";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CalendarClock,
  Church,
  MessageCircle,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizePhone, formatPhone } from "@/lib/phone";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/language-switch";
import { cn } from "@/lib/utils";
import { canPickDeviceContacts, pickDeviceContacts } from "@/lib/device-contacts";
import { PersonFormDrawer } from "@/components/person-form-drawer";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { returnFocusTo } from "@/lib/panel-focus";
import {
  PEOPLE_FILTERS,
  PEOPLE_PAGE,
  filterCounts,
  filterPeople,
  themesInUse,
  type PeopleFilter,
} from "@/lib/people-filter";
import {
  MAX_RECIPIENTS,
  useAppStore,
  type Recipient,
  type RecipientInput,
  type SendDraft,
} from "@/lib/store";
import { WEEKDAY_KEYS, cultoInviteText, type Weekday } from "@/lib/church";
import { allDueItems } from "@/lib/preach-schedule";
import {
  THEMES,
  getDailyVerse,
  localizedTheme,
  versesForTheme,
  type ThemeId,
  type Verse,
} from "@/lib/verses";
import { hydrateVerse } from "@/lib/recobro";
import { formatVerseMessage, openSms, openWhatsApp } from "@/lib/share";
import { showDailyNotification } from "@/lib/notify";
import { recipientThemes, themeForDay } from "@/lib/recipient-themes";
import type { Locale } from "@/lib/i18n";

/** "Amor · Fe · Paz": every theme a contact cares about, in their order. */
function themeNames(row: Recipient, locale: Locale) {
  return recipientThemes(row)
    .map((id) => localizedTheme(id, locale).name)
    .join(" · ");
}

type PeoplePreachViewProps = {
  onSend: (verse: Verse, draft?: SendDraft) => void;
};

const emptyForm: RecipientInput = {
  name: "",
  phone: "",
  themeIds: ["amor"],
  channel: "whatsapp",
  notes: "",
  dailyEnabled: true,
  dailyHour: 9,
  cultoEnabled: true,
};

export function PeoplePreachView({ onSend }: PeoplePreachViewProps) {
  const { locale, t } = useI18n();
  const recipients = useAppStore((s) => s.recipients);
  const upsertRecipient = useAppStore((s) => s.upsertRecipient);
  const removeRecipient = useAppStore((s) => s.removeRecipient);
  const restoreRecipient = useAppStore((s) => s.restoreRecipient);
  const markRecipientDailySent = useAppStore((s) => s.markRecipientDailySent);
  const markRecipientCultoSent = useAppStore((s) => s.markRecipientCultoSent);
  const church = useAppStore((s) => s.church);
  const setChurch = useAppStore((s) => s.setChurch);
  const displayName = useAppStore((s) => s.displayName);
  const notifyHour = useAppStore((s) => s.notifyHour);
  const bibleVersions = useAppStore((s) => s.bibleVersions);
  // Two drafts, so opening Editar never wipes a half-typed new person and a
  // half-done edit comes back when the same person is opened again.
  const [newForm, setNewForm] = useState<RecipientInput>(() => ({
    ...emptyForm,
    messageLocale: locale,
  }));
  const [editForm, setEditForm] = useState<RecipientInput>(emptyForm);
  // Whose edit is in editForm; null when there is none.
  const [editDraftId, setEditDraftId] = useState<string | null>(null);
  // Which draft the panel shows.
  const [mode, setMode] = useState<"new" | "edit">("new");
  const [section, setSection] = useState<"people" | "church" | "schedules">("people");
  // Settled after mount: the server has no navigator, and deciding during the
  // first render would make the markup disagree with what the phone supports.
  // Who the schedule form opens for. Set from a contact's card so their name,
  // number and channel are already filled in instead of typed again.
  const [schedulePerson, setSchedulePerson] = useState<Recipient | null>(null);
  const [canPickContacts, setCanPickContacts] = useState(false);
  const [importing, setImporting] = useState(false);
  // The list comes first; "Nueva persona" and "Editar" open the form in a panel.
  const [formOpen, setFormOpen] = useState(false);
  // The button that opened the form, so focus goes back to it on close.
  const formOpener = useRef("[data-person-new]");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PeopleFilter>("all");
  const [theme, setTheme] = useState<ThemeId | "all">("all");
  const [limit, setLimit] = useState(PEOPLE_PAGE);
  // Who "Quitar" was tapped for, waiting on the confirmation.
  const [removing, setRemoving] = useState<Recipient | null>(null);
  // Whose "Quitar" opened the confirmation, and whether it went through:
  // focus goes back to that button on Cancelar, to the list after removing.
  const removeTrigger = useRef<{ id: string; removed: boolean } | null>(null);
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  // The last removal, undone from a line in the list itself (reachable by
  // keyboard and screen readers, unlike a notice that fades away).
  const [lastRemoved, setLastRemoved] = useState<{ row: Recipient; index: number } | null>(null);
  // After "Mostrar más", focus moves to the first contact it revealed.
  const revealFrom = useRef<number | null>(null);

  useEffect(() => setCanPickContacts(canPickDeviceContacts()), []);

  const counts = useMemo(() => filterCounts(recipients), [recipients]);
  const themeOptions = useMemo(
    () =>
      themesInUse(
        recipients,
        THEMES.map((item) => item.id),
      ),
    [recipients],
  );
  // A theme nobody follows any more is no longer a filter (its option is gone).
  const activeTheme: ThemeId | "all" =
    theme !== "all" && themeOptions.includes(theme) ? theme : "all";
  const matches = useMemo(
    () => filterPeople(recipients, query, filter, activeTheme),
    [recipients, query, filter, activeTheme],
  );
  const shown = matches.slice(0, limit);
  const narrowed = query.trim() !== "" || filter !== "all" || activeTheme !== "all";

  useEffect(() => {
    const from = revealFrom.current;
    revealFrom.current = null;
    const id = from === null ? undefined : shown[from]?.id;
    if (id) document.querySelector<HTMLElement>(`[data-person-edit="${CSS.escape(id)}"]`)?.focus();
    // Only when "Mostrar más" changed the limit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const due = useMemo(
    () => allDueItems(recipients, church, notifyHour),
    [recipients, church, notifyHour],
  );

  function startEdit(row: Recipient) {
    setMode("edit");
    formOpener.current = `[data-person-edit="${row.id}"]`;
    setSection("people");
    setFormOpen(true);
    if (editDraftId === row.id) return;
    setEditDraftId(row.id);
    setEditForm({
      id: row.id,
      name: row.name,
      phone: normalizePhone(row.phone) ?? row.phone,
      themeIds: recipientThemes(row),
      messageLocale: row.messageLocale ?? locale,
      channel: row.channel ?? "whatsapp",
      notes: row.notes ?? "",
      dailyEnabled: row.dailyEnabled ?? false,
      dailyHour: row.dailyHour ?? 9,
      cultoEnabled: row.cultoEnabled ?? false,
    });
  }

  /** A new person; a half-typed one comes back. */
  function openNew() {
    setMode("new");
    formOpener.current = "[data-person-new]";
    setFormOpen(true);
  }

  function clearFilters() {
    setQuery("");
    setFilter("all");
    setTheme("all");
    setLimit(PEOPLE_PAGE);
  }

  /** Removes after the confirmation; "Deshacer" stays in the list until the next change. */
  function confirmRemove(row: Recipient) {
    if (removeTrigger.current) removeTrigger.current.removed = true;
    const index = recipients.findIndex((item) => item.id === row.id);
    removeRecipient(row.id);
    if (editDraftId === row.id) setEditDraftId(null);
    setLastRemoved({ row, index });
  }

  /** Back where it was, unless the list filled up or the number was saved again. */
  function undoRemove() {
    if (!lastRemoved) return;
    const result = restoreRecipient(lastRemoved.row, lastRemoved.index);
    setLastRemoved(null);
    if (!result.ok) {
      toast.error(
        result.reason === "full"
          ? t("personImportFull")
          : t("personUndoTaken", { name: result.name }),
      );
      listHeadingRef.current?.focus();
      return;
    }
    const id = lastRemoved.row.id;
    requestAnimationFrame(() =>
      (
        document.querySelector<HTMLElement>(`[data-person-edit="${CSS.escape(id)}"]`) ??
        listHeadingRef.current
      )?.focus(),
    );
  }

  /** Send by the channel this person chose; contacts saved before it exist
   *  carry none and keep WhatsApp, which is what the app always did. */
  function sendTo(row: Recipient, text: string) {
    if ((row.channel ?? "whatsapp") === "sms") {
      openSms(text, row.phone);
      toast(t("openingSms"));
      return;
    }
    openWhatsApp(text, row.phone);
    toast(t("openingWhatsApp"));
  }

  async function importFromPhone() {
    setImporting(true);
    setLastRemoved(null);
    try {
      const { contacts, skipped } = await pickDeviceContacts();
      if (!contacts.length) {
        // Picking nobody is a cancel; only say something when entries were unusable.
        if (skipped) toast.error(t("personImportNone"));
        return;
      }
      // Someone already saved is updated in place, so they cost no slot.
      const known = new Set(recipients.map((row) => normalizePhone(row.phone)).filter(Boolean));
      const room = Math.max(0, MAX_RECIPIENTS - recipients.length);
      let taken = 0;
      let overflow = 0;
      let added = 0;
      for (const contact of contacts) {
        const isNew = !known.has(contact.phone);
        if (isNew && taken >= room) {
          overflow += 1;
          continue;
        }
        const saved = upsertRecipient({
          ...emptyForm,
          name: contact.name || formatPhone(contact.phone),
          phone: contact.phone,
          messageLocale: locale,
          // Reminders stay off on an import: picking twenty people at once is
          // not twenty decisions to message them daily. Each one can be turned
          // on from its card.
          dailyEnabled: false,
          cultoEnabled: false,
        });
        if (!saved) continue;
        if (isNew) taken += 1;
        added += 1;
      }
      if (!added) {
        toast.error(overflow ? t("personImportFull") : t("personImportNone"));
        return;
      }
      toast.success(added === 1 ? t("personImportedOne") : t("personImported", { n: added }));
      if (overflow) toast.error(t("personImportFull"));
      else if (skipped) toast(t("personImportSkipped", { n: skipped }));
    } catch (error) {
      // Dismissing the phone's picker is not a failure worth reporting.
      if ((error as Error | undefined)?.name !== "AbortError") {
        toast.error(t("personImportError"));
      }
    } finally {
      setImporting(false);
    }
  }

  function handleSave() {
    const editing = mode === "edit" && editDraftId !== null;
    const form = editing ? editForm : newForm;
    // The list holds MAX_RECIPIENTS; a new number past that would push the
    // oldest contact out without a word.
    const phone = normalizePhone(form.phone);
    const known = recipients.some(
      (row) =>
        (editing && row.id === editDraftId) || (phone && normalizePhone(row.phone) === phone),
    );
    if (!known && recipients.length >= MAX_RECIPIENTS) {
      toast.error(t("personImportFull"));
      return;
    }
    const saved = upsertRecipient(form);
    if (!saved) {
      toast(t("recipientNeedPhone"));
      return;
    }
    toast(editing ? t("personUpdated") : t("personSaved"));
    setLastRemoved(null);
    if (editing) {
      setEditDraftId(null);
    } else {
      // Someone new goes to the top of the list; make sure no search hides them.
      clearFilters();
      setNewForm({ ...emptyForm, messageLocale: locale });
    }
    setFormOpen(false);
  }

  async function sendDaily(row: Recipient) {
    if (!normalizePhone(row.phone)) {
      toast.error(t("recipientNeedPhone"));
      return;
    }
    const messageLocale = row.messageLocale ?? locale;
    const themeId = themeForDay(recipientThemes(row), Math.floor(Date.now() / 86_400_000));
    const pool = versesForTheme(themeId);
    const base = pool[Math.floor(Math.random() * Math.max(pool.length, 1))] ?? getDailyVerse();
    try {
      const verse = await hydrateVerse(base, messageLocale, bibleVersions[messageLocale]);
      const theme = localizedTheme(themeId, messageLocale);
      const note =
        messageLocale === "en"
          ? `Thinking of you with a word about ${theme.name}.`
          : `Pensando en ti con una palabra sobre ${theme.name}.`;
      const text = formatVerseMessage(verse, note, displayName, messageLocale);
      sendTo(row, text);
      markRecipientDailySent(row.id);
    } catch {
      onSend(base, {
        messageLocale,
        note: messageLocale === "en" ? `For ${row.name}` : `Para ${row.name}`,
      });
    }
  }

  function sendCulto(row: Recipient) {
    if (!normalizePhone(row.phone)) {
      toast.error(t("recipientNeedPhone"));
      return;
    }
    const text = cultoInviteText(church, row.messageLocale ?? locale, row.name);
    sendTo(row, text);
    const stamp = new Date().toISOString().slice(0, 10);
    markRecipientCultoSent(row.id, stamp);
  }

  async function enableReminders() {
    if (typeof Notification === "undefined") {
      toast(t("notifyUnsupported"));
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast(t("notifyDenied"));
      return;
    }
    useAppStore.getState().setNotify(true);
    await showDailyNotification({
      title: t("preachRemindTitle"),
      body: t("preachRemindBody"),
      tag: "preach-reminders",
    });
    toast(t("notifyOn"));
  }

  function toggleServiceDay(day: Weekday) {
    const set = new Set(church.serviceDays);
    if (set.has(day)) set.delete(day);
    else set.add(day);
    const next = [...set].sort((a, b) => a - b) as Weekday[];
    setChurch({ serviceDays: next.length ? next : [0] });
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-serif text-3xl tracking-tight">{t("preachTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("preachSub")}</p>
      </header>

      <Button
        type="button"
        className="h-12 w-full"
        onClick={() => {
          setSchedulePerson(null);
          setSection("schedules");
        }}
        aria-pressed={section === "schedules"}
      >
        {scheduleCopy(locale).title}
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSection("people")}
          className={cn(
            "flex h-11 items-center justify-center gap-2 rounded-md border text-sm font-medium",
            section === "people"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card",
          )}
        >
          <Users className="size-4" />
          {t("preachPeople")}
        </button>
        <button
          type="button"
          onClick={() => setSection("church")}
          className={cn(
            "flex h-11 items-center justify-center gap-2 rounded-md border text-sm font-medium",
            section === "church"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card",
          )}
        >
          <Church className="size-4" />
          {t("preachChurch")}
        </button>
      </div>

      {section !== "schedules" && due.length > 0 ? (
        <div className="rounded-xl border border-primary/30 bg-secondary px-4 py-4">
          <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
            {t("preachDueTitle")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t("preachDueHint")}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {due.map((item) => (
              <li
                key={`${item.kind}-${item.recipient.id}`}
                className="flex flex-col gap-2 rounded-lg bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{item.recipient.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.kind === "daily"
                      ? t("preachDueDaily", {
                          theme: themeNames(item.recipient, locale),
                        })
                      : t("preachDueCulto")}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    item.kind === "daily"
                      ? void sendDaily(item.recipient)
                      : sendCulto(item.recipient)
                  }
                >
                  <MessageCircle className="size-4" />
                  {t("preachSendNow")}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {section === "schedules" ? (
        <MessageSchedulePanel
          key={schedulePerson?.id ?? "nuevo"}
          initialPerson={
            schedulePerson
              ? {
                  name: schedulePerson.name,
                  phone: schedulePerson.phone,
                  channel: schedulePerson.channel ?? "whatsapp",
                }
              : undefined
          }
          initialLocale={schedulePerson?.messageLocale}
        />
      ) : section === "church" ? (
        <div className="flex flex-col gap-4 rounded-xl bg-card px-4 py-5 shadow-paper">
          <p className="text-sm text-muted-foreground">{t("churchHint")}</p>
          <div className="grid gap-2">
            <Label htmlFor="church-name">{t("churchName")}</Label>
            <Input
              id="church-name"
              value={church.name}
              onChange={(e) => setChurch({ name: e.target.value })}
              placeholder={t("churchNamePh")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="church-address">{t("churchAddress")}</Label>
            <Input
              id="church-address"
              value={church.address}
              onChange={(e) => setChurch({ address: e.target.value })}
              placeholder={t("churchAddressPh")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="church-city">{t("churchCity")}</Label>
            <Input
              id="church-city"
              value={church.city}
              onChange={(e) => setChurch({ city: e.target.value })}
              placeholder={t("churchCityPh")}
            />
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-medium">{t("churchDays")}</p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_KEYS.map((key, index) => {
                const day = index as Weekday;
                const on = church.serviceDays.includes(day);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleServiceDay(day)}
                    aria-pressed={on}
                    className={cn(
                      "h-9 rounded-full border px-3 text-sm font-medium",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background",
                    )}
                  >
                    {t(key)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="church-time">{t("churchTime")}</Label>
              <Input
                id="church-time"
                type="time"
                value={church.serviceTime}
                onChange={(e) => setChurch({ serviceTime: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="church-before">{t("churchBefore")}</Label>
              <Input
                id="church-before"
                type="number"
                min={1}
                max={48}
                value={church.reminderHoursBefore}
                onChange={(e) => setChurch({ reminderHoursBefore: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="church-note">{t("churchNote")}</Label>
            <Textarea
              id="church-note"
              value={church.note}
              onChange={(e) => setChurch({ note: e.target.value })}
              placeholder={t("churchNotePh")}
              className="min-h-20"
            />
          </div>
        </div>
      ) : (
        <section className="flex flex-col gap-3" aria-labelledby="people-list-title">
          <h2 id="people-list-title" ref={listHeadingRef} tabIndex={-1} className="sr-only">
            {t("preachPeople")}
          </h2>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {recipients.length === 0
                ? ""
                : narrowed
                  ? t("peopleFound", { n: matches.length, total: recipients.length })
                  : recipients.length === 1
                    ? t("peopleCountOne")
                    : t("peopleCount", { n: recipients.length })}
            </p>
            <Button type="button" className="shrink-0" data-person-new onClick={openNew}>
              <Plus className="size-4" />
              {t("personAdd")}
            </Button>
          </div>

          {lastRemoved ? (
            <div
              role="status"
              className="flex items-center justify-between gap-3 rounded-lg bg-secondary px-3 py-2 text-sm"
            >
              <span className="min-w-0 break-words">
                {t("personRemoved", { name: lastRemoved.row.name })}
              </span>
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                data-person-undo
                onClick={undoRemove}
              >
                {t("undo")}
              </Button>
            </div>
          ) : null}

          {recipients.length > 0 ? (
            <>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setLimit(PEOPLE_PAGE);
                  }}
                  placeholder={t("peopleSearchPh")}
                  aria-label={t("peopleSearch")}
                  enterKeyHint="search"
                  className="pl-9 text-base"
                />
              </div>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label={t("peopleFilterLabel")}
              >
                {PEOPLE_FILTERS.map((id) => {
                  const on = filter === id;
                  const label = {
                    all: t("peopleFilterAll"),
                    whatsapp: t("personChannelWhatsApp"),
                    sms: t("personChannelSms"),
                    daily: t("peopleFilterDaily"),
                    culto: t("peopleFilterCulto"),
                  }[id];
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={on}
                      disabled={!on && id !== "all" && counts[id] === 0}
                      onClick={() => {
                        setFilter(id);
                        setLimit(PEOPLE_PAGE);
                      }}
                      className={cn(
                        "inline-flex h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors duration-150 disabled:opacity-40",
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card",
                      )}
                    >
                      {label}
                      <span className={cn("text-xs", on ? "opacity-80" : "text-muted-foreground")}>
                        {counts[id]}
                      </span>
                    </button>
                  );
                })}
              </div>
              {themeOptions.length > 1 ? (
                <div className="flex items-center gap-2">
                  <Label htmlFor="people-theme" className="shrink-0 text-sm">
                    {t("peopleThemeLabel")}
                  </Label>
                  <select
                    id="people-theme"
                    value={activeTheme}
                    onChange={(event) => {
                      setTheme(event.target.value as ThemeId | "all");
                      setLimit(PEOPLE_PAGE);
                    }}
                    className="h-11 min-w-0 flex-1 rounded-md border border-input bg-card px-3 text-base"
                  >
                    <option value="all">{t("peopleThemeAll")}</option>
                    {themeOptions.map((id) => (
                      <option key={id} value={id}>
                        {localizedTheme(id, locale).name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </>
          ) : null}

          {recipients.length === 0 ? (
            <p className="rounded-xl bg-card px-4 py-6 text-center text-sm text-muted-foreground shadow-paper">
              {t("peopleEmpty")}
            </p>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-card px-4 py-6 text-center shadow-paper">
              <p className="text-sm text-muted-foreground">{t("peopleNoMatch")}</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  clearFilters();
                  requestAnimationFrame(() => searchRef.current?.focus());
                }}
              >
                {t("peopleClearFilters")}
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {shown.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-border bg-card px-4 py-4 shadow-paper"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium break-words">{row.name}</p>
                      <p className="text-xs text-muted-foreground">{formatPhone(row.phone)}</p>
                      <p className="mt-1 text-xs text-primary">
                        {themeNames(row, locale)} ·{" "}
                        {messageLanguageName(row.messageLocale ?? locale)} ·{" "}
                        {(row.channel ?? "whatsapp") === "sms"
                          ? t("personChannelSms")
                          : t("personChannelWhatsApp")}
                        {row.dailyEnabled ? ` · ${t("personDailyOn")}` : ""}
                        {row.cultoEnabled ? ` · ${t("personCultoOn")}` : ""}
                      </p>
                      {row.notes ? (
                        <p className="mt-2 text-sm break-words text-muted-foreground">
                          {row.notes}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="-mt-2 -mr-2 shrink-0"
                      aria-label={t("personRemoveAria", { name: row.name })}
                      aria-haspopup="dialog"
                      data-person-remove={row.id}
                      onClick={() => {
                        removeTrigger.current = { id: row.id, removed: false };
                        setRemoving(row);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      data-person-edit={row.id}
                      aria-haspopup="dialog"
                      onClick={() => startEdit(row)}
                    >
                      {t("personEdit")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSchedulePerson(row);
                        setSection("schedules");
                      }}
                    >
                      <CalendarClock className="size-4" />
                      {t("personSchedule")}
                    </Button>
                    <Button type="button" size="sm" onClick={() => void sendDaily(row)}>
                      <MessageCircle className="size-4" />
                      {t("preachSendDaily")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => sendCulto(row)}
                    >
                      {t("preachSendCulto")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {matches.length > shown.length ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {t("peopleShowing", { shown: shown.length, total: matches.length })}
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  revealFrom.current = shown.length;
                  setLimit((n) => n + PEOPLE_PAGE);
                }}
              >
                {t("peopleShowMore", {
                  n: Math.min(PEOPLE_PAGE, matches.length - shown.length),
                })}
              </Button>
            </div>
          ) : null}
        </section>
      )}

      {section !== "schedules" ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => void enableReminders()}
        >
          <Bell className="size-4" />
          {t("preachEnableAlerts")}
        </Button>
      ) : null}

      <PersonFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={mode === "edit"}
        form={mode === "edit" ? editForm : newForm}
        setForm={mode === "edit" ? setEditForm : setNewForm}
        onSave={handleSave}
        canPickContacts={canPickContacts}
        importing={importing}
        onImport={() => void importFromPhone()}
        onCloseAutoFocus={(event) => {
          // The card may be gone (an edit that no longer matches the search):
          // then the list itself.
          if (
            !document.querySelector('[role="dialog"]') &&
            !document.querySelector(formOpener.current)
          ) {
            event.preventDefault();
            listHeadingRef.current?.focus();
            return;
          }
          returnFocusTo(formOpener.current)(event);
        }}
      />
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title={t("personRemoveTitle", { name: removing?.name ?? "" })}
        description={t("personRemoveBody")}
        confirmLabel={t("personRemoveYes")}
        cancelLabel={t("cancel")}
        onConfirm={() => {
          if (removing) confirmRemove(removing);
        }}
        onCloseAutoFocus={(event) => {
          const trigger = removeTrigger.current;
          removeTrigger.current = null;
          if (trigger && !trigger.removed) {
            returnFocusTo(`[data-person-remove="${trigger.id}"]`)(event);
            return;
          }
          // The card is gone after a removal; land on its "Deshacer".
          event.preventDefault();
          (
            document.querySelector<HTMLElement>("[data-person-undo]") ?? listHeadingRef.current
          )?.focus();
        }}
      />
    </div>
  );
}
