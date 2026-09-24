import { useEffect, useRef, useState } from "react";
import { BookOpen, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/language-switch";
import { AskError, askStream, type AskTurn } from "@/lib/ask-client";
import { MarkdownLite } from "@/components/markdown-lite";
import { VerseSheet } from "@/components/verse-sheet";
import type { VerseLink } from "@/lib/verse-links";
import type { Verse } from "@/lib/verses";
import { passageQuestion } from "@/lib/ask-passage";

/** Verses picked in the Bible to ask about; `at` tells two picks apart. */
export type AskPassage = { ref: string; text: string; at: number };
import { cn } from "@/lib/utils";

type AskDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Undefined until the session is known; empty string when signed out. */
  userId?: string;
  onSignIn: () => void;
  /** A verse the answer quoted, to send like any other. */
  onSendVerse?: (verse: Verse) => void;
  /** Open the Bible at a quoted passage. */
  onReadVerse?: (link: VerseLink) => void;
  /** Verses picked in the Bible, asked about with the next question. */
  passage?: AskPassage | null;
};

const STORAGE_KEY = "preacher-ask";

function loadTurns(): AskTurn[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (t): t is AskTurn =>
            (t?.role === "user" || t?.role === "assistant") && typeof t?.content === "string",
        )
      : [];
  } catch {
    return [];
  }
}

function saveTurns(turns: AskTurn[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(turns.slice(-30)));
  } catch {
    /* private mode */
  }
}

/**
 * The part of the screen the visitor can actually see: on a phone the
 * keyboard covers the bottom of the page, and `visualViewport` says how
 * much is left and where it starts. The panel follows it, so the input
 * always sits right above the keyboard and nothing is pushed off screen.
 */
function useVisibleArea(active: boolean) {
  const [area, setArea] = useState<{ top: number; height: number } | null>(null);
  useEffect(() => {
    if (!active) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setArea({ top: vv.offsetTop, height: vv.height });
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [active]);
  return area;
}

/**
 * "Pregunta": a conversation with the app about the Word, answered in the
 * same voice as the verse lines. A full-screen panel rather than a bottom
 * sheet, because a sheet and the iPhone keyboard fight over the space. The
 * chat lives on this phone only; the server keeps a daily count per person
 * and nothing else.
 */
export function AskDrawer({
  open,
  onOpenChange,
  userId,
  onSignIn,
  onSendVerse,
  onReadVerse,
  passage,
}: AskDrawerProps) {
  const { t, locale } = useI18n();
  const [attached, setAttached] = useState<AskPassage | null>(null);
  const [verseLink, setVerseLink] = useState<VerseLink | null>(null);
  const [turns, setTurns] = useState<AskTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<"quota" | "unavailable" | "error" | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const area = useVisibleArea(open);

  useEffect(() => {
    if (open) setTurns(loadTurns());
  }, [open]);

  // While the panel is open the page behind must not scroll: on iPhone a
  // scrolling page under a fixed panel is what drags the panel away.
  useEffect(() => {
    if (!open) return;
    const { documentElement: html, body } = document;
    const previous = { html: html.style.overflow, body: body.style.overflow };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = previous.html;
      body.style.overflow = previous.body;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  // Scroll the list itself, never the page.
  const lastLength = turns[turns.length - 1]?.content.length ?? 0;
  useEffect(() => {
    const list = listRef.current;
    if (open && list) list.scrollTop = list.scrollHeight;
  }, [open, turns.length, lastLength, busy, area?.height]);

  useEffect(() => {
    if (passage) setAttached(passage);
    // A new pick is a new `at`; the same pick must not come back once removed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage?.at]);

  async function send(typed = question) {
    const raw = typed.trim();
    if (!raw || busy) return;
    const about = attached;
    const text = about ? passageQuestion(about.ref, about.text, raw) : raw;
    setAttached(null);
    const history = turns;
    const asked = [...turns, { role: "user" as const, content: text }];
    setTurns(asked);
    setQuestion("");
    setNotice(null);
    setFailure(null);
    setBusy(true);
    let answer = "";
    try {
      const { remaining: left } = await askStream({ question: text, history, locale }, (piece) => {
        // The answer grows on screen as it is written.
        answer += piece;
        setTurns([...asked, { role: "assistant", content: answer }]);
      });
      if (!answer.trim()) throw new AskError("ask_failed:empty", 502);
      saveTurns([...asked, { role: "assistant", content: answer }]);
      if (left !== null && Number.isFinite(left)) setRemaining(left);
    } catch (error) {
      const key = error instanceof Error ? error.message : "";
      const code = key.startsWith("ask_failed:") ? key.slice("ask_failed:".length) : null;
      // A rejected or unpaid key reads as "unavailable"; anything else as a
      // plain failure, with the code shown so the owner can tell what it was.
      const keyProblem =
        code === "deepseek_401" || code === "deepseek_402" || code === "deepseek_403";
      setNotice(
        key === "ask_quota"
          ? "quota"
          : key === "ask_unavailable" || keyProblem
            ? "unavailable"
            : "error",
      );
      setFailure(code ?? (key && key !== "ask_quota" && key !== "ask_unavailable" ? key : null));
      // The question (and its passage) stay so it can be sent again.
      setTurns(history);
      setQuestion(raw);
      setAttached(about);
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setTurns([]);
    setNotice(null);
    setFailure(null);
    setConfirmClear(false);
    saveTurns([]);
  }

  if (!open) return null;
  const signedOut = userId === "";

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label={t("askTitle")}
      className="fixed inset-x-0 z-50 flex flex-col bg-card text-card-foreground"
      style={area ? { top: area.top, height: area.height } : { top: 0, height: "100dvh" }}
    >
      <header className="mx-auto flex w-full max-w-lg shrink-0 items-start justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2">
        <div className="min-w-0">
          <h2 className="font-serif text-2xl tracking-tight">{t("askTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("askIntro")}</p>
        </div>
        <div className="flex shrink-0 items-center">
          {turns.length ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label={t("askClear")}
            >
              <Trash2 className="size-5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label={t("askClose")}
          >
            <X className="size-5" />
          </button>
        </div>
      </header>
      {confirmClear ? (
        <div
          role="alertdialog"
          aria-label={t("askClearConfirm")}
          className="mx-auto flex w-full max-w-lg shrink-0 items-center justify-between gap-3 border-y border-border bg-secondary px-4 py-3 text-sm"
        >
          <span>{t("askClearConfirm")}</span>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmClear(false)}
            >
              {t("askClearNo")}
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={clear}>
              {t("askClearYes")}
            </Button>
          </div>
        </div>
      ) : null}
      <div
        ref={listRef}
        className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 pb-2"
      >
        {signedOut ? (
          <div className="space-y-3 rounded-xl border border-border bg-secondary p-4 text-sm">
            <p>{t("askSignIn")}</p>
            <Button type="button" onClick={onSignIn}>
              {t("askSignInButton")}
            </Button>
          </div>
        ) : null}
        {turns.map((turn, index) =>
          turn.role === "user" ? (
            <p
              key={index}
              className="max-w-[88%] self-end rounded-xl bg-primary px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line text-primary-foreground"
            >
              {turn.content}
            </p>
          ) : (
            <div
              key={index}
              className="max-w-[92%] self-start rounded-xl border border-border bg-secondary px-3.5 py-2.5 text-sm leading-relaxed"
            >
              <MarkdownLite text={turn.content} onVerse={setVerseLink} />
            </div>
          ),
        )}
        {busy ? (
          <p role="status" className="self-start text-sm text-muted-foreground">
            {t("askThinking")}
          </p>
        ) : null}
        {notice ? (
          <p role="alert" className="text-sm text-destructive">
            {notice === "quota"
              ? t("askQuota", { n: 20 })
              : notice === "unavailable"
                ? t("askUnavailable")
                : t("askError")}
            {failure ? (
              <span className="mt-1 block text-xs text-muted-foreground">
                {t("askErrorCode", { code: failure })}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
      {!signedOut ? (
        <form
          className={cn(
            "mx-auto flex w-full max-w-lg shrink-0 flex-col gap-2 border-t border-border px-4 pt-3",
            // With the keyboard up the safe area is under it; keep the bottom tight then.
            area && area.height < window.innerHeight - 100
              ? "pb-3"
              : "pb-[calc(env(safe-area-inset-bottom)+0.75rem)]",
          )}
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          {attached ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-secondary px-3 py-2">
                <BookOpen className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-primary">
                    {t("askAbout", { ref: attached.ref })}
                  </p>
                  <p className="line-clamp-2 font-serif text-sm leading-snug">{attached.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAttached(null)}
                  className="-mt-1 -mr-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                  aria-label={t("askAboutRemove")}
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["askSuggestExplain", "askSuggestApply", "askSuggestContext"] as const).map(
                  (key) => (
                    <button
                      key={key}
                      type="button"
                      disabled={busy}
                      onClick={() => void send(t(key))}
                      className="inline-flex min-h-9 items-center rounded-full border border-border bg-background px-3 text-sm font-medium transition-transform duration-150 active:scale-95 disabled:opacity-50"
                    >
                      {t(key)}
                    </button>
                  ),
                )}
              </div>
            </div>
          ) : null}
          <div className="flex items-end gap-2">
            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              placeholder={attached ? t("askPassagePlaceholder") : t("askPlaceholder")}
              maxLength={500}
              rows={2}
              aria-label={t("askPlaceholder")}
              className="min-h-11 flex-1 resize-none text-base"
            />
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 shrink-0"
              disabled={busy || !question.trim()}
              aria-label={t("askSend")}
            >
              <Send />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {remaining !== null ? `${t("askRemaining", { n: remaining })} ` : ""}
            {t("askDisclaimer")}
          </p>
        </form>
      ) : null}
      <VerseSheet
        link={verseLink}
        onClose={() => setVerseLink(null)}
        onSend={
          onSendVerse
            ? (verse) => {
                setVerseLink(null);
                onSendVerse(verse);
              }
            : undefined
        }
        onRead={
          onReadVerse
            ? (link) => {
                setVerseLink(null);
                onReadVerse(link);
              }
            : undefined
        }
      />
    </section>
  );
}
