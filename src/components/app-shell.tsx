import { useEffect, useState } from "react";
import { BookOpen, Flame, Heart, Layers, Settings, Sun, UserRound } from "lucide-react";
import { Logo } from "@/components/mark";
import { TodayView } from "@/components/today-view";
import { ThemesView } from "@/components/themes-view";
import { BibleView } from "@/components/bible-view";
import { EvangelismoView } from "@/components/evangelismo-view";
import { SavedView } from "@/components/saved-view";
import { SendDrawer } from "@/components/send-drawer";
import { SettingsDrawer } from "@/components/settings-drawer";
import { ProfileDrawer } from "@/components/profile-drawer";
import { LanguageSwitch, useI18n } from "@/components/language-switch";
import { useCloudSync } from "@/components/cloud-sync";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useAppStore, type SendDraft } from "@/lib/store";
import { detectLocale, persistLocale } from "@/lib/i18n";
import { hydrateVerse } from "@/lib/recobro";
import { getDailyVerse, todayKey, type ThemeId, type Verse } from "@/lib/verses";
import { cn } from "@/lib/utils";

type Tab = "hoy" | "biblia" | "evangelio" | "temas" | "guardados";

const TAB_ICONS: { id: Tab; icon: typeof Sun }[] = [
  { id: "hoy", icon: Sun },
  { id: "biblia", icon: BookOpen },
  { id: "evangelio", icon: Flame },
  { id: "temas", icon: Layers },
  { id: "guardados", icon: Heart },
];

export function AppShell() {
  const { user, isPending } = useCurrentUserState();
  const { setLocale } = useI18n();

  useEffect(() => {
    const detected = detectLocale();
    if (detected !== useAppStore.getState().locale) {
      setLocale(detected);
    } else {
      persistLocale(detected);
    }
  }, [setLocale]);

  return <PreacherApp userId={user?.id} sessionReady={!isPending} />;
}

function PreacherApp({
  userId,
  sessionReady,
}: {
  userId?: string;
  sessionReady: boolean;
}) {
  const { user, isPending } = useCurrentUserState();
  const { locale, t } = useI18n();
  const [tab, setTab] = useState<Tab>("hoy");
  const [mood, setMood] = useState<ThemeId | null>(null);
  const [themeId, setThemeId] = useState<ThemeId | null>(null);
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState<Verse | null>(null);
  const [sendDraft, setSendDraft] = useState<SendDraft>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMode, setProfileMode] = useState<"entrar" | "crear">("entrar");
  const ready = useCloudSync(userId, sessionReady);
  const notify = useAppStore((s) => s.notify);

  useEffect(() => {
    if (!ready || !notify) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    const key = `pv-notified-${todayKey()}`;
    try {
      if (sessionStorage.getItem(key)) return;
      void hydrateVerse(getDailyVerse(), locale)
        .then((verse) => {
          new Notification(t("notifyBodyTitle"), {
            body: `${verse.ref}: ${verse.text.slice(0, 140)}`,
          });
          sessionStorage.setItem(key, "1");
        })
        .catch(() => undefined);
    } catch {
      /* preview iframes may block notifications */
    }
  }, [ready, notify, locale, t]);

  function openSend(verse: Verse, draft?: SendDraft) {
    setSending(verse);
    setSendDraft(draft ?? {});
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <header className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
        <Logo />
        <div className="flex items-center gap-1">
          <LanguageSwitch compact />
          {isPending ? (
            <span className="inline-flex h-11 w-16 animate-pulse rounded-full bg-secondary" />
          ) : user ? (
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label={t("profile")}
            >
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <UserRound className="size-5" />
              )}
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setProfileMode("entrar");
                  setProfileOpen(true);
                }}
                className="inline-flex h-11 items-center rounded-full border border-border bg-card px-3.5 text-sm font-medium text-foreground"
              >
                {t("logIn")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileMode("crear");
                  setProfileOpen(true);
                }}
                className="inline-flex h-11 items-center rounded-full bg-primary px-3.5 text-sm font-medium text-primary-foreground"
              >
                {t("signupLink")}
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label={t("settings")}
          >
            <Settings className="size-5" />
          </button>
        </div>
      </header>
      <main className="flex-1 px-5 pt-2 pb-28">
        {!ready ? (
          <div className="h-40 animate-pulse rounded-xl bg-card" />
        ) : null}
        {ready && tab === "hoy" ? (
          <TodayView mood={mood} onMoodChange={setMood} onSend={openSend} />
        ) : null}
        {ready && tab === "biblia" ? <BibleView onSend={openSend} /> : null}
        {ready && tab === "evangelio" ? <EvangelismoView onSend={openSend} /> : null}
        {ready && tab === "temas" ? (
          <ThemesView
            query={query}
            onQueryChange={setQuery}
            themeId={themeId}
            onThemeChange={setThemeId}
            onSend={openSend}
          />
        ) : null}
        {ready && tab === "guardados" ? (
          <SavedView
            onSend={openSend}
            onExplore={() => {
              setTab("temas");
              setThemeId(null);
            }}
          />
        ) : null}
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]"
        aria-label={t("sections")}
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {TAB_ICONS.map((item) => {
            const active = tab === item.id;
            const Icon = item.icon;
            const labels = {
              hoy: t("tabHoy"),
              biblia: t("tabBiblia"),
              evangelio: t("tabEvangelio"),
              temas: t("tabTemas"),
              guardados: t("tabGuardados"),
            } as const;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 px-0.5 text-[0.65rem] font-medium transition-colors duration-150",
                  active ? "text-primary" : "text-muted-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn("size-5", active && item.id === "guardados" && "fill-primary")}
                />
                {labels[item.id]}
              </button>
            );
          })}
        </div>
      </nav>
      <SendDrawer
        verse={sending}
        draft={sendDraft}
        open={Boolean(sending)}
        onOpenChange={(open) => {
          if (!open) {
            setSending(null);
            setSendDraft({});
          }
        }}
      />
      <SettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onOpenProfile={() => {
          setSettingsOpen(false);
          setProfileMode("entrar");
          setProfileOpen(true);
        }}
        onOpenSignUp={() => {
          setSettingsOpen(false);
          setProfileMode("crear");
          setProfileOpen(true);
        }}
      />
      <ProfileDrawer
        open={profileOpen}
        onOpenChange={setProfileOpen}
        initialMode={profileMode}
      />
    </div>
  );
}
