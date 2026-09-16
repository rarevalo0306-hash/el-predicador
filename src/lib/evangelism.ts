import { recobroSource } from "@/lib/bible";
import { t, type Locale } from "@/lib/i18n";
import { hydrateVerses } from "@/lib/recobro";
import { getVerseById, localizeVerse, type Verse } from "@/lib/verses";

export type GospelStep = {
  n: number;
  title: string;
  line: string;
  verseId: string;
};

const GOSPEL_STEP_META: { n: number; verseId: string }[] = [
  { n: 1, verseId: "jn-3-16" },
  { n: 2, verseId: "ro-3-23" },
  { n: 3, verseId: "ro-6-23" },
  { n: 4, verseId: "ro-5-8" },
  { n: 5, verseId: "1co-15-3" },
  { n: 6, verseId: "ro-10-9" },
  { n: 7, verseId: "ro-10-13" },
  { n: 8, verseId: "2co-5-17" },
];

const GOSPEL_COPY: Record<
  Locale,
  { title: string; line: string }[]
> = {
  es: [
    { title: "Dios te ama", line: "El evangelio empieza en el corazón de Dios." },
    { title: "Todos pecamos", line: "Nadie llega a Dios por su propia cuenta." },
    { title: "Hay un precio", line: "El pecado paga con muerte; Dios ofrece vida." },
    { title: "Cristo murió por ti", line: "Él pagó lo que nosotros no podíamos pagar." },
    { title: "Resucitó", line: "La tumba está vacía. El evangelio es un hecho." },
    { title: "Recíbelo por fe", line: "No es por obras. Es confesar y creer." },
    { title: "Llama al Señor", line: "Él oye a todo el que le invoca." },
    { title: "Vida nueva", line: "El que está en Cristo es nueva criatura." },
  ],
  en: [
    { title: "God loves you", line: "The gospel begins in the heart of God." },
    { title: "All have sinned", line: "No one comes to God on their own." },
    { title: "There is a cost", line: "Sin pays with death; God offers life." },
    { title: "Christ died for you", line: "He paid what we could not pay." },
    { title: "He rose", line: "The tomb is empty. The gospel is a fact." },
    { title: "Receive Him by faith", line: "Not by works. Confess and believe." },
    { title: "Call on the Lord", line: "He hears everyone who calls on Him." },
    { title: "New life", line: "Anyone in Christ is a new creature." },
  ],
};

export function gospelSteps(locale: Locale): GospelStep[] {
  return GOSPEL_STEP_META.map((step, index) => ({
    ...step,
    title: GOSPEL_COPY[locale][index]!.title,
    line: GOSPEL_COPY[locale][index]!.line,
  }));
}

export const PREACHER_VERSES = ["mc-16-15", "mt-28-19", "jn-14-6", "hch-16-31"] as const;

export function gospelStepsWithVerses(locale: Locale) {
  return gospelSteps(locale)
    .map((step) => {
      const verse = getVerseById(step.verseId);
      return verse
        ? { ...step, verse: localizeVerse(verse, locale) }
        : null;
    })
    .filter((step): step is GospelStep & { verse: Verse } => Boolean(step));
}

export async function composeGospelText(locale: Locale) {
  const intro =
    locale === "en"
      ? "I want to share the gospel with you, the best news:"
      : "Quiero compartirte el evangelio, la mejor noticia:";
  const close =
    locale === "en"
      ? "If you will, call on the Lord Jesus. He hears you."
      : "Si quieres, llama al Señor Jesús. Él te oye.";
  const steps = gospelSteps(locale);
  const catalog = steps
    .map((step) => getVerseById(step.verseId))
    .filter((verse): verse is Verse => Boolean(verse));
  const hydrated = await hydrateVerses(catalog, locale);
  const byId = new Map(hydrated.map((verse) => [verse.id, verse]));
  const lines = [intro, ""];
  for (const step of steps) {
    const verse = byId.get(step.verseId);
    if (!verse) continue;
    lines.push(`${step.n}. ${step.title}`);
    lines.push(`«${verse.text}»`);
    lines.push(`— ${verse.ref}`);
    lines.push("");
  }
  lines.push(close);
  return lines.join("\n").trim();
}

export async function gospelPathVerse(locale: Locale): Promise<Verse> {
  return {
    id: "evangelio-camino",
    ref: locale === "en" ? "The gospel" : "El evangelio",
    book: t(locale, "kindEvangelio"),
    text: await composeGospelText(locale),
    themes: ["evangelio"],
    source: recobroSource(locale),
  };
}

export function gospelPrayerVerse(locale: Locale): Verse {
  return {
    id: "evangelio-oracion",
    ref:
      locale === "en"
        ? "A prayer to receive Christ"
        : "Oración para recibir a Cristo",
    book: t(locale, "kindEvangelio"),
    text:
      locale === "en"
        ? "Lord Jesus, I confess that I am a sinner. I believe You died for me and rose again. I receive You now as my Savior and my life. Come into me. Thank You for forgiving me. Amen."
        : "Señor Jesús, reconozco que soy pecador. Creo que moriste por mí y resucitaste. Te recibo ahora como mi Salvador y mi vida. Entra en mí. Gracias por perdonarme. Amén.",
    themes: ["evangelio"],
  };
}
