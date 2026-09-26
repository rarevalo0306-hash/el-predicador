import type { Locale } from "@/lib/i18n";

export type Testament = "at" | "nt";

export type BibleVersion = "recovery" | "lbla" | "nasb20";

export type BibleVersionPreferences = {
  es: "recovery" | "lbla";
  en: "recovery" | "nasb20";
};

export type BibleVersionChoice = {
  id: BibleVersion;
  label: string;
  shortLabel: string;
};

export type BibleBook = {
  id: string;
  name: string;
  abbr: string;
  testament: Testament;
  chapters: number;
  num: string;
  file: string;
  aliases: string[];
};

export const RECOBRO_ORIGIN = "https://texto.versionrecobro.org";
export const RECOVERY_ORIGIN = "https://text.recoveryversion.bible";
export const SOURCE_RECOBRO = "Versión Recobro";
export const SOURCE_RECOBRO_EN = "Recovery Version";
export const RECOBRO_COPYRIGHT =
  "Santa Biblia Versión Recobro © Living Stream Ministry";
export const RECOBRO_COPYRIGHT_EN =
  "Holy Bible Recovery Version © Living Stream Ministry";

/**
 * LBLA and NASB 2020 (API.Bible) until Living Stream Ministry's official
 * access (LSM_APPID, LSM_TOKEN) is set up; Recobro shows as "Próximamente".
 */
export const DEFAULT_BIBLE_VERSIONS: BibleVersionPreferences = {
  es: "lbla",
  en: "nasb20",
};

const SPANISH_BIBLE_VERSIONS: BibleVersionChoice[] = [
  { id: "recovery", label: "Santa Biblia Versión Recobro", shortLabel: "Recobro" },
  { id: "lbla", label: "La Biblia de las Américas", shortLabel: "LBLA" },
];

const ENGLISH_BIBLE_VERSIONS: BibleVersionChoice[] = [
  { id: "recovery", label: "Holy Bible Recovery Version", shortLabel: "Recovery" },
  {
    id: "nasb20",
    label: "New American Standard Bible 2020",
    shortLabel: "NASB 2020",
  },
];

export function bibleVersionsFor(locale: Locale): BibleVersionChoice[] {
  return locale === "en" ? ENGLISH_BIBLE_VERSIONS : SPANISH_BIBLE_VERSIONS;
}

export function isBibleVersionForLocale(
  value: unknown,
  locale: Locale,
): value is BibleVersion {
  return bibleVersionsFor(locale).some((item) => item.id === value);
}

export function normalizeBibleVersion(value: unknown, locale: Locale): BibleVersion {
  return isBibleVersionForLocale(value, locale) ? value : DEFAULT_BIBLE_VERSIONS[locale];
}

export function bibleSource(version: BibleVersion, locale: Locale): string {
  // Also the line under shared verses, so it names the publisher.
  if (version === "lbla") return "La Biblia de las Américas (LBLA) © The Lockman Foundation";
  if (version === "nasb20") return "New American Standard Bible (NASB 2020) © The Lockman Foundation";
  return recobroSource(locale);
}

export function bibleVerseId(
  version: BibleVersion,
  bookId: string,
  chapter: number,
  verse: number,
  locale: Locale,
) {
  if (version === "recovery") return recobroVerseId(bookId, chapter, verse, locale);
  return `${version}-${bookId}-${chapter}-${verse}`;
}

export const BIBLE_BOOKS: BibleBook[] = [
  book("gen", "Génesis", "Gn", "at", 50, "01", "Genesis", ["genesis", "gn", "gen"]),
  book("exo", "Éxodo", "Éx", "at", 40, "02", "Exodus", ["exodo", "ex", "exo", "exodus"]),
  book("lev", "Levítico", "Lv", "at", 27, "03", "Leviticus", ["levitico", "lv", "lev"]),
  book("num", "Números", "Nm", "at", 36, "04", "Numbers", ["numeros", "nm", "num", "nu"]),
  book("deu", "Deuteronomio", "Dt", "at", 34, "05", "Deuteronomy", ["deuteronomio", "dt", "deu", "deut"]),
  book("jos", "Josué", "Jos", "at", 24, "06", "Joshua", ["josue", "jos", "joshua"]),
  book("jdg", "Jueces", "Jue", "at", 21, "07", "Judges", ["jueces", "jue", "jdg", "judg"]),
  book("rut", "Rut", "Rt", "at", 4, "08", "Ruth", ["rut", "rt", "ruth"]),
  book("1sa", "1 Samuel", "1 S", "at", 31, "09", "1Samuel", ["1 samuel", "1samuel", "1s", "1sa", "1 sam"]),
  book("2sa", "2 Samuel", "2 S", "at", 24, "10", "2Samuel", ["2 samuel", "2samuel", "2s", "2sa", "2 sam"]),
  book("1ki", "1 Reyes", "1 R", "at", 22, "11", "1Kings", ["1 reyes", "1reyes", "1r", "1ki", "1 re"]),
  book("2ki", "2 Reyes", "2 R", "at", 25, "12", "2Kings", ["2 reyes", "2reyes", "2r", "2ki", "2 re"]),
  book("1ch", "1 Crónicas", "1 Cr", "at", 29, "13", "1Chronicles", ["1 cronicas", "1cronicas", "1cr", "1ch"]),
  book("2ch", "2 Crónicas", "2 Cr", "at", 36, "14", "2Chronicles", ["2 cronicas", "2cronicas", "2cr", "2ch"]),
  book("ezr", "Esdras", "Esd", "at", 10, "15", "Ezra", ["esdras", "esd", "ezr", "ezra"]),
  book("neh", "Nehemías", "Neh", "at", 13, "16", "Nehemiah", ["nehemias", "neh"]),
  book("est", "Ester", "Est", "at", 10, "17", "Esther", ["ester", "est", "esther"]),
  book("job", "Job", "Job", "at", 42, "18", "Job", ["job"]),
  book("psa", "Salmos", "Sal", "at", 150, "19", "Psalms", ["salmos", "salmo", "sal", "ps", "psalm", "psalms"]),
  book("pro", "Proverbios", "Pr", "at", 31, "20", "Proverbs", ["proverbios", "pr", "prov", "pro"]),
  book("ecc", "Eclesiastés", "Ec", "at", 12, "21", "Ecclesiastes", ["eclesiastes", "ec", "ecl", "ecc"]),
  book("sng", "Cantares", "Cnt", "at", 8, "22", "SongofSongs", ["cantares", "cnt", "cant", "sng", "cantico"]),
  book("isa", "Isaías", "Is", "at", 66, "23", "Isaiah", ["isaias", "is", "isa"]),
  book("jer", "Jeremías", "Jer", "at", 52, "24", "Jeremiah", ["jeremias", "jer"]),
  book("lam", "Lamentaciones", "Lm", "at", 5, "25", "Lamentations", ["lamentaciones", "lm", "lam"]),
  book("ezk", "Ezequiel", "Ez", "at", 48, "26", "Ezekiel", ["ezequiel", "ez", "eze", "ezk"]),
  book("dan", "Daniel", "Dn", "at", 12, "27", "Daniel", ["daniel", "dn", "dan"]),
  book("hos", "Oseas", "Os", "at", 14, "28", "Hosea", ["oseas", "os", "hos"]),
  book("jol", "Joel", "Jl", "at", 3, "29", "Joel", ["joel", "jl", "jol"]),
  book("amo", "Amós", "Am", "at", 9, "30", "Amos", ["amos", "am", "amo"]),
  book("oba", "Abdías", "Abd", "at", 1, "31", "Obadiah", ["abdias", "abd", "oba", "ob"]),
  book("jon", "Jonás", "Jon", "at", 4, "32", "Jonah", ["jonas", "jon", "jnh"]),
  book("mic", "Miqueas", "Mi", "at", 7, "33", "Micah", ["miqueas", "mi", "mic"]),
  book("nah", "Nahúm", "Nah", "at", 3, "34", "Nahum", ["nahum", "nah"]),
  book("hab", "Habacuc", "Hab", "at", 3, "35", "Habakkuk", ["habacuc", "hab"]),
  book("zep", "Sofonías", "Sof", "at", 3, "36", "Zephaniah", ["sofonias", "sof", "zep"]),
  book("hag", "Hageo", "Hag", "at", 2, "37", "Haggai", ["hageo", "hag", "hg"]),
  book("zec", "Zacarías", "Zac", "at", 14, "38", "Zechariah", ["zacarias", "zac", "zec", "zc"]),
  book("mal", "Malaquías", "Mal", "at", 4, "39", "Malachi", ["malaquias", "mal"]),
  book("mat", "Mateo", "Mt", "nt", 28, "40", "Matthew", ["mateo", "mt", "mat", "matt"]),
  book("mrk", "Marcos", "Mr", "nt", 16, "41", "Mark", ["marcos", "mr", "mc", "mk", "mark"]),
  book("luk", "Lucas", "Lc", "nt", 24, "42", "Luke", ["lucas", "lc", "lk", "luke"]),
  book("jhn", "Juan", "Jn", "nt", 21, "43", "John", ["juan", "jn", "jhn", "john"]),
  book("act", "Hechos", "Hch", "nt", 28, "44", "Acts", ["hechos", "hch", "act", "acts"]),
  book("rom", "Romanos", "Ro", "nt", 16, "45", "Romans", ["romanos", "ro", "rm", "rom"]),
  book("1co", "1 Corintios", "1 Co", "nt", 16, "46", "1Corinthians", ["1 corintios", "1corintios", "1co", "1 cor"]),
  book("2co", "2 Corintios", "2 Co", "nt", 13, "47", "2Corinthians", ["2 corintios", "2corintios", "2co", "2 cor"]),
  book("gal", "Gálatas", "Gá", "nt", 6, "48", "Galatians", ["galatas", "ga", "gal"]),
  book("eph", "Efesios", "Ef", "nt", 6, "49", "Ephesians", ["efesios", "ef", "eph"]),
  book("php", "Filipenses", "Fil", "nt", 4, "50", "Philippians", ["filipenses", "fil", "php", "flp"]),
  book("col", "Colosenses", "Col", "nt", 4, "51", "Colossians", ["colosenses", "col"]),
  book("1th", "1 Tesalonicenses", "1 Ts", "nt", 5, "52", "1Thessalonians", ["1 tesalonicenses", "1tesalonicenses", "1ts", "1th", "1 tes"]),
  book("2th", "2 Tesalonicenses", "2 Ts", "nt", 3, "53", "2Thessalonians", ["2 tesalonicenses", "2tesalonicenses", "2ts", "2th", "2 tes"]),
  book("1ti", "1 Timoteo", "1 Ti", "nt", 6, "54", "1Timothy", ["1 timoteo", "1timoteo", "1ti", "1 tim"]),
  book("2ti", "2 Timoteo", "2 Ti", "nt", 4, "55", "2Timothy", ["2 timoteo", "2timoteo", "2ti", "2 tim"]),
  book("tit", "Tito", "Tit", "nt", 3, "56", "Titus", ["tito", "tit", "titus"]),
  book("phm", "Filemón", "Flm", "nt", 1, "57", "Philemon", ["filemon", "flm", "flmón", "phm", "filem"]),
  book("heb", "Hebreos", "He", "nt", 13, "58", "Hebrews", ["hebreos", "he", "heb"]),
  book("jas", "Jacobo", "Jac", "nt", 5, "59", "James", ["jacobo", "jac", "santiago", "stg", "stgo", "james", "ja"]),
  book("1pe", "1 Pedro", "1 P", "nt", 5, "60", "1Peter", ["1 pedro", "1pedro", "1p", "1pe", "1 pet"]),
  book("2pe", "2 Pedro", "2 P", "nt", 3, "61", "2Peter", ["2 pedro", "2pedro", "2p", "2pe", "2 pet"]),
  book("1jn", "1 Juan", "1 Jn", "nt", 5, "62", "1John", ["1 juan", "1juan", "1jn", "1 jn"]),
  book("2jn", "2 Juan", "2 Jn", "nt", 1, "63", "2John", ["2 juan", "2juan", "2jn", "2 jn"]),
  book("3jn", "3 Juan", "3 Jn", "nt", 1, "64", "3John", ["3 juan", "3juan", "3jn", "3 jn"]),
  book("jud", "Judas", "Jud", "nt", 1, "65", "Jude", ["judas", "jud", "jude"]),
  book("rev", "Apocalipsis", "Ap", "nt", 22, "66", "Revelation", ["apocalipsis", "ap", "apo", "rev", "revelacion"]),
];

function book(
  id: string,
  name: string,
  abbr: string,
  testament: Testament,
  chapters: number,
  num: string,
  file: string,
  aliases: string[],
): BibleBook {
  return { id, name, abbr, testament, chapters, num, file, aliases };
}

export const BOOK_EN: Record<
  string,
  { name: string; abbr: string; query: string }
> = {
  gen: { name: "Genesis", abbr: "Gen", query: "Genesis" },
  exo: { name: "Exodus", abbr: "Ex", query: "Exodus" },
  lev: { name: "Leviticus", abbr: "Lev", query: "Leviticus" },
  num: { name: "Numbers", abbr: "Num", query: "Numbers" },
  deu: { name: "Deuteronomy", abbr: "Deut", query: "Deuteronomy" },
  jos: { name: "Joshua", abbr: "Josh", query: "Joshua" },
  jdg: { name: "Judges", abbr: "Judg", query: "Judges" },
  rut: { name: "Ruth", abbr: "Ruth", query: "Ruth" },
  "1sa": { name: "1 Samuel", abbr: "1 Sam", query: "1 Samuel" },
  "2sa": { name: "2 Samuel", abbr: "2 Sam", query: "2 Samuel" },
  "1ki": { name: "1 Kings", abbr: "1 Kgs", query: "1 Kings" },
  "2ki": { name: "2 Kings", abbr: "2 Kgs", query: "2 Kings" },
  "1ch": { name: "1 Chronicles", abbr: "1 Chr", query: "1 Chronicles" },
  "2ch": { name: "2 Chronicles", abbr: "2 Chr", query: "2 Chronicles" },
  ezr: { name: "Ezra", abbr: "Ezra", query: "Ezra" },
  neh: { name: "Nehemiah", abbr: "Neh", query: "Nehemiah" },
  est: { name: "Esther", abbr: "Esth", query: "Esther" },
  job: { name: "Job", abbr: "Job", query: "Job" },
  psa: { name: "Psalms", abbr: "Ps", query: "Psalms" },
  pro: { name: "Proverbs", abbr: "Prov", query: "Proverbs" },
  ecc: { name: "Ecclesiastes", abbr: "Eccl", query: "Ecclesiastes" },
  sng: { name: "Song of Solomon", abbr: "Song", query: "Song of Solomon" },
  isa: { name: "Isaiah", abbr: "Isa", query: "Isaiah" },
  jer: { name: "Jeremiah", abbr: "Jer", query: "Jeremiah" },
  lam: { name: "Lamentations", abbr: "Lam", query: "Lamentations" },
  ezk: { name: "Ezekiel", abbr: "Ezek", query: "Ezekiel" },
  dan: { name: "Daniel", abbr: "Dan", query: "Daniel" },
  hos: { name: "Hosea", abbr: "Hos", query: "Hosea" },
  jol: { name: "Joel", abbr: "Joel", query: "Joel" },
  amo: { name: "Amos", abbr: "Amos", query: "Amos" },
  oba: { name: "Obadiah", abbr: "Obad", query: "Obadiah" },
  jon: { name: "Jonah", abbr: "Jonah", query: "Jonah" },
  mic: { name: "Micah", abbr: "Mic", query: "Micah" },
  nah: { name: "Nahum", abbr: "Nah", query: "Nahum" },
  hab: { name: "Habakkuk", abbr: "Hab", query: "Habakkuk" },
  zep: { name: "Zephaniah", abbr: "Zeph", query: "Zephaniah" },
  hag: { name: "Haggai", abbr: "Hag", query: "Haggai" },
  zec: { name: "Zechariah", abbr: "Zech", query: "Zechariah" },
  mal: { name: "Malachi", abbr: "Mal", query: "Malachi" },
  mat: { name: "Matthew", abbr: "Matt", query: "Matthew" },
  mrk: { name: "Mark", abbr: "Mark", query: "Mark" },
  luk: { name: "Luke", abbr: "Luke", query: "Luke" },
  jhn: { name: "John", abbr: "John", query: "John" },
  act: { name: "Acts", abbr: "Acts", query: "Acts" },
  rom: { name: "Romans", abbr: "Rom", query: "Romans" },
  "1co": { name: "1 Corinthians", abbr: "1 Cor", query: "1 Corinthians" },
  "2co": { name: "2 Corinthians", abbr: "2 Cor", query: "2 Corinthians" },
  gal: { name: "Galatians", abbr: "Gal", query: "Galatians" },
  eph: { name: "Ephesians", abbr: "Eph", query: "Ephesians" },
  php: { name: "Philippians", abbr: "Phil", query: "Philippians" },
  col: { name: "Colossians", abbr: "Col", query: "Colossians" },
  "1th": { name: "1 Thessalonians", abbr: "1 Thess", query: "1 Thessalonians" },
  "2th": { name: "2 Thessalonians", abbr: "2 Thess", query: "2 Thessalonians" },
  "1ti": { name: "1 Timothy", abbr: "1 Tim", query: "1 Timothy" },
  "2ti": { name: "2 Timothy", abbr: "2 Tim", query: "2 Timothy" },
  tit: { name: "Titus", abbr: "Titus", query: "Titus" },
  phm: { name: "Philemon", abbr: "Phlm", query: "Philemon" },
  heb: { name: "Hebrews", abbr: "Heb", query: "Hebrews" },
  jas: { name: "James", abbr: "Jas", query: "James" },
  "1pe": { name: "1 Peter", abbr: "1 Pet", query: "1 Peter" },
  "2pe": { name: "2 Peter", abbr: "2 Pet", query: "2 Peter" },
  "1jn": { name: "1 John", abbr: "1 John", query: "1 John" },
  "2jn": { name: "2 John", abbr: "2 John", query: "2 John" },
  "3jn": { name: "3 John", abbr: "3 John", query: "3 John" },
  jud: { name: "Jude", abbr: "Jude", query: "Jude" },
  rev: { name: "Revelation", abbr: "Rev", query: "Revelation" },
};

export function bookName(book: BibleBook, locale: Locale = "es") {
  if (locale === "en") return BOOK_EN[book.id]?.name ?? book.name;
  return book.name;
}

export function bookAbbr(book: BibleBook, locale: Locale = "es") {
  if (locale === "en") return BOOK_EN[book.id]?.abbr ?? book.abbr;
  return book.abbr;
}

export function formatPlace(
  book: BibleBook,
  chapter: number,
  verse?: number,
  locale: Locale = "es",
) {
  const name = bookName(book, locale);
  if (verse) return `${name} ${chapter}:${verse}`;
  return `${name} ${chapter}`;
}

export function recobroOrigin(locale: Locale = "es") {
  return locale === "en" ? RECOVERY_ORIGIN : RECOBRO_ORIGIN;
}

export function recobroSource(locale: Locale = "es") {
  return locale === "en" ? SOURCE_RECOBRO_EN : SOURCE_RECOBRO;
}

export function recobroCopyright(locale: Locale = "es") {
  return locale === "en" ? RECOBRO_COPYRIGHT_EN : RECOBRO_COPYRIGHT;
}

export function recobroChapterUrl(
  book: BibleBook,
  chapter: number,
  locale: Locale = "es",
) {
  return `${recobroOrigin(locale)}/${book.num}_${book.file}_${chapter}.htm`;
}

export function recobroVerseId(
  bookId: string,
  chapter: number,
  verse: number,
  locale: Locale = "es",
) {
  return locale === "en"
    ? `rcv-en-${bookId}-${chapter}-${verse}`
    : `rcv-${bookId}-${chapter}-${verse}`;
}

export function bookById(id: string) {
  return BIBLE_BOOKS.find((item) => item.id === id);
}

export function normalizeQuery(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[ªº.]/g, "")
    .replace(/[_/,-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type ParsedRef = {
  book: BibleBook;
  chapter: number;
  verse?: number;
};

/**
 * Puts a typed reference in one shape before it is read: "mateo23:3",
 * "mateo;23;3", "Mt. 23.3", "mateo 23,3" and "mateo 23 3" all become
 * "mateo 23:3", and "1juan3" becomes "1 juan 3".
 */
function tidyReference(query: string) {
  const joined = query.replace(/(\d)\s*[;:.,]\s*(?=\d)/g, "$1:").replace(/;/g, " ");
  return normalizeQuery(joined.replace(/:/g, " : "))
    .replace(/\s*:\s*/g, ":")
    .replace(/(\p{L})(\d)/gu, "$1 $2")
    .replace(/(\d)(\p{L})/gu, "$1 $2");
}

export function parseReference(query: string): ParsedRef | null {
  const raw = tidyReference(query);
  if (!raw) return null;
  const match = raw.match(/^(.+?)\s+(\d+)(?:(?::|\s+)(\d+)(?:\s+\d+)?)?$/);
  if (!match) {
    const only = findBook(raw);
    return only ? { book: only, chapter: 1 } : null;
  }
  const book = findBook(match[1] ?? "");
  if (!book) return null;
  const chapter = Number(match[2]);
  const verse = match[3] ? Number(match[3]) : undefined;
  if (chapter < 1 || chapter > book.chapters) return null;
  if (verse !== undefined && verse < 1) return null;
  return { book, chapter, verse };
}

export function findBook(query: string) {
  const needle = normalizeQuery(query);
  if (!needle) return undefined;
  const exact = BIBLE_BOOKS.find((item) => {
    const en = BOOK_EN[item.id];
    return (
      normalizeQuery(item.name) === needle ||
      normalizeQuery(item.abbr) === needle ||
      item.aliases.includes(needle) ||
      (en &&
        (normalizeQuery(en.name) === needle ||
          normalizeQuery(en.abbr) === needle ||
          normalizeQuery(en.query) === needle))
    );
  });
  if (exact) return exact;
  return BIBLE_BOOKS.find((item) => {
    const en = BOOK_EN[item.id];
    return (
      normalizeQuery(item.name).startsWith(needle) ||
      item.aliases.some((alias) => alias.startsWith(needle)) ||
      Boolean(
        en &&
          (normalizeQuery(en.name).startsWith(needle) ||
            normalizeQuery(en.query).startsWith(needle)),
      )
    );
  });
}

export function filterBooks(query: string) {
  const needle = normalizeQuery(query);
  if (!needle) return BIBLE_BOOKS;
  const parsed = parseReference(query);
  if (parsed) return [parsed.book];
  return BIBLE_BOOKS.filter((item) => {
    const en = BOOK_EN[item.id];
    return (
      normalizeQuery(item.name).includes(needle) ||
      normalizeQuery(item.abbr).includes(needle) ||
      item.aliases.some((alias) => alias.includes(needle)) ||
      Boolean(
        en &&
          (normalizeQuery(en.name).includes(needle) ||
            normalizeQuery(en.abbr).includes(needle) ||
            normalizeQuery(en.query).includes(needle)),
      )
    );
  });
}
