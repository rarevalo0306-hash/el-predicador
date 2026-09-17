import { MessageSchedulePanel } from "@/components/message-schedule-panel";
import { scheduleCopy } from "@/lib/schedule-copy";
import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Copy,
  ImageDown,
  Mail,
  MessageCircle,
  Printer,
  Share2,
  Smartphone,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/phone-input";
import { normalizePhone } from "@/lib/phone";
import { useI18n } from "@/components/language-switch";
import { cn } from "@/lib/utils";
import { useAppStore, type Recipient, type SendDraft } from "@/lib/store";
import { kindFromTemplate, messageTemplates } from "@/lib/messages";
import {
  copyText,
  downloadFile,
  formatVerseMessage,
  openMail,
  openSms,
  openWhatsApp,
  printFile,
  tryNativeShare,
  tryNativeShareFile,
} from "@/lib/share";
import { verseCardFile } from "@/lib/verse-card";
import { type Verse } from "@/lib/verses";
import { useHydratedVerse } from "@/components/use-hydrated-verse";

type SendDrawerProps = {
  verse: Verse | null;
  open: boolean;
  draft?: SendDraft;
  onOpenChange: (open: boolean) => void;
};

type QueueChannel = "whatsapp" | "sms";

type SendQueue = {
  channel: QueueChannel;
  people: Recipient[];
  index: number;
};

export function SendDrawer({ verse, open, draft, onOpenChange }: SendDrawerProps) {
  const { locale, t } = useI18n();
  const displayName = useAppStore((s) => s.displayName);
  const recipients = useAppStore((s) => s.recipients);
  const upsertRecipient = useAppStore((s) => s.upsertRecipient);
  const addSent = useAppStore((s) => s.addSent);
  const rememberVerse = useAppStore((s) => s.rememberVerse);
  const saveMessage = useAppStore((s) => s.saveMessage);
  const [scheduling, setScheduling] = useState(false);
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState("");
  const [personName, setPersonName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [queue, setQueue] = useState<SendQueue | null>(null);
  const templates = messageTemplates(locale);
  const { verse: shown, error, retry } = useHydratedVerse(verse, locale);

  useEffect(() => {
    if (!open) return;
    setScheduling(false);
    setNote(draft?.note ?? "");
    setActiveTemplate(draft?.kind ?? null);
    setPhone("");
    setPersonName("");
    setSelectedIds([]);
    setQueue(null);
  }, [open, verse?.id, draft?.note, draft?.kind]);

  const message = useMemo(() => {
    if (!shown) return "";
    return formatVerseMessage(shown, note, displayName, locale);
  }, [shown, note, displayName, locale]);

  const selectedPeople = useMemo(
    () => recipients.filter((row) => selectedIds.includes(row.id)),
    [recipients, selectedIds],
  );

  function pickTemplate(id: string, text: string) {
    if (activeTemplate === id) {
      setActiveTemplate(null);
      setNote("");
      return;
    }
    setActiveTemplate(id);
    setNote(text);
  }

  function currentKind() {
    return kindFromTemplate(activeTemplate, note);
  }

  function markSent() {
    if (!verse || !shown) return;
    rememberVerse(shown);
    addSent({
      verseId: verse.id,
      at: Date.now(),
      note: note.trim() || undefined,
      kind: currentKind(),
    });
  }

  function handleSaveMessage() {
    if (!verse || !shown) return;
    rememberVerse(shown);
    const saved = saveMessage({
      verseId: verse.id,
      note: note.trim() || undefined,
      kind: currentKind(),
    });
    toast(saved ? t("messageSaved") : t("messageAlready"));
  }

  function toggleRecipient(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function handleSaveRecipient() {
    const saved = upsertRecipient({ name: personName || phone, phone });
    if (!saved) {
      toast(t("recipientNeedPhone"));
      return;
    }
    setSelectedIds((prev) => (prev.includes(saved.id) ? prev : [...prev, saved.id]));
    setPhone("");
    setPersonName("");
    toast(t("recipientSaved"));
  }

  function deliverTo(channel: QueueChannel, person: Recipient) {
    if (channel === "whatsapp") openWhatsApp(message, person.phone);
    else openSms(message, person.phone);
  }

  function startQueue(channel: QueueChannel) {
    if (
      selectedPeople.some((person) => !normalizePhone(person.phone)) ||
      (selectedPeople.length === 0 && phone.trim() && !normalizePhone(phone))
    ) {
      toast.error(t("recipientNeedPhone"));
      return;
    }
    if (selectedPeople.length === 0) {
      if (channel === "whatsapp") {
        openWhatsApp(message, phone);
        markSent();
        toast(t("openingWhatsApp"));
      } else {
        openSms(message, phone);
        markSent();
        toast(t("openingSms"));
      }
      return;
    }
    const people = selectedPeople;
    deliverTo(channel, people[0]);
    markSent();
    if (people.length === 1) {
      toast(channel === "whatsapp" ? t("openingWhatsApp") : t("openingSms"));
      return;
    }
    setQueue({ channel, people, index: 0 });
    toast(t("queueOpened", { name: people[0].name, n: 1, total: people.length }));
  }

  function queueNext() {
    if (!queue) return;
    const nextIndex = queue.index + 1;
    if (nextIndex >= queue.people.length) {
      setQueue(null);
      toast(t("queueDone"));
      return;
    }
    const person = queue.people[nextIndex];
    if (!normalizePhone(person.phone)) {
      toast.error(t("recipientNeedPhone"));
      return;
    }
    deliverTo(queue.channel, person);
    setQueue({ ...queue, index: nextIndex });
    toast(
      t("queueOpened", {
        name: person.name,
        n: nextIndex + 1,
        total: queue.people.length,
      }),
    );
  }

  async function handleCopy() {
    try {
      await copyText(message);
      markSent();
      toast(t("copied"));
    } catch {
      toast(t("copyFail"));
    }
  }

  function handleMail() {
    openMail(shown ? shown.ref : "The Preacher", message);
    markSent();
    toast(t("openingMail"));
  }

  async function makeCard() {
    if (!shown) throw new Error("verse");
    return verseCardFile(shown, note, displayName);
  }

  async function handleSaveImage() {
    try {
      const file = await makeCard();
      downloadFile(file);
      markSent();
      toast(t("imageSaved"));
    } catch {
      toast(t("imageFail"));
    }
  }

  async function handlePrint() {
    try {
      const file = await makeCard();
      printFile(file);
      markSent();
      toast(t("openingPrint"));
    } catch {
      toast(t("imageFail"));
    }
  }

  async function handleShare() {
    try {
      const file = await makeCard();
      const shared = await tryNativeShareFile(shown ? shown.ref : "The Preacher", message, file);
      if (shared) {
        markSent();
        toast(t("readyToShare"));
        return;
      }
    } catch {
      /* fall through to text share */
    }
    const shared = await tryNativeShare(shown ? shown.ref : "The Preacher", message);
    if (shared) {
      markSent();
      toast(t("readyToShare"));
      return;
    }
    await handleCopy();
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setNote("");
          setPhone("");
          setPersonName("");
          setSelectedIds([]);
          setActiveTemplate(null);
          setQueue(null);
        }
      }}
    >
      <DrawerContent className="h-[90dvh]">
        <DrawerHeader>
          <DrawerTitle>{t("sendTitle")}</DrawerTitle>
          <DrawerDescription>{t("sendDesc")}</DrawerDescription>
        </DrawerHeader>
        {scheduling ? (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-8">
            <Button type="button" variant="outline" onClick={() => setScheduling(false)}>{scheduleCopy(locale).back}</Button>
            <MessageSchedulePanel initialMessage={message} initialPerson={selectedPeople.length === 1 ? selectedPeople[0] : { name: personName, phone }} />
          </div>
        ) : error ? (
          <div className="flex flex-col gap-3 px-5 pb-6">
            <p className="text-sm text-muted-foreground">{t("couldNotRead")}</p>
            <Button type="button" variant="outline" onClick={retry}>
              {t("retry")}
            </Button>
          </div>
        ) : shown ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5">
              <div className="rounded-lg bg-secondary px-4 py-3">
                <p className="font-serif text-base leading-snug text-foreground">
                  {shown.text}
                </p>
                <p className="mt-2 text-xs font-medium tracking-[0.12em] text-primary uppercase">
                  {shown.ref}
                </p>
              </div>
              <div className="grid gap-2 rounded-lg border border-border bg-card px-3 py-3">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  <p className="text-sm font-medium">{t("recipientsTitle")}</p>
                </div>
                <p className="text-xs text-muted-foreground">{t("recipientsHint")}</p>
                {recipients.length ? (
                  <div className="flex flex-wrap gap-2">
                    {recipients.map((row) => {
                      const on = selectedIds.includes(row.id);
                      return (
                        <button
                          key={row.id}
                          type="button"
                          onClick={() => toggleRecipient(row.id)}
                          className={cn(
                            "h-9 rounded-full border px-3 text-sm font-medium transition-colors",
                            on
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-foreground",
                          )}
                          aria-pressed={on}
                        >
                          {row.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("recipientsEmpty")}</p>
                )}
                {selectedPeople.length > 1 ? (
                  <p className="text-xs font-medium text-primary">
                    {t("recipientsSelected", { n: selectedPeople.length })}
                  </p>
                ) : null}
                <div className="grid items-start gap-2 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="person-name">{t("recipientName")}</Label>
                    <Input
                      id="person-name"
                      value={personName}
                      onChange={(event) => setPersonName(event.target.value)}
                      placeholder={t("recipientNamePh")}
                      autoComplete="name"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="phone">{t("phoneOptional")}</Label>
                    <PhoneInput id="phone" value={phone} onChange={setPhone} />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={handleSaveRecipient}
                  disabled={!phone.trim()}
                >
                  <UserPlus className="size-4" />
                  {t("recipientSave")}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => pickTemplate(template.id, template.text)}
                    className={cn(
                      "h-9 rounded-full border px-3 text-sm font-medium transition-colors duration-150",
                      activeTemplate === template.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-secondary",
                    )}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="note">{t("personalNote")}</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(event) => {
                    setNote(event.target.value);
                    setActiveTemplate(null);
                  }}
                  placeholder={t("notePlaceholder")}
                  className="min-h-20"
                />
              </div>

              <Button type="button" className="w-full" onClick={() => setScheduling(true)}>{scheduleCopy(locale).scheduleThis}</Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleSaveMessage}
              >
                <Bookmark />
                {t("saveThisMessage")}
              </Button>
            </div>

            {queue ? (
              <div className="shrink-0 border-t border-border bg-secondary px-5 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <p className="text-sm font-medium">
                  {t("queueProgress", {
                    name: queue.people[queue.index]?.name ?? "",
                    n: queue.index + 1,
                    total: queue.people.length,
                  })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t("queueNextHint")}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" onClick={() => setQueue(null)}>
                    {t("queueStop")}
                  </Button>
                  <Button type="button" onClick={queueNext}>
                    {queue.index + 1 >= queue.people.length
                      ? t("queueDone")
                      : t("queueNext")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <ChannelButton
                  icon={<MessageCircle />}
                  label="WhatsApp"
                  hint={
                    selectedPeople.length > 1
                      ? t("sendToN", { n: selectedPeople.length })
                      : t("mostUsed")
                  }
                  onClick={() => startQueue("whatsapp")}
                />
                <ChannelButton
                  icon={<Smartphone />}
                  label="SMS"
                  hint={
                    selectedPeople.length > 1
                      ? t("sendToN", { n: selectedPeople.length })
                      : t("textMessage")
                  }
                  onClick={() => startQueue("sms")}
                />
                <ChannelButton
                  icon={<Mail />}
                  label={t("mailAction")}
                  hint={t("mailHint")}
                  onClick={handleMail}
                />
                <ChannelButton
                  icon={<Copy />}
                  label={t("copyAction")}
                  hint={t("pasteAnywhere")}
                  onClick={() => void handleCopy()}
                />
                <ChannelButton
                  icon={<ImageDown />}
                  label={t("saveImage")}
                  hint={t("saveImageHint")}
                  onClick={() => void handleSaveImage()}
                />
                <ChannelButton
                  icon={<Printer />}
                  label={t("printAction")}
                  hint={t("printHint")}
                  onClick={() => void handlePrint()}
                />
                <ChannelButton
                  icon={<Share2 />}
                  label={t("shareAction")}
                  hint={t("otherApps")}
                  className="col-span-2"
                  onClick={() => void handleShare()}
                />
              </div>
            )}
          </>
        ) : (
          <p className="px-5 pb-6 text-sm text-muted-foreground">{t("loadingVerse")}</p>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function ChannelButton({
  icon,
  label,
  hint,
  onClick,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-auto flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left",
        className,
      )}
    >
      <span className="flex items-center gap-2 text-foreground">
        {icon}
        {label}
      </span>
      <span className="text-xs font-normal text-muted-foreground">{hint}</span>
    </Button>
  );
}
