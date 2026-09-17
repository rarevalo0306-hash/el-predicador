import { localizedCase, PREACH_CASES } from "@/lib/preach-cases";
import { DOCTRINE_TOPICS, localizedDoctrine } from "@/lib/doctrine";
import type { Locale } from "@/lib/i18n";
import {
  THEMES,
  getVerseById,
  localizedTheme,
  searchVerses,
  versesForTheme,
  type ThemeId,
  type Verse,
} from "@/lib/verses";

export type TopicReply = {
  title: string;
  body: string;
  verses: Verse[];
  themeId?: ThemeId;
};

type Hint = {
  keys: string[];
  theme?: ThemeId;
  caseId?: string;
};

const HINTS: Hint[] = [
  { keys: ["ansiedad", "angustia", "preocup", "anxiety", "worry", "anxious", "stress"], theme: "paz" },
  { keys: ["miedo", "temor", "fear", "afraid", "scared"], theme: "paz" },
  { keys: ["soledad", "solo", "sola", "lonely", "loneliness"], theme: "consuelo" },
  { keys: ["depres", "triste", "llanto", "sad", "depression", "desanimo"], theme: "consuelo" },
  { keys: ["enfermedad", "enfermo", "dolor", "cancer", "sick", "illness", "pain"], theme: "fortaleza" },
  { keys: ["muerte", "duelo", "luto", "death", "grief", "mourning"], theme: "esperanza" },
  { keys: ["matrimonio", "pareja", "esposo", "esposa", "marriage", "husband", "wife"], theme: "familia" },
  { keys: ["hijos", "familia", "hogar", "children", "family", "parent"], theme: "familia" },
  { keys: ["perdon", "culpa", "ofensa", "forgiveness", "guilt", "forgive"], theme: "perdon" },
  { keys: ["dinero", "trabajo", "pobre", "deuda", "money", "job", "work", "need"], theme: "fortaleza" },
  { keys: ["duda", "incredul", "doubt", "unbelief"], theme: "fe" },
  { keys: ["amor", "love"], theme: "amor" },
  { keys: ["paz", "peace"], theme: "paz" },
  { keys: ["esperanza", "hope"], theme: "esperanza" },
  { keys: ["sabiduria", "decision", "wisdom", "choose"], theme: "sabiduria" },
  { keys: ["gracias", "gratitud", "gratitude", "thankful"], theme: "gratitud" },
  { keys: ["fortaleza", "fuerza", "cansado", "strength", "tired", "weak"], theme: "fortaleza" },
  { keys: ["evangelio", "salvar", "salvacion", "gospel", "salvation", "jesus"], theme: "evangelio" },
  { keys: ["idolo", "santos", "imagen", "idol", "statue"], caseId: "idolatria" },
  { keys: ["brujer", "santeria", "tarot", "hechiz", "occult", "witch"], caseId: "brujeria" },
  { keys: ["ateo", "ateism", "atheist", "atheism"], caseId: "ateismo" },
  { keys: ["alcohol", "borracho", "droga", "vicio", "drunk", "addiction"], caseId: "alcohol" },
  { keys: ["testigo", "watchtower", "jehova"], caseId: "testigos" },
  { keys: ["mormon"], caseId: "mormones" },
  { keys: ["arrebata", "rapture", "pretrib", "postrib"], theme: "esperanza" },
  { keys: ["unicist", "trinit", "triuno", "oneness", "trinity", "identidad", "quien es dios"], theme: "evangelio" },
  { keys: ["bautism", "baptism", "formula"], theme: "evangelio" },
  { keys: ["pierde la salvacion", "once saved", "seguridad", "persevera"], theme: "evangelio" },
  { keys: ["obras", "works", "gracia", "justific"], theme: "fe" },
  { keys: ["lengua", "dones", "tongues", "pentecost", "espiritu", "llenura", "holy spirit"], theme: "evangelio" },
  { keys: ["diezmo", "ofrenda", "tithe", "giving"], theme: "gratitud" },
  { keys: ["mujer", "pastora", "anciana", "women pastor", "complement"], theme: "evangelio" },
];

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueVerses(rows: Verse[]) {
  const seen = new Set<string>();
  const out: Verse[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

function pickHint(query: string) {
  const hay = fold(query);
  return HINTS.find((hint) => hint.keys.some((key) => hay.includes(key)));
}

function pickTheme(query: string): ThemeId | undefined {
  const hay = fold(query);
  const named = THEMES.find(
    (theme) => hay.includes(fold(theme.name)) || hay.includes(fold(theme.id)),
  );
  if (named) return named.id;
  return pickHint(query)?.theme;
}

function compose(query: string, verses: Verse[], locale: Locale, line?: string) {
  const first = verses[0];
  const second = verses[1];
  if (locale === "en") {
    const parts = [
      `About “${query.trim()}”, this is what the Word says.`,
      line,
      first ? `${first.ref}: ${first.text}` : "",
      second ? `Also ${second.ref}.` : "",
    ];
    return parts.filter(Boolean).join("\n\n");
  }
  const parts = [
    `Sobre “${query.trim()}”, esto dice la Palabra.`,
    line,
    first ? `${first.ref}: ${first.text}` : "",
    second ? `También ${second.ref}.` : "",
  ];
  return parts.filter(Boolean).join("\n\n");
}

export function answerTopic(query: string, locale: Locale): TopicReply | null {
  const needle = query.trim();
  if (needle.length < 2) return null;

  const doctrine = DOCTRINE_TOPICS.find((item) => {
    const hay = fold(needle);
    const localized = localizedDoctrine(item, locale);
    return (
      hay.includes(fold(item.title)) ||
      hay.includes(fold(item.id)) ||
      hay.includes(fold(localized.title))
    );
  });
  if (doctrine) {
    const copy = localizedDoctrine(doctrine, locale);
    const verses = uniqueVerses(
      copy.verseIds.map((id) => getVerseById(id)).filter((row): row is Verse => Boolean(row)),
    );
    return {
      title: copy.title,
      body: copy.letter,
      verses: verses.length ? verses : searchVerses(needle).slice(0, 5),
    };
  }

  const hint = pickHint(needle);
  const preach = hint?.caseId
    ? PREACH_CASES.find((item) => item.id === hint.caseId)
    : PREACH_CASES.find((item) => {
        const hay = fold(needle);
        const localized = localizedCase(item, locale);
        return (
          hay.includes(fold(item.title)) ||
          hay.includes(fold(item.id)) ||
          hay.includes(fold(localized.title)) ||
          item.who.split(/[.,]/).some((bit) => bit.trim().length > 4 && hay.includes(fold(bit)))
        );
      });

  if (preach) {
    const copy = localizedCase(preach, locale);
    const verses = uniqueVerses(
      copy.verseIds.map((id) => getVerseById(id)).filter((row): row is Verse => Boolean(row)),
    );
    return {
      title: copy.title,
      body: copy.letter,
      verses: verses.length ? verses : searchVerses(needle).slice(0, 5),
    };
  }

  const themeId = pickTheme(needle);
  const fromTheme = themeId ? versesForTheme(themeId) : [];
  const fromSearch = searchVerses(needle);
  const verses = uniqueVerses([...fromSearch, ...fromTheme]).slice(0, 5);
  if (verses.length === 0) return null;

  const theme = themeId ? localizedTheme(themeId, locale) : undefined;
  return {
    title: theme?.name ?? needle.trim(),
    body: compose(needle, verses, locale, theme?.line),
    verses,
    themeId,
  };
}
