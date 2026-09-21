import { useEffect, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/language-switch";
import { askPreacher, type AskTurn } from "@/lib/ask";
import { cn } from "@/lib/utils";

type AskDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Undefined until the session is known; empty string when signed out. */
  userId?: string;
  onSignIn: () => void;
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
 * "Pregunta": a conversation with the app about the Word, answered in the
 * same voice as the verse lines. The chat lives on this phone only; the
 * server keeps a daily count per person and nothing else.
 */
export function AskDrawer({ open, onOpenChange, userId, onSignIn }: AskDrawerProps) {
  const { t, locale } = useI18n();
  const [turns, setTurns] = useState<AskTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<"quota" | "unavailable" | "error" | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTurns(loadTurns());
  }, [open]);
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [open, turns.length, busy]);

  async function send() {
    const text = question.trim();
    if (!text || busy) return;
    const history = turns;
    const next = [...turns, { role: "user" as const, content: text }];
    setTurns(next);
    setQuestion("");
    setNotice(null);
    setBusy(true);
    try {
      const reply = await askPreacher({ data: { question: text, history, locale } });
      const done = [...next, { role: "assistant" as const, content: reply.answer }];
      setTurns(done);
      saveTurns(done);
      setRemaining(Math.max(0, reply.limit - reply.used));
    } catch (error) {
      const key = error instanceof Error ? error.message : "";
      setNotice(
        key === "ask_quota" ? "quota" : key === "ask_unavailable" ? "unavailable" : "error",
      );
      // The question stays in the box so it can be sent again.
      setTurns(history);
      setQuestion(text);
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setTurns([]);
    setNotice(null);
    saveTurns([]);
  }

  const signedOut = userId === "";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-serif text-2xl tracking-tight">{t("askTitle")}</DrawerTitle>
          <DrawerDescription>{t("askIntro")}</DrawerDescription>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-2">
          {signedOut ? (
            <div className="space-y-3 rounded-xl border border-border bg-secondary p-4 text-sm">
              <p>{t("askSignIn")}</p>
              <Button type="button" onClick={onSignIn}>
                {t("askSignInButton")}
              </Button>
            </div>
          ) : null}
          {turns.map((turn, index) => (
            <p
              key={index}
              className={cn(
                "max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line",
                turn.role === "user"
                  ? "self-end bg-primary text-primary-foreground"
                  : "self-start border border-border bg-secondary",
              )}
            >
              {turn.content}
            </p>
          ))}
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
            </p>
          ) : null}
          <div ref={endRef} />
        </div>
        {!signedOut ? (
          <form
            className="flex flex-col gap-2 border-t border-border px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
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
                placeholder={t("askPlaceholder")}
                maxLength={500}
                rows={2}
                aria-label={t("askPlaceholder")}
                className="min-h-11 flex-1 resize-none"
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
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                {remaining !== null ? `${t("askRemaining", { n: remaining })} ` : ""}
                {t("askDisclaimer")}
              </span>
              {turns.length ? (
                <button
                  type="button"
                  onClick={clear}
                  className="inline-flex h-9 shrink-0 items-center gap-1 rounded-md px-2 hover:text-foreground"
                >
                  <Trash2 className="size-3.5" />
                  {t("askClear")}
                </button>
              ) : null}
            </div>
          </form>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
