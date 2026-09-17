import { useMemo, useState } from "react";
import { Heart, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerseCard } from "@/components/verse-card";
import { useI18n } from "@/components/language-switch";
import { cn } from "@/lib/utils";
import { kindLabel, messageKinds, type MessageKind } from "@/lib/messages";
import { useAppStore, type SavedMessage, type SendDraft } from "@/lib/store";
import { getVerseById, type Verse } from "@/lib/verses";
import { useHydratedVerse } from "@/components/use-hydrated-verse";

type FilterId = "todos" | "versos" | MessageKind;

type SavedViewProps = {
  onSend: (verse: Verse, draft?: SendDraft) => void;
  onExplore: () => void;
};

export function SavedView({ onSend, onExplore }: SavedViewProps) {
  const { locale, t } = useI18n();
  const [filter, setFilter] = useState<FilterId>("todos");
  const favorites = useAppStore((s) => s.favorites);
  const favoriteKinds = useAppStore((s) => s.favoriteKinds);
  const setFavoriteKind = useAppStore((s) => s.setFavoriteKind);
  const savedMessages = useAppStore((s) => s.savedMessages);
  const removeMessage = useAppStore((s) => s.removeMessage);
  const verseMemory = useAppStore((s) => s.verseMemory);
  const kinds = messageKinds(locale);

  const filters: { id: FilterId; label: string }[] = [
    { id: "todos", label: t("all") },
    { id: "versos", label: t("verses") },
    ...kinds,
  ];

  const savedVerses = favorites
    .map((id) => getVerseById(id) ?? verseMemory[id])
    .filter((verse): verse is Verse => Boolean(verse));

  const messages = useMemo(() => {
    return savedMessages
      .map((item) => {
        const verse = getVerseById(item.verseId) ?? verseMemory[item.verseId];
        return verse ? { item, verse } : null;
      })
      .filter((entry): entry is { item: SavedMessage; verse: Verse } => Boolean(entry));
  }, [savedMessages, verseMemory]);

  const visibleMessages = messages.filter((entry) => {
    if (filter === "todos") return true;
    if (filter === "versos") return false;
    return entry.item.kind === filter;
  });

  const visibleVerses = savedVerses.filter((verse) => {
    if (filter === "todos") return true;
    if (filter === "versos") return true;
    return favoriteKinds[verse.id] === filter;
  });

  const empty =
    (filter === "versos" ? visibleVerses.length === 0 : false) ||
    (filter !== "versos" &&
      visibleMessages.length === 0 &&
      visibleVerses.length === 0);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl tracking-tight">{t("savedTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("savedSub")}</p>
      </header>

      <div className="-mx-5 overflow-x-auto px-5">
        <div className="flex w-max gap-2 pb-1">
          {filters.map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  "h-11 shrink-0 rounded-full border px-3 text-sm font-medium transition-colors duration-150",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-secondary",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {empty ? (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-card px-6 py-10 text-center shadow-paper">
          <Heart className="size-6 text-primary" />
          <p className="font-serif text-xl">{t("emptySaved")}</p>
          <p className="max-w-xs text-sm text-muted-foreground">{t("emptySavedLine")}</p>
          <Button type="button" onClick={onExplore}>
            {t("seeThemes")}
          </Button>
        </div>
      ) : null}

      {filter !== "versos" && visibleMessages.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-2xl tracking-tight">{t("messages")}</h2>
          {visibleMessages.map(({ item, verse }) => (
            <SavedMessageCard
              key={item.id}
              item={item}
              verse={verse}
              onSend={onSend}
              onRemove={removeMessage}
            />
          ))}
        </section>
      ) : null}

      {visibleVerses.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-2xl tracking-tight">
            {filter === "versos" || filter === "todos"
              ? t("favoriteVerses")
              : t("versesLabel")}
          </h2>
          {visibleVerses.map((verse) => (
            <div key={verse.id} className="flex flex-col gap-2">
              <KindPicker
                value={favoriteKinds[verse.id]}
                onChange={(kind) => setFavoriteKind(verse.id, kind)}
              />
              <VerseCard verse={verse} onSend={onSend} />
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function SavedMessageCard({
  item,
  verse,
  onSend,
  onRemove,
}: {
  item: SavedMessage;
  verse: Verse;
  onSend: (verse: Verse, draft?: SendDraft) => void;
  onRemove: (id: string) => void;
}) {
  const { locale, t } = useI18n();
  const { verse: shown, loading, error } = useHydratedVerse(verse, item.messageLocale ?? locale);
  return (
    <article className="rounded-lg bg-card px-4 py-4 shadow-paper">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-[0.12em] text-primary uppercase">
          {kindLabel(item.kind, locale)}
        </p>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label={t("removeMessage")}
          onClick={() => onRemove(item.id)}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      {item.note ? (
        <p className="text-sm leading-relaxed text-foreground">{item.note}</p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("couldNotRead")}</p>
      ) : loading || !shown ? (
        <p className="mt-3 font-serif text-lg leading-snug text-muted-foreground">
          {t("loadingVerse")}
        </p>
      ) : (
        <>
          <p className="mt-3 font-serif text-lg leading-snug text-foreground">
            {shown.text}
          </p>
          <p className="mt-2 text-xs font-medium tracking-[0.12em] text-primary uppercase">
            {shown.ref}
          </p>
        </>
      )}
      <Button
        className="mt-4 w-full"
        disabled={!shown}
        onClick={() =>
          shown && onSend(shown, { note: item.note, kind: item.kind, messageLocale: item.messageLocale })
        }
      >
        <Send />
        {t("sendAgain")}
      </Button>
    </article>
  );
}

function KindPicker({
  value,
  onChange,
}: {
  value?: MessageKind;
  onChange: (kind: MessageKind) => void;
}) {
  const { locale, t } = useI18n();
  const kinds = messageKinds(locale);
  return (
    <div className="-mx-1 overflow-x-auto px-1" aria-label={t("organizeBy")}>
      <div className="flex w-max gap-1.5">
        {kinds.map((item) => {
          const active = value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                "h-11 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors duration-150",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
