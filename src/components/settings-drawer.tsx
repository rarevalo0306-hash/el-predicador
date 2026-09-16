import { toast } from "sonner";
import { Smartphone, UserRound } from "lucide-react";
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

type SettingsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenProfile?: () => void;
};

export function SettingsDrawer({
  open,
  onOpenChange,
  onOpenProfile,
}: SettingsDrawerProps) {
  const { locale, t } = useI18n();
  const displayName = useAppStore((s) => s.displayName);
  const setDisplayName = useAppStore((s) => s.setDisplayName);
  const notify = useAppStore((s) => s.notify);
  const setNotify = useAppStore((s) => s.setNotify);

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
    setNotify(true);
    try {
      const verse = await hydrateVerse(getDailyVerse(), locale);
      new Notification(t("notifyBodyTitle"), {
        body: `${verse.ref}: ${verse.text.slice(0, 140)}`,
      });
    } catch {
      /* verse fetch can fail; reminder is still on */
    }
    toast(t("notifyOn"));
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("settingsTitle")}</DrawerTitle>
          <DrawerDescription>{t("settingsDesc")}</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-5 px-5 pb-8">
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
              <Button
                type="button"
                className="mt-3 h-11 w-full"
                onClick={() => {
                  onOpenChange(false);
                  onOpenProfile?.();
                }}
              >
                <UserRound className="size-4" />
                {t("signupLink")}
              </Button>
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
          <div className="grid gap-2">
            <p className="text-sm font-medium">{t("contactTitle")}</p>
            <ContactForm compact />
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-4">
            <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
              {t("peopleTitle")}
            </p>
            <div className="mt-3">
              <PeoplePanel />
            </div>
          </div>
          <div className="rounded-lg bg-card px-4 py-4 shadow-paper">
            <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
              {t("installTitle")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("installDesc")}
            </p>
            <Button asChild className="mt-4 w-full" variant="outline">
              <a href="/?install=1&platform=ios">
                <Smartphone />
                {t("installIphone")}
              </a>
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
