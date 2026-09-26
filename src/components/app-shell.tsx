import { useEffect, useState } from "react";
import {
  BookOpen,
  Flame,
  Heart,
  Layers,
  MessageCircleQuestion,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
  Users,
} from "lucide-react";
import { AdminView } from "@/components/admin-view";
import { useIsAdmin } from "@/lib/use-is-admin";
import { Logo } from "@/components/mark";
import { TodayView } from "@/components/today-view";
import { ThemesView } from "@/components/themes-view";
import { BibleView, type BibleJump } from "@/components/bible-view";
import { EvangelismoView } from "@/components/evangelismo-view";
import { SavedView } from "@/components/saved-view";
import { PeoplePreachView } from "@/components/people-preach-view";
import { SendDrawer } from "@/components/send-drawer";
import { SettingsDrawer } from "@/components/settings-drawer";
import { ProfileDrawer } from "@/components/profile-drawer";
import { AskDrawer, type AskPassage } from "@/components/ask-drawer";
import { WELCOME_PARAM } from "@/components/invite-contacts";
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
import type { VerseLink } from "@/lib/verse-links";

type Tab = "hoy" | "biblia" | "evangelio" | "temas" | "personas" | "guardados" | "admin";

const TAB_ICONS: { id: Tab; icon: typeof Sun }[] = [
  { id: "hoy", icon: Sun },
  { id: "biblia", icon: BookOpen },
  { id: "evangelio", icon: Flame },
  { id: "temas", icon: Layers },
  { id: "personas", icon: Users },
  { id: "guardados", icon: Heart },
  // Shown to the owner only; the server decides who that is (useIsAdmin).
  { id: "admin", icon: ShieldCheck },
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
  const [askOpen, setAskOpen] = useState(false);
  const [jump, setJump] = useState<BibleJump | null>(null);
  const [askPassage, setAskPassage] = useState<AskPassage | null>(null);
  const [welcome, setWelcome] = useState(false);

  // Google brings a brand-new account back with ?bienvenido=1: offer to
  // share the app, then drop the mark so a reload does not ask again.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get(WELCOME_PARAM) !== "1") return;
    url.searchParams.delete(WELCOME_PARAM);
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    setWelcome(true);
    setProfileOpen(true);
  }, []);
  const ready = useCloudSync(userId, sessionReady);
  const admin = useIsAdmin(userId);
  const tabs = admin ? TAB_ICONS : TAB_ICONS.filter((item) => item.id !== "admin");
  const notify = useAppStore((s) => s.notify);
  const notifyHour = useAppStore((s) => s.notifyHour);
  const fontScale = useAppStore((s) => s.fontScale);
  const recipients = useAppStore((s) => s.recipients);
  const church = useAppStore((s) => s.church);
  const bibleVersion = useAppStore((s) => s.bibleVersions[locale]);

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
        const verse = await hydrateVerse(getDailyVerse(), locale, bibleVersion);
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
  }, [ready, notify, notifyHour, locale, bibleVersion, t]);

  function openSend(verse: Verse, draft?: SendDraft) {
    setSending(verse);
    setSendDraft(draft ?? {});
  }

  /** A passage tapped in an AI answer, opened in the Bible tab. */
  function readVerse(link: VerseLink) {
    setAskOpen(false);
    setJump({ bookId: link.bookId, chapter: link.chapter, verse: link.from, at: Date.now() });
    setTab("biblia");
    window.scrollTo({ top: 0 });
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
        {ready && tab === "biblia" ? (
          <BibleView
            onSend={openSend}
            jump={jump}
            onJumpDone={() => setJump(null)}
            onAsk={(ref, text) => {
              setAskPassage({ ref, text, at: Date.now() });
              setAskOpen(true);
            }}
          />
        ) : null}
        {ready && tab === "evangelio" ? (
          <EvangelismoView onSend={openSend} onReadVerse={readVerse} />
        ) : null}
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
        {ready && tab === "admin" && admin ? <AdminView /> : null}
      </main>
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] z-40">
        <div className="mx-auto flex max-w-lg justify-end px-4">
          <button
            type="button"
            onClick={() => setAskOpen(true)}
            className="pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full bg-primary pr-4 pl-3.5 text-sm font-medium text-primary-foreground shadow-lg transition-transform duration-150 active:scale-95"
          >
            <MessageCircleQuestion className="size-5" />
            {t("askButton")}
          </button>
        </div>
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]"
        aria-label={t("sections")}
      >
        <div className={cn("mx-auto grid max-w-lg", admin ? "grid-cols-7" : "grid-cols-6")}>
          {tabs.map((item) => {
            const active = tab === item.id;
            const Icon = item.icon;
            const labels = {
              hoy: t("tabHoy"),
              biblia: t("tabBiblia"),
              evangelio: t("tabEvangelio"),
              temas: t("tabTemas"),
              personas: t("tabPersonas"),
              guardados: t("tabGuardados"),
              admin: t("tabAdmin"),
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
      <AskDrawer
        open={askOpen}
        onOpenChange={setAskOpen}
        userId={sessionReady ? (userId ?? "") : undefined}
        onSendVerse={openSend}
        onReadVerse={readVerse}
        passage={askPassage}
        onSignIn={() => {
          setAskOpen(false);
          setProfileMode("entrar");
          setProfileOpen(true);
        }}
      />
      <ProfileDrawer
        open={profileOpen}
        welcome={welcome}
        onOpenChange={(next) => {
          setProfileOpen(next);
          if (!next) setWelcome(false);
        }}
        initialMode={profileMode}
      />
    </div>
  );
}
