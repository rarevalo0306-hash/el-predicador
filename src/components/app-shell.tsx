import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Ellipsis,
  Layers,
  MessageCircleQuestion,
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
import { MoreSheet } from "@/components/more-sheet";
import { isMoreSection } from "@/lib/more-sections";
import { focusMoreButton, focusProfileButton } from "@/lib/panel-focus";
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

/**
 * The bottom bar: four sections and "Más", which holds Doctrina, Guardados,
 * Admin (for the team only; the server decides who that is, useIsAdmin)
 * and Ajustes.
 */
const BAR_TABS: { id: Exclude<Tab, "evangelio" | "guardados" | "admin">; icon: typeof Sun }[] = [
  { id: "hoy", icon: Sun },
  { id: "biblia", icon: BookOpen },
  { id: "temas", icon: Layers },
  { id: "personas", icon: Users },
];

const BAR_BUTTON =
  "flex h-16 min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-xs font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset";


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
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMode, setProfileMode] = useState<"entrar" | "crear">("entrar");
  // Perfil opened from Ajustes (itself inside Más) gives focus back to Más,
  // which is always on screen, rather than to the header scrolled out of view.
  const profileFromMore = useRef(false);
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

  /** Another section starts at its top, not where the last one was scrolled to. */
  function openTab(next: Tab) {
    if (next !== tab) window.scrollTo({ top: 0 });
    setTab(next);
  }

  function openProfile(mode?: "entrar" | "crear", fromMore = false) {
    if (mode) setProfileMode(mode);
    profileFromMore.current = fromMore;
    setProfileOpen(true);
  }

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
      <header className="flex items-center justify-between gap-2 px-3 pt-5 pb-3 min-[360px]:px-4 sm:gap-3 sm:px-5">
        <Logo fit />
        <div className="flex min-w-0 shrink-0 items-center gap-1">
          <LanguageSwitch compact />
          {/* In the bar, not floating over the page, so it never covers a button. */}
          <button
            type="button"
            onClick={() => setAskOpen(true)}
            aria-label={t("askButton")}
            title={t("askButton")}
            className="inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-transform duration-150 active:scale-95"
          >
            <MessageCircleQuestion className="size-5 shrink-0" aria-hidden />
            {/* Named only where the bar has room: signed in, on a phone.
                Wider screens show the app's name there instead. */}
            <span className={user ? "hidden pr-1 min-[360px]:inline sm:hidden" : "hidden"}>
              {t("askButton")}
            </span>
          </button>
          {isPending ? (
            <span className="inline-flex h-11 w-16 animate-pulse rounded-full bg-secondary" />
          ) : user ? (
            <button
              type="button"
              onClick={() => openProfile()}
              data-profile-trigger
              aria-haspopup="dialog"
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
                onClick={() => openProfile("entrar")}
                data-profile-trigger
                aria-haspopup="dialog"
                className="inline-flex h-11 items-center rounded-full border border-border bg-card px-2.5 text-xs font-medium text-foreground sm:px-3.5 sm:text-sm"
              >
                {t("logIn")}
              </button>
              <button
                type="button"
                onClick={() => openProfile("crear")}
                className="hidden h-11 items-center rounded-full border border-border bg-card px-2.5 text-xs font-medium text-foreground min-[360px]:inline-flex sm:px-3.5 sm:text-sm"
              >
                <span className="sm:hidden">{t("signupShort")}</span>
                <span className="hidden sm:inline">{t("signupLink")}</span>
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 px-5 pt-2 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
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
              openTab("temas");
              setThemeId(null);
            }}
          />
        ) : null}
        {ready && tab === "admin" && admin ? <AdminView /> : null}
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]"
        aria-label={t("sections")}
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {BAR_TABS.map((item) => {
            const active = tab === item.id;
            const Icon = item.icon;
            const labels = {
              hoy: t("tabHoy"),
              biblia: t("tabBiblia"),
              temas: t("tabTemas"),
              personas: t("tabPersonas"),
            } as const;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openTab(item.id)}
                className={cn(BAR_BUTTON, active ? "text-primary" : "text-muted-foreground")}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5" aria-hidden />
                {labels[item.id]}
              </button>
            );
          })}
          {/* Doctrina, Guardados, Admin and Ajustes; lit while one of them is open. */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            data-more-trigger
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            aria-current={isMoreSection(tab) ? "page" : undefined}
            className={cn(
              BAR_BUTTON,
              isMoreSection(tab) || moreOpen ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Ellipsis className="size-5" aria-hidden />
            {t("tabMore")}
          </button>
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
      <MoreSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        current={tab}
        admin={admin}
        onSection={(section) => {
          setMoreOpen(false);
          openTab(section);
        }}
        onSettings={() => {
          setMoreOpen(false);
          setSettingsOpen(true);
        }}
      />
      <SettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onCloseAutoFocus={focusMoreButton}
        onOpenProfile={() => {
          setSettingsOpen(false);
          openProfile("entrar", true);
        }}
        onOpenSignUp={() => {
          setSettingsOpen(false);
          openProfile("crear", true);
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
          openProfile("entrar");
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
        onCloseAutoFocus={(event) =>
          (profileFromMore.current ? focusMoreButton : focusProfileButton)(event)
        }
      />
    </div>
  );
}
