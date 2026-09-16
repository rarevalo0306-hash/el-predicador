import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/language-switch";
import {
  NWT_CHANGES,
  localizedNwt,
  nwtChangeVerse,
  nwtDigestVerse,
  nwtSystem,
} from "@/lib/nwt-changes";
import type { Verse } from "@/lib/verses";

type NwtCompareProps = {
  onSend: (verse: Verse) => void;
};

export function NwtCompare({ onSend }: NwtCompareProps) {
  const { locale, t } = useI18n();
  return (
    <section className="flex flex-col gap-4">
      <header>
        <h3 className="font-serif text-2xl tracking-tight">{t("nwtTitle")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("nwtSub")}</p>
      </header>
      <div className="rounded-xl bg-card px-4 py-4 shadow-paper">
        <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
          {t("howWritten")}
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          {nwtSystem(locale).map((line) => (
            <li key={line} className="text-sm leading-relaxed">
              {line}
            </li>
          ))}
        </ul>
      </div>
      <Button
        size="lg"
        variant="secondary"
        onClick={() => onSend(nwtDigestVerse(locale))}
      >
        <Send />
        {t("sendAllComparisons")}
      </Button>
      <div className="flex flex-col gap-3">
        {NWT_CHANGES.map((item) => {
          const row = localizedNwt(item, locale);
          return (
            <article key={item.id} className="rounded-xl bg-card px-4 py-4 shadow-paper">
              <p className="text-xs font-medium tracking-[0.12em] text-primary uppercase">
                {row.language}
              </p>
              <h4 className="mt-1 font-serif text-2xl tracking-tight">{row.ref}</h4>
              <p className="mt-3 font-serif text-xl leading-snug">{row.original}</p>
              <p className="mt-1 text-sm text-muted-foreground">{row.spoken}</p>
              <Row label={t("conveys")} text={row.meaning} />
              <Row label={t("reinaValera")} text={row.reina} />
              <Row label={t("newWorld")} text={row.nwt} />
              <Row label={t("theChange")} text={row.change} />
              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={() => onSend(nwtChangeVerse(item, locale))}
              >
                <Send />
                {t("sendThisComparison")}
              </Button>
            </article>
          );
        })}
      </div>
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
