import { useEffect, useMemo, useState } from "react";
import { Bookmark, Copy, ImageDown, Mail, MessageCircle, Printer, Share2, Smartphone } from "lucide-react";
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
import { useI18n } from "@/components/language-switch";
import { cn } from "@/lib/utils";
import { useAppStore, type SendDraft } from "@/lib/store";
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

export function SendDrawer({ verse, open, draft, onOpenChange }: SendDrawerProps) {
  const { locale, t } = useI18n();
  const displayName = useAppStore((s) => s.displayName);
  const addSent = useAppStore((s) => s.addSent);
  const rememberVerse = useAppStore((s) => s.rememberVerse);
  const saveMessage = useAppStore((s) => s.saveMessage);
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState("");
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const templates = messageTemplates(locale);
  const { verse: shown, error, retry } = useHydratedVerse(verse, locale);

  useEffect(() => {
    if (!open) return;
    setNote(draft?.note ?? "");
    setActiveTemplate(draft?.kind ?? null);
    setPhone("");
  }, [open, verse?.id, draft?.note, draft?.kind]);

  const message = useMemo(() => {
    if (!shown) return "";
    return formatVerseMessage(shown, note, displayName, locale);
  }, [shown, note, displayName, locale]);

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

  async function handleCopy() {
    try {
      await copyText(message);
      markSent();
      toast(t("copied"));
    } catch {
      toast(t("copyFail"));
    }
  }

  function handleWhatsApp() {
    openWhatsApp(message, phone);
    markSent();
    toast(t("openingWhatsApp"));
  }

  function handleSms() {
    openSms(message, phone);
    markSent();
    toast(t("openingSms"));
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
      const shared = await tryNativeShareFile(
        shown ? shown.ref : "The Preacher",
        message,
        file,
      );
      if (shared) {
        markSent();
        toast(t("readyToShare"));
        return;
      }
    } catch {
      /* fall through to text share */
    }
    const shared = await tryNativeShare(
      shown ? shown.ref : "The Preacher",
      message,
    );
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
          setActiveTemplate(null);
        }
      }}
    >
      <DrawerContent className="h-[90dvh]">
        <DrawerHeader>
          <DrawerTitle>{t("sendTitle")}</DrawerTitle>
          <DrawerDescription>{t("sendDesc")}</DrawerDescription>
        </DrawerHeader>
        {error ? (
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
              <div className="grid gap-2">
                <Label htmlFor="phone">{t("phoneOptional")}</Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder={t("phonePlaceholder")}
                />
                <p className="text-xs text-muted-foreground">{t("phoneHint")}</p>
              </div>
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
            <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <ChannelButton
                icon={<MessageCircle />}
                label="WhatsApp"
                hint={t("mostUsed")}
                onClick={handleWhatsApp}
              />
              <ChannelButton
                icon={<Smartphone />}
                label="SMS"
                hint={t("textMessage")}
                onClick={handleSms}
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
