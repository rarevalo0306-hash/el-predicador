import { useMemo, useState } from "react";
import {
  Bell,
  Church,
  MessageCircle,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/language-switch";
import { cn } from "@/lib/utils";
import {
  useAppStore,
  type Recipient,
  type RecipientInput,
} from "@/lib/store";
import {
  WEEKDAY_KEYS,
  cultoInviteText,
  type Weekday,
} from "@/lib/church";
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
import { formatVerseMessage, openWhatsApp } from "@/lib/share";
import { showDailyNotification } from "@/lib/notify";

type PeoplePreachViewProps = {
  onSend: (verse: Verse, draft?: { note?: string }) => void;
};

const emptyForm: RecipientInput = {
  name: "",
  phone: "",
  themeId: "amor",
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
  const markRecipientDailySent = useAppStore((s) => s.markRecipientDailySent);
  const markRecipientCultoSent = useAppStore((s) => s.markRecipientCultoSent);
  const church = useAppStore((s) => s.church);
  const setChurch = useAppStore((s) => s.setChurch);
  const displayName = useAppStore((s) => s.displayName);
  const notifyHour = useAppStore((s) => s.notifyHour);
  const [form, setForm] = useState<RecipientInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [section, setSection] = useState<"people" | "church">("people");

  const due = useMemo(
    () => allDueItems(recipients, church, notifyHour),
    [recipients, church, notifyHour],
  );

  function startEdit(row: Recipient) {
    setEditingId(row.id);
    setForm({
      id: row.id,
      name: row.name,
      phone: row.phone,
      themeId: row.themeId ?? "amor",
      notes: row.notes ?? "",
      dailyEnabled: row.dailyEnabled ?? false,
      dailyHour: row.dailyHour ?? 9,
      cultoEnabled: row.cultoEnabled ?? false,
    });
    setSection("people");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleSave() {
    const saved = upsertRecipient(form);
    if (!saved) {
      toast(t("recipientNeedPhone"));
      return;
    }
    toast(editingId ? t("personUpdated") : t("personSaved"));
    resetForm();
  }

  async function sendDaily(row: Recipient) {
    const themeId = (row.themeId ?? "amor") as ThemeId;
    const pool = versesForTheme(themeId);
    const base = pool[Math.floor(Math.random() * Math.max(pool.length, 1))] ?? getDailyVerse();
    try {
      const verse = await hydrateVerse(base, locale);
      const theme = localizedTheme(themeId, locale);
      const note =
        locale === "en"
          ? `Thinking of you with a word about ${theme.name}.`
          : `Pensando en ti con una palabra sobre ${theme.name}.`;
      const text = formatVerseMessage(verse, note, displayName, locale);
      openWhatsApp(text, row.phone);
      markRecipientDailySent(row.id);
      toast(t("openingWhatsApp"));
    } catch {
      onSend(base, {
        note:
          locale === "en"
            ? `For ${row.name}`
            : `Para ${row.name}`,
      });
    }
  }

  function sendCulto(row: Recipient) {
    const text = cultoInviteText(church, locale, row.name);
    openWhatsApp(text, row.phone);
    const stamp = new Date().toISOString().slice(0, 10);
    markRecipientCultoSent(row.id, stamp);
    toast(t("openingWhatsApp"));
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

      {due.length > 0 ? (
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
                          theme: localizedTheme(
                            item.recipient.themeId ?? "amor",
                            locale,
                          ).name,
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

      <Button type="button" variant="outline" className="w-full" onClick={() => void enableReminders()}>
        <Bell className="size-4" />
        {t("preachEnableAlerts")}
      </Button>

      {section === "church" ? (
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
                onChange={(e) =>
                  setChurch({ reminderHoursBefore: Number(e.target.value) })
                }
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
        <>
          <div className="flex flex-col gap-3 rounded-xl bg-card px-4 py-5 shadow-paper">
            <p className="text-sm font-medium">
              {editingId ? t("personEdit") : t("personAdd")}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="p-name">{t("recipientName")}</Label>
                <Input
                  id="p-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={t("recipientNamePh")}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="p-phone">{t("contactPhone")}</Label>
                <Input
                  id="p-phone"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder={t("phonePlaceholder")}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("personTheme")}</Label>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((theme) => {
                  const label = localizedTheme(theme.id, locale).name;
                  const on = form.themeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, themeId: theme.id }))}
                      className={cn(
                        "h-9 rounded-full border px-3 text-sm font-medium",
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-notes">{t("personNotes")}</Label>
              <Textarea
                id="p-notes"
                value={form.notes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder={t("personNotesPh")}
                className="min-h-16"
              />
            </div>
            <label className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-3 text-sm">
              <span>
                <span className="block font-medium">{t("personDaily")}</span>
                <span className="text-xs text-muted-foreground">{t("personDailyHint")}</span>
              </span>
              <input
                type="checkbox"
                checked={Boolean(form.dailyEnabled)}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dailyEnabled: e.target.checked }))
                }
                className="size-5 accent-[var(--color-primary)]"
              />
            </label>
            {form.dailyEnabled ? (
              <div className="grid gap-1.5">
                <Label htmlFor="p-hour">{t("personDailyHour")}</Label>
                <Input
                  id="p-hour"
                  type="number"
                  min={0}
                  max={23}
                  value={form.dailyHour ?? 9}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dailyHour: Number(e.target.value) }))
                  }
                />
              </div>
            ) : null}
            <label className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-3 text-sm">
              <span>
                <span className="block font-medium">{t("personCulto")}</span>
                <span className="text-xs text-muted-foreground">{t("personCultoHint")}</span>
              </span>
              <input
                type="checkbox"
                checked={Boolean(form.cultoEnabled)}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cultoEnabled: e.target.checked }))
                }
                className="size-5 accent-[var(--color-primary)]"
              />
            </label>
            <div className="flex gap-2">
              {editingId ? (
                <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>
                  {t("clearSelection")}
                </Button>
              ) : null}
              <Button type="button" className="flex-1" onClick={handleSave}>
                <Plus className="size-4" />
                {editingId ? t("personUpdate") : t("personSave")}
              </Button>
            </div>
          </div>

          {recipients.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">{t("recipientsEmpty")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {recipients.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-border bg-card px-4 py-4 shadow-paper"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">{row.phone}</p>
                      <p className="mt-1 text-xs text-primary">
                        {localizedTheme(row.themeId ?? "amor", locale).name}
                        {row.dailyEnabled ? ` · ${t("personDailyOn")}` : ""}
                        {row.cultoEnabled ? ` · ${t("personCultoOn")}` : ""}
                      </p>
                      {row.notes ? (
                        <p className="mt-2 text-sm text-muted-foreground">{row.notes}</p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={t("recipientRemove")}
                      onClick={() => removeRecipient(row.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => startEdit(row)}>
                      {t("personEdit")}
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
        </>
      )}
    </div>
  );
}
