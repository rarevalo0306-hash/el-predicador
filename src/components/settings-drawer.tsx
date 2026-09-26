import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Share2, Smartphone, UserRound } from "lucide-react";
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
import { ensurePreacherServiceWorker, showDailyNotification } from "@/lib/notify";
import {
  applyFontScale,
  FONT_SCALE_STEPS,
  shareAppLink,
  type FontScale,
} from "@/lib/reader-prefs";
import { cn } from "@/lib/utils";

type SettingsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenProfile?: () => void;
  onOpenSignUp?: () => void;
  /** Where focus goes when the panel closes (see `returnFocusTo`). */
  onCloseAutoFocus?: (event: Event) => void;
};

export function SettingsDrawer({
  open,
  onOpenChange,
  onOpenProfile,
  onOpenSignUp,
  onCloseAutoFocus,
}: SettingsDrawerProps) {
  const { locale, t } = useI18n();
  const displayName = useAppStore((s) => s.displayName);
  const setDisplayName = useAppStore((s) => s.setDisplayName);
  const notify = useAppStore((s) => s.notify);
  const setNotify = useAppStore((s) => s.setNotify);
  const notifyHour = useAppStore((s) => s.notifyHour);
  const setNotifyHour = useAppStore((s) => s.setNotifyHour);
  const recipients = useAppStore((s) => s.recipients);
  const fontScale = useAppStore((s) => s.fontScale);
  const setFontScale = useAppStore((s) => s.setFontScale);
  const bibleVersion = useAppStore((s) => s.bibleVersions[locale]);

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
      const verse = await hydrateVerse(getDailyVerse(), locale, bibleVersion);
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

  function handleFontScale(next: FontScale) {
    setFontScale(next);
    applyFontScale(next);
  }

  async function handleShareApp() {
    const result = await shareAppLink({
      title: "The Preacher",
      text: t("shareAppText"),
      url: "https://www.thepreacher.app",
    });
    if (result === "shared") toast(t("shareAppShared"));
    else if (result === "copied") toast(t("shareAppCopied"));
    else toast(t("shareAppFail"));
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent closeLabel={t("close")} onCloseAutoFocus={onCloseAutoFocus}>
        <DrawerHeader className="pr-14">
          <DrawerTitle>{t("settingsTitle")}</DrawerTitle>
          <DrawerDescription>{t("settingsDesc")}</DrawerDescription>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
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

          <div className="rounded-lg border border-border bg-card px-4 py-4">
            <p className="text-sm font-medium">{t("fontSizeTitle")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("fontSizeHint")}</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="pb-2 text-xs text-muted-foreground">{t("fontSmall")}</span>
              <div className="flex flex-1 gap-2">
                {FONT_SCALE_STEPS.map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => handleFontScale(step)}
                    aria-pressed={fontScale === step}
                    className={cn(
                      "flex h-11 flex-1 items-center justify-center rounded-md border font-serif transition-colors",
                      fontScale === step
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground",
                    )}
                    style={{ fontSize: `${0.85 + step * 0.2}rem` }}
                  >
                    A
                  </button>
                ))}
              </div>
              <span className="pb-2 text-lg text-muted-foreground">{t("fontLarge")}</span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card px-4 py-4">
            <p className="text-sm font-medium">{t("shareAppTitle")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("shareAppDesc")}</p>
            <Button
              type="button"
              variant="secondary"
              className="mt-3 w-full"
              onClick={() => void handleShareApp()}
            >
              <Share2 className="size-4" />
              {t("shareAppCta")}
            </Button>
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
            <p className="mt-2 text-xs text-muted-foreground">{t("preachSub")}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("recipientsSelected", { n: recipients.length })}
            </p>
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-medium">{t("contactTitle")}</p>
            <ContactForm compact />
          </div>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground">
              {t("privacyLink")}
            </Link>
            <Link to="/terms" className="underline underline-offset-4 hover:text-foreground">
              {t("termsLink")}
            </Link>
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
