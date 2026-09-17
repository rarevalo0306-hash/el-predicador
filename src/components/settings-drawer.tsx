import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Smartphone, Trash2, UserRound, UserPlus } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LanguageSwitch, useI18n } from "@/components/language-switch";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useAppStore } from "@/lib/store";
import { hydrateVerse } from "@/lib/recobro";
import { getDailyVerse } from "@/lib/verses";
import { ContactForm } from "@/components/contact-form";
import { PeoplePanel } from "@/components/people-panel";
import { ensurePreacherServiceWorker, showDailyNotification } from "@/lib/notify";

type SettingsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenProfile?: () => void;
  onOpenSignUp?: () => void;
};

export function SettingsDrawer({
  open,
  onOpenChange,
  onOpenProfile,
  onOpenSignUp,
}: SettingsDrawerProps) {
  const { locale, t } = useI18n();
  const displayName = useAppStore((s) => s.displayName);
  const setDisplayName = useAppStore((s) => s.setDisplayName);
  const notify = useAppStore((s) => s.notify);
  const setNotify = useAppStore((s) => s.setNotify);
  const notifyHour = useAppStore((s) => s.notifyHour);
  const setNotifyHour = useAppStore((s) => s.setNotifyHour);
  const recipients = useAppStore((s) => s.recipients);
  const upsertRecipient = useAppStore((s) => s.upsertRecipient);
  const removeRecipient = useAppStore((s) => s.removeRecipient);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  async function toggleNotify() {
    if (notify) {
      setNotify(false);
      return;
    }
    if (typeof Notification === "undefined") {
      toast(t("notifyUnsupported"));
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast(t("notifyDenied"));
      return;
    }
    await ensurePreacherServiceWorker();
    setNotify(true);
    try {
      const verse = await hydrateVerse(getDailyVerse(), locale);
      await showDailyNotification({
        title: t("notifyBodyTitle"),
        body: `${verse.ref}: ${verse.text.slice(0, 140)}`,
        tag: `daily-${new Date().toISOString().slice(0, 10)}`,
      });
    } catch {
      /* verse fetch can fail; reminder is still on */
    }
    toast(t("notifyOn"));
  }

  function handleAddRecipient() {
    const saved = upsertRecipient({ name: newName || newPhone, phone: newPhone });
    if (!saved) {
      toast(t("recipientNeedPhone"));
      return;
    }
    setNewName("");
    setNewPhone("");
    toast(t("recipientSaved"));
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("settingsTitle")}</DrawerTitle>
          <DrawerDescription>{t("settingsDesc")}</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-8">
          <div className="rounded-lg bg-secondary px-4 py-4">
            <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
              {t("installTitle")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("installDesc")}
            </p>
            <Button asChild className="mt-4 w-full">
              <a href="/?install=1&platform=ios">
                <Smartphone className="size-4" />
                {t("installIphone")}
              </a>
            </Button>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {t("installAndroid")}
            </p>
          </div>
          <div className="rounded-lg bg-secondary px-4 py-3">
            <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
              {t("yourAccount")}
            </p>
            <SignedIn>
              <div className="mt-3">
                <UserButton />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t("accountKeeps")}</p>
            </SignedIn>
            <SignedOut>
              <p className="mt-2 text-sm text-muted-foreground">{t("profileGuest")}</p>
              <div className="mt-3 flex flex-col gap-2">
                <Button
                  type="button"
                  className="h-11 w-full"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenProfile?.();
                  }}
                >
                  <UserRound className="size-4" />
                  {t("logIn")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenSignUp?.();
                  }}
                >
                  {t("signupLink")}
                </Button>
              </div>
            </SignedOut>
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-medium">{t("language")}</p>
            <LanguageSwitch />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="display-name">{t("displayName")}</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={t("displayPlaceholder")}
              autoComplete="name"
            />
          </div>
          <button
            type="button"
            onClick={() => void toggleNotify()}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 text-left"
            aria-pressed={notify}
          >
            <span>
              <span className="block text-sm font-medium">{t("notifyTitle")}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {t("notifyDesc")}
              </span>
            </span>
            <span
              className={
                notify
                  ? "h-6 w-10 rounded-full bg-primary p-0.5"
                  : "h-6 w-10 rounded-full bg-secondary p-0.5"
              }
            >
              <span
                className={
                  notify
                    ? "ml-4 block h-5 w-5 rounded-full bg-primary-foreground"
                    : "block h-5 w-5 rounded-full bg-muted-foreground/40"
                }
              />
            </span>
          </button>
          {notify ? (
            <div className="grid gap-2">
              <Label htmlFor="notify-hour">{t("notifyHour")}</Label>
              <Input
                id="notify-hour"
                type="number"
                min={0}
                max={23}
                value={notifyHour}
                onChange={(event) => setNotifyHour(Number(event.target.value))}
              />
              <p className="text-xs text-muted-foreground">{t("notifyHourHint")}</p>
            </div>
          ) : null}

          <div className="rounded-lg border border-border bg-card px-4 py-4">
            <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
              {t("recipientsManage")}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{t("recipientsManageHint")}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder={t("recipientNamePh")}
                aria-label={t("recipientName")}
              />
              <Input
                value={newPhone}
                onChange={(event) => setNewPhone(event.target.value)}
                placeholder={t("phonePlaceholder")}
                inputMode="tel"
                aria-label={t("phoneOptional")}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              className="mt-2 w-full"
              onClick={handleAddRecipient}
            >
              <UserPlus className="size-4" />
              {t("recipientSave")}
            </Button>
            {recipients.length ? (
              <ul className="mt-3 flex flex-col gap-2">
                {recipients.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-2 rounded-md bg-secondary px-3 py-2 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{row.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {row.phone}
                      </span>
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        asChild
                        aria-label={t("peopleWhatsApp")}
                      >
                        <a
                          href={`https://wa.me/${row.phone}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="size-4" />
                        </a>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeRecipient(row.id)}
                        aria-label={t("recipientRemove")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">{t("recipientsEmpty")}</p>
            )}
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-medium">{t("contactTitle")}</p>
            <ContactForm compact />
          </div>
          <SignedIn>
            <div className="rounded-lg border border-border bg-card px-4 py-4">
              <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
                {t("peopleTitle")}
              </p>
              <div className="mt-3">
                <PeoplePanel />
              </div>
            </div>
          </SignedIn>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
