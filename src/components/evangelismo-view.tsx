import { useEffect, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { VerseCard } from "@/components/verse-card";
import { useI18n } from "@/components/language-switch";
import {
  PREACHER_VERSES,
  gospelPathVerse,
  gospelPrayerVerse,
  gospelStepsWithVerses,
} from "@/lib/evangelism";
import {
  PREACH_CASES,
  caseMessageVerse,
  caseVerses,
  localizedCase,
  type PreachCase,
} from "@/lib/preach-cases";
import {
  DOCTRINE_TOPICS,
  doctrineMessageVerse,
  doctrineVerses,
  localizedDoctrine,
  type DoctrineSide,
  type DoctrineTopic,
} from "@/lib/doctrine";
import { NwtCompare } from "@/components/nwt-compare";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AskError, composeStream } from "@/lib/ask-client";
import { recobroSource } from "@/lib/bible";
import { letterBlocks } from "@/lib/letter-format";
import { prefetchVerses } from "@/lib/recobro";
import { getVerseById, type Verse } from "@/lib/verses";
import { cn } from "@/lib/utils";

type EvangelismoViewProps = {
  onSend: (verse: Verse) => void;
};

type Pane = "camino" | "casos" | "doctrina";

export function EvangelismoView({ onSend }: EvangelismoViewProps) {
  const { t } = useI18n();
  const [pane, setPane] = useState<Pane>("doctrina");
  const [caseId, setCaseId] = useState<string | null>(null);
  const [doctrineId, setDoctrineId] = useState<string | null>(null);
  const selected = PREACH_CASES.find((item) => item.id === caseId);
  const doctrine = DOCTRINE_TOPICS.find((item) => item.id === doctrineId);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
          {t("preachFor")}
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight">{t("evangelism")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("evangelismSub")}</p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <PaneButton
          active={pane === "doctrina"}
          label={t("doctrine")}
          onClick={() => {
            setPane("doctrina");
            setCaseId(null);
          }}
        />
        <PaneButton
          active={pane === "casos"}
          label={t("cases")}
          onClick={() => {
            setPane("casos");
            setDoctrineId(null);
          }}
        />
        <PaneButton
          active={pane === "camino"}
          label={t("theWay")}
          onClick={() => {
            setPane("camino");
            setCaseId(null);
            setDoctrineId(null);
          }}
        />
      </div>

      {pane === "doctrina" ? (
        doctrine ? (
          <DoctrineDetail entry={doctrine} onBack={() => setDoctrineId(null)} onSend={onSend} />
        ) : (
          <DoctrineList onOpen={setDoctrineId} />
        )
      ) : pane === "casos" ? (
        selected ? (
          <CaseDetail entry={selected} onBack={() => setCaseId(null)} onSend={onSend} />
        ) : (
          <CasesList onOpen={setCaseId} />
        )
      ) : (
        <CaminoPane onSend={onSend} />
      )}
    </div>
  );
}

function PaneButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-full border px-2 text-sm font-medium transition-colors duration-150",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-secondary",
      )}
    >
      {label}
    </button>
  );
}

function CasesList({ onOpen }: { onOpen: (id: string) => void }) {
  const { locale, t } = useI18n();
  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{t("casesIntro")}</p>
      <div className="overflow-hidden rounded-xl bg-card shadow-paper">
        {PREACH_CASES.map((item, index) => {
          const copy = localizedCase(item, locale);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item.id)}
              className={cn(
                "flex min-h-14 w-full flex-col items-start justify-center gap-0.5 px-4 py-3 text-left hover:bg-secondary/80",
                index !== 0 && "border-t border-border/70",
              )}
            >
              <span className="font-medium">{copy.title}</span>
              <span className="text-sm text-muted-foreground">{copy.who}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DoctrineList({ onOpen }: { onOpen: (id: string) => void }) {
  const { locale, t } = useI18n();
  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{t("doctrineIntro")}</p>
      <div className="overflow-hidden rounded-xl bg-card shadow-paper">
        {DOCTRINE_TOPICS.map((item, index) => {
          const copy = localizedDoctrine(item, locale);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item.id)}
              className={cn(
                "flex min-h-14 w-full flex-col items-start justify-center gap-0.5 px-4 py-3 text-left hover:bg-secondary/80",
                index !== 0 && "border-t border-border/70",
              )}
            >
              <span className="font-medium">{copy.title}</span>
              <span className="text-sm text-muted-foreground">{copy.who}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DoctrineDetail({
  entry,
  onBack,
  onSend,
}: {
  entry: DoctrineTopic;
  onBack: () => void;
  onSend: (verse: Verse) => void;
}) {
  const { locale, t } = useI18n();
  const copy = localizedDoctrine(entry, locale);
  const verses = doctrineVerses(entry, locale);
  const [sending, setSending] = useState(false);
  const mine = copy.sides.find((side) => side.mine);
  const others = copy.sides.filter((side) => !side.mine);

  useEffect(() => {
    prefetchVerses(verses, locale);
  }, [entry.id, locale]);

  async function sendTopic() {
    setSending(true);
    try {
      onSend(await doctrineMessageVerse(entry, locale));
    } catch {
      toast(t("chapterOpenFail"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-11 w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("doctrine")}
      </button>
      <header>
        <h2 className="font-serif text-3xl tracking-tight">{copy.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{copy.who}</p>
        <p className="mt-3 font-serif text-xl leading-snug">{copy.issue}</p>
      </header>
      {mine ? <SideCard side={mine} featured letter={copy.letter} t={t} /> : null}
      {others.length > 0 ? (
        <section className="flex flex-col gap-3">
          <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
            {t("otherTeachings")}
          </p>
          {others.map((side) => (
            <SideCard key={side.name} side={side} t={t} />
          ))}
        </section>
      ) : null}
      <Button size="lg" disabled={sending} onClick={() => void sendTopic()}>
        <Send />
        {sending ? t("wait") : t("sendThisMessage")}
      </Button>
      <section className="flex flex-col gap-3">
        <h3 className="font-serif text-2xl tracking-tight">{t("versesLabel")}</h3>
        {verses.map((verse) => (
          <VerseCard key={verse.id} verse={verse} onSend={onSend} />
        ))}
      </section>
    </div>
  );
}

/** The topic's letter, laid out to read on screen: headings, quotations, paragraphs. */
function LetterBody({ text }: { text: string }) {
  const blocks = letterBlocks(text);
  if (blocks.length === 0) return null;
  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex flex-col gap-3">
        {blocks.map((block, index) => {
          if (block.kind === "heading") {
            return (
              <h3
                key={index}
                className={
                  index === 0
                    ? "font-serif text-xl tracking-tight"
                    : "mt-3 font-serif text-lg leading-snug"
                }
              >
                {block.text}
              </h3>
            );
          }
          if (block.kind === "quote") {
            return (
              <blockquote key={index} className="border-l-2 border-primary/40 pl-3">
                <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
                  {block.ref}
                </p>
                <p className="mt-1 font-serif text-base leading-relaxed whitespace-pre-line">
                  {block.lines.join("\n")}
                </p>
              </blockquote>
            );
          }
          return (
            <p key={index} className="text-sm leading-relaxed whitespace-pre-line">
              {block.lines.join("\n")}
            </p>
          );
        })}
      </div>
    </div>
  );
}

function SideCard({
  side,
  featured,
  letter,
  t,
}: {
  side: DoctrineSide;
  featured?: boolean;
  /** The full letter, shown inside the featured card under its summary. */
  letter?: string;
  t: (key: "myTeaching" | "whyThis" | "hasBasis" | "noBasis") => string;
}) {
  return (
    <article className="rounded-xl bg-card px-4 py-4 shadow-paper">
      {featured ? (
        <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
          {t("myTeaching")}
        </p>
      ) : null}
      <h3 className="mt-1 font-serif text-2xl tracking-tight">{side.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{side.line}</p>
      {side.why ? (
        <p className="mt-3 text-sm leading-relaxed">
          <span className="font-medium">{t("whyThis")}: </span>
          {side.why}
        </p>
      ) : null}
      {letter ? <LetterBody text={letter} /> : null}
      {side.sections?.length ? (
        <div className="mt-4 flex flex-col gap-3">
          {side.sections.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
                {section.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-4 grid gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
            {t("hasBasis")}
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {side.biblical.map((item) => (
              <li key={item} className="text-sm leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {t("noBasis")}
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {side.notBiblical.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-muted-foreground">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function CaseDetail({
  entry,
  onBack,
  onSend,
}: {
  entry: PreachCase;
  onBack: () => void;
  onSend: (verse: Verse) => void;
}) {
  const { locale, t } = useI18n();
  const copy = localizedCase(entry, locale);
  const verses = caseVerses(entry, locale);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    prefetchVerses(verses, locale);
  }, [entry.id, locale]);

  async function sendCase() {
    setSending(true);
    try {
      onSend(await caseMessageVerse(entry, locale));
    } catch {
      toast(t("chapterOpenFail"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-11 w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("cases")}
      </button>
      <header>
        <h2 className="font-serif text-3xl tracking-tight">{copy.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{copy.who}</p>
      </header>
      <div className="rounded-xl bg-card px-4 py-4 shadow-paper">
        <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
          {t("howToPreach")}
        </p>
        <p className="mt-2 font-serif text-xl leading-snug">{copy.issue}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.approach}</p>
        <ul className="mt-4 flex flex-col gap-2">
          {copy.points.map((point) => (
            <li key={point} className="text-sm leading-relaxed">
              {point}
            </li>
          ))}
        </ul>
      </div>
      <Button size="lg" disabled={sending} onClick={() => void sendCase()}>
        <Send />
        {sending ? t("wait") : t("sendThisMessage")}
      </Button>
      <CaseComposer entry={copy} onSend={onSend} />
      {entry.id === "testigos" ? <NwtCompare onSend={onSend} /> : null}
      <section className="flex flex-col gap-3">
        <h3 className="font-serif text-2xl tracking-tight">{t("versesLabel")}</h3>
        {verses.map((verse) => (
          <VerseCard key={verse.id} verse={verse} onSend={onSend} />
        ))}
      </section>
    </div>
  );
}

/**
 * A message written for one person on this case: the owner says who the
 * person is, the app writes it in its voice with the case's verses, the
 * owner corrects it and sends it like any other message.
 */
function CaseComposer({ entry, onSend }: { entry: PreachCase; onSend: (verse: Verse) => void }) {
  const { locale, t } = useI18n();
  const { user, isPending } = useCurrentUserState();
  const [details, setDetails] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function write() {
    setBusy(true);
    setNotice(null);
    setDraft("");
    let text = "";
    try {
      const { remaining: left } = await composeStream(
        { caseId: entry.id, details, locale },
        (piece) => {
          text += piece;
          setDraft(text);
        },
      );
      if (!text.trim()) throw new AskError("ask_failed:empty", 502);
      setDraft(text.trim());
      if (left !== null && Number.isFinite(left)) setRemaining(left);
    } catch (error) {
      const key = error instanceof Error ? error.message : "";
      const code = key.startsWith("ask_failed:") ? key.slice("ask_failed:".length) : "";
      setNotice(
        key === "ask_quota"
          ? t("askQuota", { n: 20 })
          : key === "ask_unavailable" || /^deepseek_40[123]$/.test(code)
            ? t("askUnavailable")
            : `${t("askError")}${code ? ` ${t("askErrorCode", { code })}` : ""}`,
      );
    } finally {
      setBusy(false);
    }
  }

  function send() {
    onSend({
      id: `caso-ia-${entry.id}`,
      ref: entry.title,
      book: t("preachFor"),
      text: draft.trim(),
      themes: ["evangelio"],
      source: recobroSource(locale),
    });
  }

  return (
    <section className="rounded-xl bg-card px-4 py-4 shadow-paper">
      <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
        {t("caseAiKicker")}
      </p>
      <h3 className="mt-1 font-serif text-2xl tracking-tight">{t("caseAiTitle")}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("caseAiHint")}</p>
      {!isPending && !user ? (
        <p className="mt-3 rounded-lg border border-border bg-secondary p-3 text-sm">
          {t("caseAiSignIn")}
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <Textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder={t("caseAiPlaceholder")}
            maxLength={400}
            rows={3}
            aria-label={t("caseAiTitle")}
            className="text-base"
          />
          {!draft && !busy ? (
            <Button type="button" onClick={() => void write()} disabled={isPending}>
              {t("caseAiWrite")}
            </Button>
          ) : null}
          {busy ? (
            <div className="rounded-lg border border-border bg-secondary p-3 text-sm leading-relaxed whitespace-pre-line">
              {draft || (
                <span role="status" className="text-muted-foreground">
                  {t("caseAiWriting")}
                </span>
              )}
            </div>
          ) : null}
          {draft && !busy ? (
            <>
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={10}
                aria-label={t("caseAiEdit")}
                className="text-base leading-relaxed"
              />
              <p className="text-xs text-muted-foreground">
                {t("caseAiEdit")}
                {remaining !== null ? ` ${t("askRemaining", { n: remaining })}` : ""}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" size="lg" onClick={send} disabled={!draft.trim()}>
                  <Send />
                  {t("sendThisMessage")}
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={() => void write()}>
                  {t("caseAiAnother")}
                </Button>
              </div>
            </>
          ) : null}
          {notice ? (
            <p role="alert" className="text-sm text-destructive">
              {notice}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function CaminoPane({ onSend }: { onSend: (verse: Verse) => void }) {
  const { locale, t } = useI18n();
  const steps = gospelStepsWithVerses(locale);
  const charge = PREACHER_VERSES.map((id) => getVerseById(id)).filter((verse): verse is Verse =>
    Boolean(verse),
  );
  const [sending, setSending] = useState(false);

  useEffect(() => {
    prefetchVerses([...steps.map((step) => step.verse), ...charge], locale);
  }, [locale]);

  async function sendGospel() {
    setSending(true);
    try {
      onSend(await gospelPathVerse(locale));
    } catch {
      toast(t("chapterOpenFail"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Button size="lg" disabled={sending} onClick={() => void sendGospel()}>
          <Send />
          {sending ? t("wait") : t("sendFullGospel")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => onSend(gospelPrayerVerse(locale))}
        >
          {t("sendPrayer")}
        </Button>
      </div>
      <section className="flex flex-col gap-4">
        <header>
          <h2 className="font-serif text-2xl tracking-tight">{t("theWay")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("theWaySub")}</p>
        </header>
        <ol className="flex flex-col gap-4">
          {steps.map((step) => (
            <li key={step.verseId} className="flex flex-col gap-2">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-2xl text-primary">{step.n}</span>
                <div>
                  <p className="font-medium leading-tight">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.line}</p>
                </div>
              </div>
              <VerseCard verse={step.verse} onSend={onSend} />
            </li>
          ))}
        </ol>
      </section>
      <section className="flex flex-col gap-4">
        <header>
          <h2 className="font-serif text-2xl tracking-tight">{t("forYouPreacher")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("forYouSub")}</p>
        </header>
        <div className="flex flex-col gap-3">
          {charge.map((verse) => (
            <VerseCard key={verse.id} verse={verse} onSend={onSend} />
          ))}
        </div>
      </section>
    </div>
  );
}
