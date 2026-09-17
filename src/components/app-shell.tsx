import { useEffect, useState } from "react";
import { BookOpen, Flame, Heart, Layers, Settings, Sun, UserRound, Users } from "lucide-react";
import { Logo } from "@/components/mark";
import { TodayView } from "@/components/today-view";
import { ThemesView } from "@/components/themes-view";
import { BibleView } from "@/components/bible-view";
import { EvangelismoView } from "@/components/evangelismo-view";
import { SavedView } from "@/components/saved-view";
import { PeoplePreachView } from "@/components/people-preach-view";
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
import { allDueItems } from "@/lib/preach-schedule";
import { showDailyNotification } from "@/lib/notify";
import { cn } from "@/lib/utils";

type Tab = "hoy" | "biblia" | "evangelio" | "temas" | "personas" | "guardados";

const TAB_ICONS: { id: Tab; icon: typeof Sun }[] = [
  { id: "hoy", icon: Sun },
  { id: "biblia", icon: BookOpen },
  { id: "evangelio", icon: Flame },
  { id: "temas", icon: Layers },
  { id: "personas", icon: Users },
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
  const notifyHour = useAppStore((s) => s.notifyHour);
  const fontScale = useAppStore((s) => s.fontScale);
  const recipients = useAppStore((s) => s.recipients);
  const church = useAppStore((s) => s.church);

  useEffect(() => {
    void import("@/lib/reader-prefs").then(({ applyFontScale }) => {
      applyFontScale(fontScale);
    });
  }, [fontScale, ready]);

  useEffect(() => {
    if (!ready || !notify) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    const due = allDueItems(recipients, church, notifyHour);
    if (!due.length) return;
    const key = `pv-preach-due-${todayKey()}-${due.length}`;
    try {
      if (sessionStorage.getItem(key)) return;
      void showDailyNotification({
        title: t("preachRemindTitle"),
        body: t("preachRemindBody"),
        tag: key,
      });
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
  }, [ready, notify, notifyHour, recipients, church, t]);

  useEffect(() => {
    if (!ready || !notify) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    let cancelled = false;
    let timer: number | undefined;

    async function fireDaily() {
      const key = `pv-notified-${todayKey()}`;
      try {
        if (localStorage.getItem(key)) return;
        const verse = await hydrateVerse(getDailyVerse(), locale);
        if (cancelled) return;
        const { showDailyNotification } = await import("@/lib/notify");
        await showDailyNotification({
          title: t("notifyBodyTitle"),
          body: `${verse.ref}: ${verse.text.slice(0, 140)}`,
          tag: key,
        });
        localStorage.setItem(key, "1");
      } catch {
        /* preview iframes may block notifications */
      }
    }

    void import("@/lib/notify").then(async ({ ensurePreacherServiceWorker, msUntilNotifyHour }) => {
      await ensurePreacherServiceWorker();
      if (cancelled) return;
      const delay = msUntilNotifyHour(notifyHour);
      // Also show once today if the preferred hour already passed and we haven't notified.
      const now = new Date();
      if (now.getHours() >= notifyHour) {
        void fireDaily();
      }
      timer = window.setTimeout(() => {
        void fireDaily();
      }, Math.min(delay, 24 * 60 * 60 * 1000));
    });

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [ready, notify, notifyHour, locale, t]);

  function openSend(verse: Verse, draft?: SendDraft) {
    setSending(verse);
    setSendDraft(draft ?? {});
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <header className="flex items-center justify-between gap-2 px-4 pt-5 pb-3 sm:gap-3 sm:px-5">
        <Logo />
        <div className="flex min-w-0 shrink-0 items-center gap-1">
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
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setProfileMode("entrar");
                  setProfileOpen(true);
                }}
                className="inline-flex h-10 items-center rounded-full border border-border bg-card px-2.5 text-xs font-medium text-foreground sm:h-11 sm:px-3.5 sm:text-sm"
              >
                {t("logIn")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileMode("crear");
                  setProfileOpen(true);
                }}
                className="inline-flex h-10 items-center rounded-full bg-primary px-2.5 text-xs font-medium text-primary-foreground sm:h-11 sm:px-3.5 sm:text-sm"
              >
                <span className="sm:hidden">{t("signupShort")}</span>
                <span className="hidden sm:inline">{t("signupLink")}</span>
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
        {ready && tab === "personas" ? (
          <PeoplePreachView onSend={openSend} />
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
        <div className="mx-auto grid max-w-lg grid-cols-6">
          {TAB_ICONS.map((item) => {
            const active = tab === item.id;
            const Icon = item.icon;
            const labels = {
              hoy: t("tabHoy"),
              biblia: t("tabBiblia"),
              evangelio: t("tabEvangelio"),
              temas: t("tabTemas"),
              personas: t("tabPersonas"),
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
