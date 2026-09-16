import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/language-switch";
import {
  NVI_ROWS,
  localizedNvi,
  nviDigestVerse,
  nviRowVerse,
  nviSystem,
} from "@/lib/nvi-compare";
import type { Verse } from "@/lib/verses";

type NviCompareProps = {
  onSend: (verse: Verse) => void;
};

export function NviCompare({ onSend }: NviCompareProps) {
  const { locale, t } = useI18n();
  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-xl bg-card px-4 py-4 shadow-paper">
        <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
          {t("howWritten")}
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          {nviSystem(locale).map((line) => (
            <li key={line} className="text-sm leading-relaxed">
              {line}
            </li>
          ))}
        </ul>
      </div>
      <Button
        size="lg"
        variant="secondary"
        onClick={() => onSend(nviDigestVerse(locale))}
      >
        <Send />
        {t("sendAllComparisons")}
      </Button>
      <div className="flex flex-col gap-3">
        {NVI_ROWS.map((item) => {
          const row = localizedNvi(item, locale);
          return (
            <article key={item.id} className="rounded-xl bg-card px-4 py-4 shadow-paper">
              <p className="text-xs font-medium tracking-[0.12em] text-primary uppercase">
                {row.language}
              </p>
              <h4 className="mt-1 font-serif text-2xl tracking-tight">{row.ref}</h4>
              <p className="mt-3 font-serif text-xl leading-snug">{row.original}</p>
              <p className="mt-1 text-sm text-muted-foreground">{row.spoken}</p>
              <Row label={t("conveys")} text={row.meaning} />
              <Row label={t("sourceRecobro")} text={row.recobro} />
              <Row label={t("sourceNvi")} text={row.nvi} />
              <Row label={t("theDifference")} text={row.difference} />
              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={() => onSend(nviRowVerse(item, locale))}
              >
                <Send />
                {t("sendThisComparison")}
              </Button>
            </article>
          );
        })}
      </div>
      <p className="text-center text-[0.7rem] leading-relaxed text-muted-foreground">
        {t("nviFooter")}
      </p>
    </section>
  );
}

function Row({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-medium tracking-[0.12em] text-primary uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm leading-relaxed">{text}</p>
    </div>
  );
}
