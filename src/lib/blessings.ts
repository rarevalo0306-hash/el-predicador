export type DailyBlessing = {
  text: string;
  /** One of the prepared blessings, shown because today's could not be written. */
  fallback?: boolean;
};

/**
 * Prepared blessings, used when DeepSeek is not set up or today's could not
 * be written. One a day, the same for everyone, so a person sees a
 * different one each day.
 */
export const BLESSINGS: Record<"es" | "en", string[]> = {
  es: [
    "Que el Señor te bendiga y te guarde hoy.",
    "Que el Señor haga resplandecer Su rostro sobre ti y tenga de ti misericordia.",
    "Que la paz de Cristo gobierne tu corazón en este día.",
    "Que la gracia del Señor Jesús esté contigo en cada paso de hoy.",
    "Que el Señor sea tu fortaleza y tu canción en este día.",
    "Que Dios llene hoy tu corazón de gozo y de paz al creer.",
    "Que el Señor te sostenga con Su mano y te dé descanso.",
    "Que Cristo viva en ti y sea tu vida en todo lo que hoy hagas.",
    "Que el amor de Dios te rodee hoy, en casa y en el camino.",
    "Que el Señor guarde tu salida y tu entrada desde ahora y para siempre.",
    "Que el Dios de esperanza te llene de toda paz y alegría hoy.",
    "Que el Señor renueve tus fuerzas como las del águila.",
    "Que la Palabra de Dios sea lámpara a tus pies en este día.",
    "Que el Señor te dé Su paz, la que sobrepasa todo entendimiento.",
    "Que hoy sientas cerca al Señor, que nunca te deja ni te desampara.",
    "Que la misericordia del Señor, nueva cada mañana, te acompañe hoy.",
    "Que el Espíritu del Señor te guíe y te consuele en este día.",
    "Que el Señor bendiga tu casa y a los tuyos hoy.",
    "Que descanses hoy en lo que Cristo ya hizo por ti en la cruz.",
    "Que el Señor te llene de Su gracia para amar y servir hoy.",
    "Que el Buen Pastor te guíe hoy junto a aguas de reposo.",
  ],
  en: [
    "May the Lord bless you and keep you today.",
    "May the Lord make His face shine on you and be gracious to you.",
    "May the peace of Christ rule in your heart this day.",
    "May the grace of the Lord Jesus be with you in every step today.",
    "May the Lord be your strength and your song this day.",
    "May God fill your heart today with all joy and peace in believing.",
    "May the Lord hold you up with His hand and give you rest.",
    "May Christ live in you and be your life in all you do today.",
    "May the love of God surround you today, at home and on the way.",
    "May the Lord keep your going out and your coming in from now on.",
    "May the God of hope fill you with all peace and joy today.",
    "May the Lord renew your strength like the eagle's.",
    "May the Word of God be a lamp to your feet this day.",
    "May the Lord give you His peace, which surpasses all understanding.",
    "May you feel the Lord near today, who never leaves you nor forsakes you.",
    "May the Lord's mercy, new every morning, go with you today.",
    "May the Spirit of the Lord guide and comfort you this day.",
    "May the Lord bless your home and those you love today.",
    "May you rest today in what Christ already did for you on the cross.",
    "May the Lord fill you with His grace to love and serve today.",
    "May the Good Shepherd lead you today beside still waters.",
  ],
};

/** The prepared blessing for a day ("2026-10-01"), the same for everyone. */
export function fallbackBlessing(day: string, locale: "es" | "en"): DailyBlessing {
  const list = BLESSINGS[locale];
  let hash = 0;
  for (const char of day) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return { text: list[hash % list.length]!, fallback: true };
}

/** The first name to greet with: letters only, else "" (then no greeting). */
export function greetingName(name: string | null | undefined): string {
  const word = (name ?? "").trim().split(/\s+/)[0] ?? "";
  return /^[\p{L}'-]{2,30}$/u.test(word) ? word : "";
}
