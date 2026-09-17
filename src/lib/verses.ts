import { findBook, recobroSource, SOURCE_RECOBRO, SOURCE_RECOBRO_EN, type BibleBook } from "@/lib/bible";
import { t, type Locale, type StringKey } from "@/lib/i18n";
import { VERSE_EN } from "@/lib/verses-en";

export type ThemeId =
  | "amor"
  | "fe"
  | "esperanza"
  | "paz"
  | "fortaleza"
  | "consuelo"
  | "gratitud"
  | "sabiduria"
  | "familia"
  | "perdon"
  | "evangelio"
  | "jovenes"
  | "matrimonios"
  | "amistad"
  | "oracion";

export type Verse = {
  id: string;
  ref: string;
  book: string;
  text: string;
  themes: ThemeId[];
  source?: string;
};

export const THEMES: {
  id: ThemeId;
  name: string;
  line: string;
}[] = [
  { id: "jovenes", name: "Jóvenes", line: "Fe y propósito en cada etapa" },
  { id: "matrimonios", name: "Matrimonios", line: "Amor, respeto y unidad" },
  { id: "amistad", name: "Amistad", line: "Caminar y crecer juntos" },
  { id: "oracion", name: "Oración", line: "Hablar con Dios cada día" },
  { id: "amor", name: "Amor", line: "El amor que no se acaba" },
  { id: "fe", name: "Fe", line: "Creer cuando no se ve" },
  { id: "esperanza", name: "Esperanza", line: "Una promesa adelante" },
  { id: "paz", name: "Paz", line: "Sosiego en medio del ruido" },
  { id: "fortaleza", name: "Fortaleza", line: "Fuerza para seguir" },
  { id: "consuelo", name: "Consuelo", line: "Cuando el corazón duele" },
  { id: "gratitud", name: "Gratitud", line: "Dar gracias en todo" },
  { id: "sabiduria", name: "Sabiduría", line: "Luz para decidir" },
  { id: "familia", name: "Familia", line: "Hogar y compañía" },
  { id: "perdon", name: "Perdón", line: "Soltar y empezar de nuevo" },
  { id: "evangelio", name: "Evangelio", line: "La buena noticia de Jesús" },
];

export const SOURCE = SOURCE_RECOBRO;
export const SOURCE_EN = SOURCE_RECOBRO_EN;

const THEME_KEYS: Record<ThemeId, { name: StringKey; line: StringKey }> = {
  jovenes: { name: "themeJovenes", line: "themeJovenesLine" },
  matrimonios: { name: "themeMatrimonios", line: "themeMatrimoniosLine" },
  amistad: { name: "themeAmistad", line: "themeAmistadLine" },
  oracion: { name: "themeOracion", line: "themeOracionLine" },
  amor: { name: "themeAmor", line: "themeAmorLine" },
  fe: { name: "themeFe", line: "themeFeLine" },
  esperanza: { name: "themeEsperanza", line: "themeEsperanzaLine" },
  paz: { name: "themePaz", line: "themePazLine" },
  fortaleza: { name: "themeFortaleza", line: "themeFortalezaLine" },
  consuelo: { name: "themeConsuelo", line: "themeConsueloLine" },
  gratitud: { name: "themeGratitud", line: "themeGratitudLine" },
  sabiduria: { name: "themeSabiduria", line: "themeSabiduriaLine" },
  familia: { name: "themeFamilia", line: "themeFamiliaLine" },
  perdon: { name: "themePerdon", line: "themePerdonLine" },
  evangelio: { name: "themeEvangelio", line: "themeEvangelioLine" },
};

export function localizeVerse(verse: Verse, locale: Locale): Verse {
  const source = recobroSource(locale);
  if (isComposedVerse(verse.id) || verse.id.startsWith("rcv-")) {
    return { ...verse, source: verse.source ?? source };
  }
  if (locale !== "en") {
    return { ...verse, source: verse.source ?? source };
  }
  const en = VERSE_EN[verse.id];
  if (!en) return { ...verse, source: verse.source ?? source };
  return {
    ...verse,
    ref: en.ref,
    book: en.book,
    source: verse.source ?? source,
  };
}

export function isComposedVerse(id: string) {
  return (
    id.startsWith("evangelio-") ||
    id.startsWith("caso-") ||
    id.startsWith("doctrina-") ||
    id.startsWith("nwt-") ||
    id.startsWith("nvi-")
  );
}

export type VerseSpan = {
  book: BibleBook;
  chapter: number;
  from: number;
  to: number;
};

export function parseVerseRef(ref: string): VerseSpan | null {
  const match = ref
    .trim()
    .match(/^(.+?)\s+(\d+):(\d+)(?:\s*[-–—]\s*(\d+))?$/);
  if (!match) return null;
  const book = findBook(match[1] ?? "");
  if (!book) return null;
  const chapter = Number(match[2]);
  const from = Number(match[3]);
  const to = match[4] ? Number(match[4]) : from;
  if (
    !Number.isInteger(chapter) ||
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    chapter < 1 ||
    from < 1 ||
    to < from
  ) {
    return null;
  }
  return { book, chapter, from, to };
}

export function catalogSpan(verse: Verse): VerseSpan | null {
  return parseVerseRef(verse.ref) ?? parseVerseRef(getVerseById(verse.id)?.ref ?? "");
}

export function localizedTheme(id: ThemeId, locale: Locale) {
  const keys = THEME_KEYS[id];
  return {
    id,
    name: t(locale, keys.name),
    line: t(locale, keys.line),
  };
}


export const VERSES: Verse[] = [
  { id: "1ti-4-12", ref: "1 Timoteo 4:12", book: "1 Timoteo", text: "", themes: ["jovenes"] },
  { id: "ecl-12-1", ref: "Eclesiastés 12:1", book: "Eclesiastés", text: "", themes: ["jovenes"] },
  { id: "ef-5-25", ref: "Efesios 5:25", book: "Efesios", text: "", themes: ["matrimonios"] },
  { id: "ecl-4-9", ref: "Eclesiastés 4:9-10", book: "Eclesiastés", text: "", themes: ["amistad"] },
  { id: "prv-17-17", ref: "Proverbios 17:17", book: "Proverbios", text: "", themes: ["amistad"] },
  { id: "1ts-5-17", ref: "1 Tesalonicenses 5:17-18", book: "1 Tesalonicenses", text: "", themes: ["oracion"] },
  {
    id: "jn-3-16",
    ref: "Juan 3:16",
    book: "Juan",
    text: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.",
    themes: ["amor", "fe", "esperanza", "evangelio"],
  },
  {
    id: "1co-13-4",
    ref: "1 Corintios 13:4-7",
    book: "1 Corintios",
    text: "El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso, no se envanece; no hace nada indebido, no busca lo suyo, no se irrita, no guarda rencor; no se goza de la injusticia, mas se goza de la verdad. Todo lo sufre, todo lo cree, todo lo espera, todo lo soporta.",
    themes: ["amor", "familia", "matrimonios"],
  },
  {
    id: "1jn-4-7",
    ref: "1 Juan 4:7-8",
    book: "1 Juan",
    text: "Amados, amémonos unos a otros; porque el amor es de Dios. Todo aquel que ama es nacido de Dios, y conoce a Dios. El que no ama, no ha conocido a Dios; porque Dios es amor.",
    themes: ["amor", "amistad"],
  },
  {
    id: "ro-5-8",
    ref: "Romanos 5:8",
    book: "Romanos",
    text: "Mas Dios muestra su amor para con nosotros, en que siendo aún pecadores, Cristo murió por nosotros.",
    themes: ["amor", "perdon", "evangelio"],
  },
  {
    id: "jn-15-13",
    ref: "Juan 15:13",
    book: "Juan",
    text: "Nadie tiene mayor amor que este, que uno ponga su vida por sus amigos.",
    themes: ["amor", "amistad"],
  },
  {
    id: "1co-13-13",
    ref: "1 Corintios 13:13",
    book: "1 Corintios",
    text: "Y ahora permanecen la fe, la esperanza y el amor, estos tres; pero el mayor de ellos es el amor.",
    themes: ["amor", "fe", "esperanza", "matrimonios"],
  },
  {
    id: "ro-8-38",
    ref: "Romanos 8:38-39",
    book: "Romanos",
    text: "Por lo cual estoy seguro de que ni la muerte, ni la vida, ni ángeles, ni principados, ni potestades, ni lo presente, ni lo porvenir, ni lo alto, ni lo profundo, ni ninguna otra cosa creada nos podrá separar del amor de Dios, que es en Cristo Jesús Señor nuestro.",
    themes: ["amor", "esperanza", "consuelo"],
  },
  {
    id: "1jn-4-19",
    ref: "1 Juan 4:19",
    book: "1 Juan",
    text: "Nosotros le amamos a él, porque él nos amó primero.",
    themes: ["amor"],
  },
  {
    id: "heb-11-1",
    ref: "Hebreos 11:1",
    book: "Hebreos",
    text: "Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve.",
    themes: ["fe", "esperanza"],
  },
  {
    id: "2co-5-7",
    ref: "2 Corintios 5:7",
    book: "2 Corintios",
    text: "Porque por fe andamos, no por vista.",
    themes: ["fe"],
  },
  {
    id: "mc-11-24",
    ref: "Marcos 11:24",
    book: "Marcos",
    text: "Por tanto, os digo que todo lo que pidiereis orando, creed que lo recibiréis, y os vendrá.",
    themes: ["fe", "oracion"],
  },
  {
    id: "ro-10-17",
    ref: "Romanos 10:17",
    book: "Romanos",
    text: "Así que la fe es por el oír, y el oír, por la palabra de Dios.",
    themes: ["fe"],
  },
  {
    id: "mt-17-20",
    ref: "Mateo 17:20",
    book: "Mateo",
    text: "Si tuviereis fe como un grano de mostaza, diréis a este monte: Pásate de aquí allá, y se pasará; y nada os será imposible.",
    themes: ["fe", "fortaleza"],
  },
  {
    id: "heb-11-6",
    ref: "Hebreos 11:6",
    book: "Hebreos",
    text: "Pero sin fe es imposible agradar a Dios; porque es necesario que el que se acerca a Dios crea que le hay, y que es galardonador de los que le buscan.",
    themes: ["fe"],
  },
  {
    id: "ef-2-8",
    ref: "Efesios 2:8-9",
    book: "Efesios",
    text: "Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios; no por obras, para que nadie se gloríe.",
    themes: ["fe", "perdon", "evangelio"],
  },
  {
    id: "stgo-1-6",
    ref: "Santiago 1:6",
    book: "Santiago",
    text: "Pero pida con fe, no dudando nada; porque el que duda es semejante a la onda del mar, que es arrastrada por el viento y echada de una parte a otra.",
    themes: ["fe", "oracion"],
  },
  {
    id: "jer-29-11",
    ref: "Jeremías 29:11",
    book: "Jeremías",
    text: "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.",
    themes: ["esperanza", "paz"],
  },
  {
    id: "ro-15-13",
    ref: "Romanos 15:13",
    book: "Romanos",
    text: "Y el Dios de esperanza os llene de todo gozo y paz en el creer, para que abundéis en esperanza por el poder del Espíritu Santo.",
    themes: ["esperanza", "paz"],
  },
  {
    id: "is-40-31",
    ref: "Isaías 40:31",
    book: "Isaías",
    text: "Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán.",
    themes: ["esperanza", "fortaleza"],
  },
  {
    id: "lm-3-22",
    ref: "Lamentaciones 3:22-23",
    book: "Lamentaciones",
    text: "Por la misericordia de Jehová no hemos sido consumidos, porque nunca decayeron sus misericordias. Nuevas son cada mañana; grande es tu fidelidad.",
    themes: ["esperanza", "gratitud", "consuelo"],
  },
  {
    id: "ro-5-3",
    ref: "Romanos 5:3-5",
    book: "Romanos",
    text: "Y no solo esto, sino que también nos gloriamos en las tribulaciones, sabiendo que la tribulación produce paciencia; y la paciencia, prueba; y la prueba, esperanza; y la esperanza no avergüenza; porque el amor de Dios ha sido derramado en nuestros corazones por el Espíritu Santo que nos fue dado.",
    themes: ["esperanza", "fortaleza"],
  },
  {
    id: "sal-42-11",
    ref: "Salmo 42:11",
    book: "Salmos",
    text: "¿Por qué te abates, oh alma mía, y por qué te turbas dentro de mí? Espera en Dios; porque aún he de alabarle, salvación mía y Dios mío.",
    themes: ["esperanza", "consuelo"],
  },
  {
    id: "1pe-1-3",
    ref: "1 Pedro 1:3",
    book: "1 Pedro",
    text: "Bendito el Dios y Padre de nuestro Señor Jesucristo, que según su grande misericordia nos hizo renacer para una esperanza viva, por la resurrección de Jesucristo de los muertos.",
    themes: ["esperanza", "gratitud"],
  },
  {
    id: "jn-14-27",
    ref: "Juan 14:27",
    book: "Juan",
    text: "La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da. No se turbe vuestro corazón, ni tenga miedo.",
    themes: ["paz", "consuelo"],
  },
  {
    id: "fil-4-6",
    ref: "Filipenses 4:6-7",
    book: "Filipenses",
    text: "Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias. Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús.",
    themes: ["paz", "gratitud", "oracion"],
  },
  {
    id: "is-26-3",
    ref: "Isaías 26:3",
    book: "Isaías",
    text: "Tú guardarás en completa paz a aquel cuyo pensamiento en ti persevera; porque en ti ha confiado.",
    themes: ["paz", "fe"],
  },
  {
    id: "mt-11-28",
    ref: "Mateo 11:28",
    book: "Mateo",
    text: "Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.",
    themes: ["paz", "consuelo"],
  },
  {
    id: "sal-46-10",
    ref: "Salmo 46:10",
    book: "Salmos",
    text: "Estad quietos, y conoced que yo soy Dios; seré exaltado entre las naciones; enaltecido seré en la tierra.",
    themes: ["paz"],
  },
  {
    id: "col-3-15",
    ref: "Colosenses 3:15",
    book: "Colosenses",
    text: "Y la paz de Dios gobierne en vuestros corazones, a la que asimismo fuisteis llamados en un solo cuerpo; y sed agradecidos.",
    themes: ["paz", "gratitud"],
  },
  {
    id: "nm-6-24",
    ref: "Números 6:24-26",
    book: "Números",
    text: "Jehová te bendiga, y te guarde; Jehová haga resplandecer su rostro sobre ti, y tenga de ti misericordia; Jehová alce sobre ti su rostro, y ponga en ti paz.",
    themes: ["paz", "familia", "gratitud"],
  },
  {
    id: "jn-16-33",
    ref: "Juan 16:33",
    book: "Juan",
    text: "Estas cosas os he hablado para que en mí tengáis paz. En el mundo tendréis aflicción; pero confiad, yo he vencido al mundo.",
    themes: ["paz", "fortaleza"],
  },
  {
    id: "fil-4-13",
    ref: "Filipenses 4:13",
    book: "Filipenses",
    text: "Todo lo puedo en Cristo que me fortalece.",
    themes: ["fortaleza", "fe", "jovenes"],
  },
  {
    id: "is-41-10",
    ref: "Isaías 41:10",
    book: "Isaías",
    text: "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.",
    themes: ["fortaleza", "consuelo"],
  },
  {
    id: "jos-1-9",
    ref: "Josué 1:9",
    book: "Josué",
    text: "Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.",
    themes: ["fortaleza"],
  },
  {
    id: "2ti-1-7",
    ref: "2 Timoteo 1:7",
    book: "2 Timoteo",
    text: "Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.",
    themes: ["fortaleza", "amor"],
  },
  {
    id: "sal-27-1",
    ref: "Salmo 27:1",
    book: "Salmos",
    text: "Jehová es mi luz y mi salvación; ¿de quién temeré? Jehová es la fortaleza de mi vida; ¿de quién he de atemorizarme?",
    themes: ["fortaleza", "paz"],
  },
  {
    id: "is-40-29",
    ref: "Isaías 40:29",
    book: "Isaías",
    text: "Él da esfuerzo al cansado, y multiplica las fuerzas al que no tiene ningunas.",
    themes: ["fortaleza", "consuelo"],
  },
  {
    id: "ef-6-10",
    ref: "Efesios 6:10",
    book: "Efesios",
    text: "Por lo demás, hermanos míos, fortaleceos en el Señor, y en el poder de su fuerza.",
    themes: ["fortaleza"],
  },
  {
    id: "dt-31-6",
    ref: "Deuteronomio 31:6",
    book: "Deuteronomio",
    text: "Esforzaos y cobrad ánimo; no temáis, ni tengáis miedo de ellos, porque Jehová tu Dios es el que va contigo; no te dejará, ni te desamparará.",
    themes: ["fortaleza", "consuelo"],
  },
  {
    id: "sal-23-1",
    ref: "Salmo 23:1-3",
    book: "Salmos",
    text: "Jehová es mi pastor; nada me faltará. En lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará. Confortará mi alma; me guiará por sendas de justicia por amor de su nombre.",
    themes: ["consuelo", "paz"],
  },
  {
    id: "sal-34-18",
    ref: "Salmo 34:18",
    book: "Salmos",
    text: "Cercano está Jehová a los quebrantados de corazón; y salva a los contritos de espíritu.",
    themes: ["consuelo"],
  },
  {
    id: "mt-5-4",
    ref: "Mateo 5:4",
    book: "Mateo",
    text: "Bienaventurados los que lloran, porque ellos recibirán consolación.",
    themes: ["consuelo"],
  },
  {
    id: "2co-1-3",
    ref: "2 Corintios 1:3-4",
    book: "2 Corintios",
    text: "Bendito sea el Dios y Padre de nuestro Señor Jesucristo, Padre de misericordias y Dios de toda consolación, el cual nos consuela en todas nuestras tribulaciones, para que podamos también nosotros consolar a los que están en cualquier tribulación.",
    themes: ["consuelo", "amor"],
  },
  {
    id: "sal-147-3",
    ref: "Salmo 147:3",
    book: "Salmos",
    text: "Él sana a los quebrantados de corazón, y venda sus heridas.",
    themes: ["consuelo"],
  },
  {
    id: "1pe-5-7",
    ref: "1 Pedro 5:7",
    book: "1 Pedro",
    text: "Echando toda vuestra ansiedad sobre él, porque él tiene cuidado de vosotros.",
    themes: ["consuelo", "paz"],
  },
  {
    id: "is-43-2",
    ref: "Isaías 43:2",
    book: "Isaías",
    text: "Cuando pases por las aguas, yo estaré contigo; y si por los ríos, no te anegarán. Cuando pases por el fuego, no te quemarás, ni la llama arderá en ti.",
    themes: ["consuelo", "fortaleza"],
  },
  {
    id: "ap-21-4",
    ref: "Apocalipsis 21:4",
    book: "Apocalipsis",
    text: "Enjugará Dios toda lágrima de los ojos de ellos; y ya no habrá muerte, ni habrá más llanto, ni clamor, ni dolor; porque las primeras cosas pasaron.",
    themes: ["consuelo", "esperanza"],
  },
  {
    id: "1ts-5-18",
    ref: "1 Tesalonicenses 5:18",
    book: "1 Tesalonicenses",
    text: "Dad gracias en todo, porque esta es la voluntad de Dios para con vosotros en Cristo Jesús.",
    themes: ["gratitud"],
  },
  {
    id: "sal-107-1",
    ref: "Salmo 107:1",
    book: "Salmos",
    text: "Alabad a Jehová, porque él es bueno; porque para siempre es su misericordia.",
    themes: ["gratitud"],
  },
  {
    id: "sal-100-4",
    ref: "Salmo 100:4",
    book: "Salmos",
    text: "Entrad por sus puertas con acción de gracias, por sus atrios con alabanza; alabadle, bendecid su nombre.",
    themes: ["gratitud"],
  },
  {
    id: "col-3-17",
    ref: "Colosenses 3:17",
    book: "Colosenses",
    text: "Y todo lo que hacéis, sea de palabra o de hecho, hacedlo todo en el nombre del Señor Jesús, dando gracias a Dios Padre por medio de él.",
    themes: ["gratitud", "sabiduria"],
  },
  {
    id: "sal-136-1",
    ref: "Salmo 136:1",
    book: "Salmos",
    text: "Alabad a Jehová, porque él es bueno, porque para siempre es su misericordia.",
    themes: ["gratitud"],
  },
  {
    id: "ef-5-20",
    ref: "Efesios 5:20",
    book: "Efesios",
    text: "Dando siempre gracias por todo al Dios y Padre, en el nombre de nuestro Señor Jesucristo.",
    themes: ["gratitud"],
  },
  {
    id: "stgo-1-17",
    ref: "Santiago 1:17",
    book: "Santiago",
    text: "Toda buena dádiva y todo don perfecto desciende de lo alto, del Padre de las luces, en el cual no hay mudanza, ni sombra de variación.",
    themes: ["gratitud", "sabiduria"],
  },
  {
    id: "prv-3-5",
    ref: "Proverbios 3:5-6",
    book: "Proverbios",
    text: "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.",
    themes: ["sabiduria", "fe", "jovenes"],
  },
  {
    id: "stgo-1-5",
    ref: "Santiago 1:5",
    book: "Santiago",
    text: "Y si alguno de vosotros tiene falta de sabiduría, pídala a Dios, el cual da a todos abundantemente y sin reproche, y le será dada.",
    themes: ["sabiduria", "jovenes"],
  },
  {
    id: "prv-9-10",
    ref: "Proverbios 9:10",
    book: "Proverbios",
    text: "El temor de Jehová es el principio de la sabiduría, y el conocimiento del Santísimo es la inteligencia.",
    themes: ["sabiduria"],
  },
  {
    id: "prv-16-9",
    ref: "Proverbios 16:9",
    book: "Proverbios",
    text: "El corazón del hombre piensa su camino; mas Jehová endereza sus pasos.",
    themes: ["sabiduria"],
  },
  {
    id: "sal-119-105",
    ref: "Salmo 119:105",
    book: "Salmos",
    text: "Lámpara es a mis pies tu palabra, y lumbrera a mi camino.",
    themes: ["sabiduria", "fe", "jovenes"],
  },
  {
    id: "col-3-16",
    ref: "Colosenses 3:16",
    book: "Colosenses",
    text: "La palabra de Cristo more en abundancia en vosotros, enseñándoos y exhortándoos unos a otros en toda sabiduría.",
    themes: ["sabiduria"],
  },
  {
    id: "jos-24-15",
    ref: "Josué 24:15",
    book: "Josué",
    text: "Pero yo y mi casa serviremos a Jehová.",
    themes: ["familia", "fe"],
  },
  {
    id: "prv-22-6",
    ref: "Proverbios 22:6",
    book: "Proverbios",
    text: "Instruye al niño en su camino, y aun cuando fuere viejo no se apartará de él.",
    themes: ["familia", "sabiduria"],
  },
  {
    id: "ef-6-1",
    ref: "Efesios 6:1-2",
    book: "Efesios",
    text: "Hijos, obedeced en el Señor a vuestros padres, porque esto es justo. Honra a tu padre y a tu madre, que es el primer mandamiento con promesa.",
    themes: ["familia", "jovenes"],
  },
  {
    id: "sal-127-3",
    ref: "Salmo 127:3",
    book: "Salmos",
    text: "He aquí, herencia de Jehová son los hijos; cosa de estima el fruto del vientre.",
    themes: ["familia"],
  },
  {
    id: "col-3-20",
    ref: "Colosenses 3:20",
    book: "Colosenses",
    text: "Hijos, obedeced a vuestros padres en todo, porque esto agrada al Señor.",
    themes: ["familia"],
  },
  {
    id: "gn-2-24",
    ref: "Génesis 2:24",
    book: "Génesis",
    text: "Por tanto, dejará el hombre a su padre y a su madre, y se unirá a su mujer, y serán una sola carne.",
    themes: ["familia", "amor", "matrimonios"],
  },
  {
    id: "ef-4-32",
    ref: "Efesios 4:32",
    book: "Efesios",
    text: "Antes sed benignos unos con otros, misericordiosos, perdonándoos unos a otros, como Dios también os perdonó a vosotros en Cristo.",
    themes: ["perdon", "amor", "familia", "matrimonios", "amistad"],
  },
  {
    id: "mt-6-14",
    ref: "Mateo 6:14",
    book: "Mateo",
    text: "Porque si perdonáis a los hombres sus ofensas, os perdonará también a vosotros vuestro Padre celestial.",
    themes: ["perdon"],
  },
  {
    id: "col-3-13",
    ref: "Colosenses 3:13",
    book: "Colosenses",
    text: "Soportándoos unos a otros, y perdonándoos unos a otros si alguno tuviere queja contra otro. De la manera que Cristo os perdonó, así también hacedlo vosotros.",
    themes: ["perdon", "familia", "matrimonios", "amistad"],
  },
  {
    id: "1jn-1-9",
    ref: "1 Juan 1:9",
    book: "1 Juan",
    text: "Si confesamos nuestros pecados, él es fiel y justo para perdonar nuestros pecados, y limpiarnos de toda maldad.",
    themes: ["perdon"],
  },
  {
    id: "mt-18-21",
    ref: "Mateo 18:21-22",
    book: "Mateo",
    text: "Entonces se le acercó Pedro y le dijo: Señor, ¿cuántas veces perdonaré a mi hermano que peque contra mí? ¿Hasta siete? Jesús le dijo: No te digo hasta siete, sino aun hasta setenta veces siete.",
    themes: ["perdon"],
  },
  {
    id: "sal-103-12",
    ref: "Salmo 103:12",
    book: "Salmos",
    text: "Cuanto está lejos el oriente del occidente, hizo alejar de nosotros nuestras rebeliones.",
    themes: ["perdon", "consuelo"],
  },
  {
    id: "lc-6-37",
    ref: "Lucas 6:37",
    book: "Lucas",
    text: "No juzguéis, y no seréis juzgados; no condenéis, y no seréis condenados; perdonad, y seréis perdonados.",
    themes: ["perdon"],
  },
  {
    id: "mt-6-33",
    ref: "Mateo 6:33",
    book: "Mateo",
    text: "Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.",
    themes: ["fe", "sabiduria"],
  },
  {
    id: "sal-46-1",
    ref: "Salmo 46:1",
    book: "Salmos",
    text: "Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.",
    themes: ["fortaleza", "consuelo"],
  },
  {
    id: "ro-8-28",
    ref: "Romanos 8:28",
    book: "Romanos",
    text: "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.",
    themes: ["esperanza", "amor", "fe"],
  },
  {
    id: "sal-91-1",
    ref: "Salmo 91:1-2",
    book: "Salmos",
    text: "El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente. Diré yo a Jehová: Esperanza mía, y castillo mío; mi Dios, en quien confiaré.",
    themes: ["paz", "fortaleza", "fe"],
  },
  {
    id: "miq-6-8",
    ref: "Miqueas 6:8",
    book: "Miqueas",
    text: "Oh hombre, él te ha declarado lo que es bueno, y qué pide Jehová de ti: solamente hacer justicia, y amar misericordia, y humillarte ante tu Dios.",
    themes: ["sabiduria"],
  },
  {
    id: "sof-3-17",
    ref: "Sofonías 3:17",
    book: "Sofonías",
    text: "Jehová está en medio de ti, poderoso, él salvará; se gozará sobre ti con alegría, callará de amor, se regocijará sobre ti con cánticos.",
    themes: ["amor", "consuelo"],
  },
  {
    id: "gal-5-22",
    ref: "Gálatas 5:22-23",
    book: "Gálatas",
    text: "Mas el fruto del Espíritu es amor, gozo, paz, paciencia, benignidad, bondad, fe, mansedumbre, templanza; contra tales cosas no hay ley.",
    themes: ["amor", "paz", "fe"],
  },
  {
    id: "ro-3-23",
    ref: "Romanos 3:23",
    book: "Romanos",
    text: "Por cuanto todos pecaron, y están destituidos de la gloria de Dios.",
    themes: ["evangelio", "perdon"],
  },
  {
    id: "ro-6-23",
    ref: "Romanos 6:23",
    book: "Romanos",
    text: "Porque la paga del pecado es muerte, mas la dádiva de Dios es vida eterna en Cristo Jesús Señor nuestro.",
    themes: ["evangelio", "esperanza"],
  },
  {
    id: "ro-10-9",
    ref: "Romanos 10:9-10",
    book: "Romanos",
    text: "Que si confesares con tu boca que Jesús es el Señor, y creyeres en tu corazón que Dios le levantó de los muertos, serás salvo. Porque con el corazón se cree para justicia, pero con la boca se confiesa para salvación.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "ro-10-13",
    ref: "Romanos 10:13",
    book: "Romanos",
    text: "Porque todo aquel que invocare el nombre del Señor, será salvo.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "jn-3-3",
    ref: "Juan 3:3",
    book: "Juan",
    text: "De cierto, de cierto te digo, que el que no naciere de nuevo, no puede ver el reino de Dios.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "jn-1-12",
    ref: "Juan 1:12",
    book: "Juan",
    text: "Mas a todos los que le recibieron, a los que creen en su nombre, les dio potestad de ser hechos hijos de Dios.",
    themes: ["evangelio", "familia"],
  },
  {
    id: "jn-14-6",
    ref: "Juan 14:6",
    book: "Juan",
    text: "Jesús le dijo: Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "2co-5-17",
    ref: "2 Corintios 5:17",
    book: "2 Corintios",
    text: "De modo que si alguno está en Cristo, nueva criatura es; las cosas viejas pasaron; he aquí todas son hechas nuevas.",
    themes: ["evangelio", "esperanza"],
  },
  {
    id: "hch-16-31",
    ref: "Hechos 16:31",
    book: "Hechos",
    text: "Ellos dijeron: Cree en el Señor Jesucristo, y serás salvo, tú y tu casa.",
    themes: ["evangelio", "fe", "familia"],
  },
  {
    id: "1co-15-3",
    ref: "1 Corintios 15:3-4",
    book: "1 Corintios",
    text: "Porque primeramente os he enseñado lo que asimismo recibí: Que Cristo murió por nuestros pecados, conforme a las Escrituras; y que fue sepultado, y que resucitó al tercer día, conforme a las Escrituras.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "mc-16-15",
    ref: "Marcos 16:15",
    book: "Marcos",
    text: "Y les dijo: Id por todo el mundo y predicad el evangelio a toda criatura.",
    themes: ["evangelio"],
  },
  {
    id: "mt-28-19",
    ref: "Mateo 28:19-20",
    book: "Mateo",
    text: "Por tanto, id, y haced discípulos a todas las naciones, bautizándolos en el nombre del Padre, y del Hijo, y del Espíritu Santo; enseñándoles que guarden todas las cosas que os he mandado; y he aquí yo estoy con vosotros todos los días, hasta el fin del mundo. Amén.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "ap-3-20",
    ref: "Apocalipsis 3:20",
    book: "Apocalipsis",
    text: "He aquí, yo estoy a la puerta y llamo; si alguno oye mi voz y abre la puerta, entraré a él, y cenaré con él, y él conmigo.",
    themes: ["evangelio", "consuelo"],
  },
  {
    id: "ex-20-3",
    ref: "Éxodo 20:3-4",
    book: "Éxodo",
    text: "No tendrás dioses ajenos delante de mí. No te harás imagen, ni ninguna semejanza de lo que esté arriba en el cielo, ni abajo en la tierra, ni en las aguas debajo de la tierra.",
    themes: ["evangelio"],
  },
  {
    id: "is-45-5",
    ref: "Isaías 45:5",
    book: "Isaías",
    text: "Yo soy Jehová, y ninguno más hay; no hay Dios fuera de mí. Yo te ceñiré, aunque tú no me has conocido.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "dt-18-10",
    ref: "Deuteronomio 18:10-12",
    book: "Deuteronomio",
    text: "No sea hallado en ti quien haga pasar a su hijo o a su hija por el fuego, ni quien practique adivinación, ni agorero, ni sortílego, ni hechicero, ni encantador, ni adivino, ni mago, ni quien consulte a los muertos. Porque es abominación a Jehová cualquiera que hace estas cosas.",
    themes: ["evangelio"],
  },
  {
    id: "stgo-4-7",
    ref: "Santiago 4:7",
    book: "Santiago",
    text: "Someteos, pues, a Dios; resistid al diablo, y huirá de vosotros.",
    themes: ["evangelio", "fortaleza"],
  },
  {
    id: "sal-14-1",
    ref: "Salmo 14:1",
    book: "Salmos",
    text: "Dice el necio en su corazón: No hay Dios. Se han corrompido, hacen obras abominables; no hay quien haga bien.",
    themes: ["evangelio", "sabiduria"],
  },
  {
    id: "ro-1-20",
    ref: "Romanos 1:20",
    book: "Romanos",
    text: "Porque las cosas invisibles de él, su eterno poder y deidad, se hacen claramente visibles desde la creación del mundo, siendo entendidas por medio de las cosas hechas, de modo que no tienen excusa.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "prv-20-1",
    ref: "Proverbios 20:1",
    book: "Proverbios",
    text: "El vino es escarnecedor, la sidra alborotadora, y cualquiera que por ellos yerra no es sabio.",
    themes: ["evangelio", "sabiduria"],
  },
  {
    id: "ef-5-18",
    ref: "Efesios 5:18",
    book: "Efesios",
    text: "No os embriaguéis con vino, en lo cual hay disolución; antes bien sed llenos del Espíritu.",
    themes: ["evangelio", "paz"],
  },
  {
    id: "1co-6-11",
    ref: "1 Corintios 6:9-11",
    book: "1 Corintios",
    text: "¿No sabéis que los injustos no heredarán el reino de Dios? No erréis; ni los fornicarios, ni los idólatras, ni los adúlteros, ni los afeminados, ni los que se echan con varones, ni los ladrones, ni los avaros, ni los borrachos, ni los maldicientes, ni los estafadores, heredarán el reino de Dios. Y esto erais algunos; mas ya habéis sido lavados, ya habéis sido santificados, ya habéis sido justificados en el nombre del Señor Jesús, y por el Espíritu de nuestro Dios.",
    themes: ["evangelio", "perdon"],
  },
  {
    id: "jn-1-1",
    ref: "Juan 1:1",
    book: "Juan",
    text: "En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "jn-1-3",
    ref: "Juan 1:3",
    book: "Juan",
    text: "Todas las cosas por él fueron hechas, y sin él nada de lo que ha sido hecho, fue hecho.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "jn-8-58",
    ref: "Juan 8:58",
    book: "Juan",
    text: "Jesús les dijo: De cierto, de cierto os digo: Antes que Abraham fuese, yo soy.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "col-2-9",
    ref: "Colosenses 2:9",
    book: "Colosenses",
    text: "Porque en él habita corporalmente toda la plenitud de la Deidad.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "is-43-10",
    ref: "Isaías 43:10",
    book: "Isaías",
    text: "Vosotros sois mis testigos, dice Jehová, y mi siervo que yo escogí, para que me conozcáis y creáis, y entendáis que yo mismo soy; antes de mí no fue formado Dios, ni lo será después de mí.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "gal-1-8",
    ref: "Gálatas 1:8",
    book: "Gálatas",
    text: "Mas si aun nosotros, o un ángel del cielo, os anunciare otro evangelio diferente del que os hemos anunciado, sea anatema.",
    themes: ["evangelio"],
  },
  {
    id: "2ti-4-3",
    ref: "2 Timoteo 4:3-4",
    book: "2 Timoteo",
    text: "Porque vendrá tiempo cuando no sufrirán la sana doctrina, sino que teniendo comezón de oír, se amontonarán maestros conforme a sus propias concupiscencias, y apartarán de la verdad el oído y se volverán a las fábulas.",
    themes: ["evangelio", "sabiduria"],
  },
  {
    id: "2ti-3-16",
    ref: "2 Timoteo 3:16-17",
    book: "2 Timoteo",
    text: "Toda la Escritura es inspirada por Dios, y útil para enseñar, para redargüir, para corregir, para instruir en justicia, a fin de que el hombre de Dios sea perfecto, enteramente preparado para toda buena obra.",
    themes: ["evangelio", "sabiduria"],
  },
  {
    id: "hch-4-12",
    ref: "Hechos 4:12",
    book: "Hechos",
    text: "Y en ningún otro hay salvación; porque no hay otro nombre bajo el cielo, dado a los hombres, en que podamos ser salvos.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "1ti-2-5",
    ref: "1 Timoteo 2:5",
    book: "1 Timoteo",
    text: "Porque hay un solo Dios, y un solo mediador entre Dios y los hombres, Jesucristo hombre.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "mt-4-10",
    ref: "Mateo 4:10",
    book: "Mateo",
    text: "Entonces Jesús le dijo: Vete, Satanás, porque escrito está: Al Señor tu Dios adorarás, y a él solo servirás.",
    themes: ["evangelio"],
  },
  {
    id: "2co-11-4",
    ref: "2 Corintios 11:4",
    book: "2 Corintios",
    text: "Porque si viene alguno predicando a otro Jesús que el que os hemos predicado, o si recibís otro espíritu que el que habéis recibido, u otro evangelio que el que habéis aceptado, bien lo toleráis.",
    themes: ["evangelio"],
  },
  {
    id: "1ts-4-16",
    ref: "1 Tesalonicenses 4:16-17",
    book: "1 Tesalonicenses",
    text: "Porque el Señor mismo con voz de mando, con voz de arcángel, y con trompeta de Dios, descenderá del cielo; y los muertos en Cristo resucitarán primero. Luego nosotros los que vivimos, los que hayamos quedado, seremos arrebatados juntamente con ellos en las nubes para recibir al Señor en el aire, y así estaremos siempre con el Señor.",
    themes: ["esperanza", "evangelio"],
  },
  {
    id: "1co-15-51",
    ref: "1 Corintios 15:51-52",
    book: "1 Corintios",
    text: "He aquí, os digo un misterio: No todos dormiremos; pero todos seremos transformados, en un momento, en un abrir y cerrar de ojos, a la final trompeta; porque se tocará la trompeta, y los muertos serán resucitados incorruptibles, y nosotros seremos transformados.",
    themes: ["esperanza", "evangelio"],
  },
  {
    id: "mt-24-40",
    ref: "Mateo 24:40-42",
    book: "Mateo",
    text: "Entonces estarán dos en el campo; el uno será tomado, y el otro será dejado. Dos mujeres estarán moliendo en un molino; la una será tomada, y la otra será dejada. Velad, pues, porque no sabéis a qué hora ha de venir vuestro Señor.",
    themes: ["esperanza", "evangelio"],
  },
  {
    id: "ap-12-5",
    ref: "Apocalipsis 12:5",
    book: "Apocalipsis",
    text: "Y ella dio a luz un hijo varón, que va a regir a todas las naciones con vara de hierro; y su hijo fue arrebatado para Dios y para su trono.",
    themes: ["esperanza", "evangelio"],
  },
  {
    id: "ap-14-4",
    ref: "Apocalipsis 14:4",
    book: "Apocalipsis",
    text: "Estos son los que no se contaminaron con mujeres, pues son vírgenes. Estos son los que siguen al Cordero por dondequiera que va. Estos fueron redimidos de entre los hombres como primicias para Dios y para el Cordero.",
    themes: ["evangelio"],
  },
  {
    id: "dt-6-4",
    ref: "Deuteronomio 6:4",
    book: "Deuteronomio",
    text: "Oye, Israel: Jehová nuestro Dios, Jehová uno es.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "is-9-6",
    ref: "Isaías 9:6",
    book: "Isaías",
    text: "Porque un niño nos es nacido, hijo nos es dado, y el principado sobre su hombro; y se llamará su nombre Admirable, Consejero, Dios Fuerte, Padre Eterno, Príncipe de Paz.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "jn-10-30",
    ref: "Juan 10:30",
    book: "Juan",
    text: "Yo y el Padre uno somos.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "2co-13-14",
    ref: "2 Corintios 13:14",
    book: "2 Corintios",
    text: "La gracia del Señor Jesucristo, el amor de Dios, y la comunión del Espíritu Santo sean con todos vosotros.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "jn-14-16",
    ref: "Juan 14:16-17",
    book: "Juan",
    text: "Y yo rogaré al Padre, y os dará otro Consolador, para que esté con vosotros para siempre: el Espíritu de verdad, al cual el mundo no puede recibir, porque no le ve, ni le conoce; pero vosotros le conocéis, porque mora con vosotros, y estará en vosotros.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "mt-3-16",
    ref: "Mateo 3:16-17",
    book: "Mateo",
    text: "Y Jesús, después que fue bautizado, subió luego del agua; y he aquí los cielos le fueron abiertos, y vio al Espíritu de Dios que descendía como paloma, y venía sobre él. Y hubo una voz de los cielos, que decía: Este es mi Hijo amado, en quien tengo complacencia.",
    themes: ["evangelio"],
  },
  {
    id: "hch-2-38",
    ref: "Hechos 2:38",
    book: "Hechos",
    text: "Pedro les dijo: Arrepentíos, y bautícese cada uno de vosotros en el nombre de Jesucristo para perdón de los pecados; y recibiréis el don del Espíritu Santo.",
    themes: ["evangelio", "perdon"],
  },
  {
    id: "hch-8-16",
    ref: "Hechos 8:16",
    book: "Hechos",
    text: "Porque aún no había descendido sobre ninguno de ellos, sino que solamente habían sido bautizados en el nombre de Jesús.",
    themes: ["evangelio"],
  },
  {
    id: "hch-10-48",
    ref: "Hechos 10:48",
    book: "Hechos",
    text: "Y mandó bautizarles en el nombre del Señor Jesús. Entonces le rogaron que se quedase por algunos días.",
    themes: ["evangelio"],
  },
  {
    id: "hch-19-5",
    ref: "Hechos 19:5",
    book: "Hechos",
    text: "Oído esto, fueron bautizados en el nombre del Señor Jesús.",
    themes: ["evangelio"],
  },
  {
    id: "jn-10-28",
    ref: "Juan 10:28-29",
    book: "Juan",
    text: "Y yo les doy vida eterna; y no perecerán jamás, ni nadie las arrebatará de mi mano. Mi Padre que me las dio, es mayor que todos, y nadie las puede arrebatar de la mano de mi Padre.",
    themes: ["fe", "esperanza", "evangelio"],
  },
  {
    id: "heb-10-26",
    ref: "Hebreos 10:26-27",
    book: "Hebreos",
    text: "Porque si pecáremos voluntariamente después de haber recibido el conocimiento de la verdad, ya no queda más sacrificio por los pecados, sino una horrenda expectación de juicio, y de hervor de fuego que ha de devorar a los adversarios.",
    themes: ["evangelio"],
  },
  {
    id: "mt-24-13",
    ref: "Mateo 24:13",
    book: "Mateo",
    text: "Mas el que persevere hasta el fin, éste será salvo.",
    themes: ["fe", "fortaleza", "evangelio"],
  },
  {
    id: "stgo-2-17",
    ref: "Santiago 2:17",
    book: "Santiago",
    text: "Así también la fe, si no tiene obras, es muerta en sí misma.",
    themes: ["fe", "evangelio"],
  },
  {
    id: "gal-2-16",
    ref: "Gálatas 2:16",
    book: "Gálatas",
    text: "Sabiendo que el hombre no es justificado por las obras de la ley, sino por la fe de Jesucristo, nosotros también hemos creído en Jesucristo, para ser justificados por la fe de Cristo y no por las obras de la ley, por cuanto por las obras de la ley nadie será justificado.",
    themes: ["fe", "evangelio"],
  },
  {
    id: "tit-3-5",
    ref: "Tito 3:5",
    book: "Tito",
    text: "Nos salvó, no por obras de justicia que nosotros hubiéramos hecho, sino por su misericordia, por el lavamiento de la regeneración y por la renovación en el Espíritu Santo.",
    themes: ["perdon", "evangelio"],
  },
  {
    id: "hch-2-4",
    ref: "Hechos 2:4",
    book: "Hechos",
    text: "Y fueron todos llenos del Espíritu Santo, y comenzaron a hablar en otras lenguas, según el Espíritu les daba que hablasen.",
    themes: ["evangelio"],
  },
  {
    id: "1co-12-30",
    ref: "1 Corintios 12:29-30",
    book: "1 Corintios",
    text: "¿Son todos apóstoles? ¿son todos profetas? ¿todos maestros? ¿hacen todos milagros? ¿Tienen todos dones de sanidad? ¿hablan todos lenguas? ¿interpretan todos?",
    themes: ["evangelio"],
  },
  {
    id: "1co-14-4",
    ref: "1 Corintios 14:4-5",
    book: "1 Corintios",
    text: "El que habla en lengua extraña, a sí mismo se edifica; pero el que profetiza, edifica a la iglesia. Yo quisiera que todos vosotros hablaseis en lenguas, pero más que profetizaseis; porque mayor es el que profetiza que el que habla en lenguas, a no ser que las interprete para que la iglesia reciba edificación.",
    themes: ["evangelio"],
  },
  {
    id: "1co-14-27",
    ref: "1 Corintios 14:27-28",
    book: "1 Corintios",
    text: "Si habla alguno en lengua extraña, sea esto por dos, o a lo más tres, y por turno; y uno interprete. Y si no hay intérprete, calle en la iglesia, y hable para sí mismo y para Dios.",
    themes: ["evangelio"],
  },
  {
    id: "mal-3-10",
    ref: "Malaquías 3:10",
    book: "Malaquías",
    text: "Traed todos los diezmos al alfolí y haya alimento en mi casa; y probadme ahora en esto, dice Jehová de los ejércitos, si no os abriré las ventanas de los cielos, y derramaré sobre vosotros bendición hasta que sobreabunde.",
    themes: ["gratitud", "fe"],
  },
  {
    id: "2co-9-7",
    ref: "2 Corintios 9:7",
    book: "2 Corintios",
    text: "Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre.",
    themes: ["gratitud", "amor"],
  },
  {
    id: "mt-23-23",
    ref: "Mateo 23:23",
    book: "Mateo",
    text: "¡Ay de vosotros, escribas y fariseos, hipócritas! porque diezmáis la menta y el eneldo y el comino, y dejáis lo más importante de la ley: la justicia, la misericordia y la fe. Esto era necesario hacer, sin dejar de hacer aquello.",
    themes: ["sabiduria", "evangelio"],
  },
  {
    id: "mt-25-46",
    ref: "Mateo 25:46",
    book: "Mateo",
    text: "E irán éstos al castigo eterno, y los justos a la vida eterna.",
    themes: ["evangelio"],
  },
  {
    id: "lc-16-23",
    ref: "Lucas 16:23-24",
    book: "Lucas",
    text: "Y en el Hades alzó sus ojos, estando en tormentos, y vio de lejos a Abraham, y a Lázaro en su seno. Entonces él, dando voces, dijo: Padre Abraham, ten misericordia de mí, y envía a Lázaro para que moje la punta de su dedo en agua, y refresque mi lengua; porque estoy atormentado en esta llama.",
    themes: ["evangelio"],
  },
  {
    id: "ap-20-15",
    ref: "Apocalipsis 20:15",
    book: "Apocalipsis",
    text: "Y el que no se halló inscrito en el libro de la vida fue lanzado al lago de fuego.",
    themes: ["evangelio"],
  },
  {
    id: "2ts-1-9",
    ref: "2 Tesalonicenses 1:8-9",
    book: "2 Tesalonicenses",
    text: "Con llama de fuego, para dar retribución a los que no conocieron a Dios, ni obedecen al evangelio de nuestro Señor Jesucristo; los cuales sufrirán pena de eterna perdición, excluidos de la presencia del Señor y de la gloria de su poder.",
    themes: ["evangelio"],
  },
  {
    id: "ef-2-20",
    ref: "Efesios 2:20",
    book: "Efesios",
    text: "Edificados sobre el fundamento de los apóstoles y profetas, siendo la principal piedra del ángulo Jesucristo mismo.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "ef-4-11",
    ref: "Efesios 4:11-12",
    book: "Efesios",
    text: "Y él mismo constituyó a unos, apóstoles; a otros, profetas; a otros, evangelistas; a otros, pastores y maestros, a fin de perfeccionar a los santos para la obra del ministerio, para la edificación del cuerpo de Cristo.",
    themes: ["evangelio"],
  },
  {
    id: "heb-1-1",
    ref: "Hebreos 1:1-2",
    book: "Hebreos",
    text: "Dios, habiendo hablado muchas veces y de muchas maneras en otro tiempo a los padres por los profetas, en estos postreros días nos ha hablado por el Hijo, a quien constituyó heredero de todo, y por quien asimismo hizo el universo.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "heb-10-19",
    ref: "Hebreos 10:19-20",
    book: "Hebreos",
    text: "Así que, hermanos, teniendo libertad para entrar en el Lugar Santísimo por la sangre de Jesucristo, por el camino nuevo y vivo que él nos abrió a través del velo, esto es, de su carne.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "mt-27-51",
    ref: "Mateo 27:51",
    book: "Mateo",
    text: "Y he aquí, el velo del templo se rasgó en dos, de arriba abajo; y la tierra tembló, y las rocas se partieron.",
    themes: ["evangelio"],
  },
  {
    id: "1pe-2-9",
    ref: "1 Pedro 2:9",
    book: "1 Pedro",
    text: "Mas vosotros sois linaje escogido, real sacerdocio, nación santa, pueblo adquirido por Dios, para que anunciéis las virtudes de aquel que os llamó de las tinieblas a su luz admirable.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "is-7-14",
    ref: "Isaías 7:14",
    book: "Isaías",
    text: "Por tanto, el Señor mismo os dará señal: He aquí que la virgen concebirá, y dará a luz un hijo, y llamará su nombre Emanuel.",
    themes: ["evangelio", "esperanza"],
  },
  {
    id: "mt-1-23",
    ref: "Mateo 1:23",
    book: "Mateo",
    text: "He aquí, una virgen concebirá y dará a luz un hijo, y llamarás su nombre Emanuel, que traducido es: Dios con nosotros.",
    themes: ["evangelio"],
  },
  {
    id: "jn-1-14",
    ref: "Juan 1:14",
    book: "Juan",
    text: "Y aquel Verbo fue hecho carne, y habitó entre nosotros (y vimos su gloria, gloria como del unigénito del Padre), lleno de gracia y de verdad.",
    themes: ["evangelio", "amor"],
  },
  {
    id: "col-1-15",
    ref: "Colosenses 1:15",
    book: "Colosenses",
    text: "Él es la imagen del Dios invisible, el primogénito de toda creación.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "1co-3-16",
    ref: "1 Corintios 3:16",
    book: "1 Corintios",
    text: "¿No sabéis que sois templo de Dios, y que el Espíritu de Dios mora en vosotros?",
    themes: ["evangelio", "fe"],
  },
  {
    id: "ro-8-9",
    ref: "Romanos 8:9-10",
    book: "Romanos",
    text: "Mas vosotros no vivís según la carne, sino según el Espíritu, si es que el Espíritu de Dios mora en vosotros. Y si alguno no tiene el Espíritu de Cristo, no es de él. Pero si Cristo está en vosotros, el cuerpo en verdad está muerto a causa del pecado, mas el espíritu vive a causa de la justicia.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "gal-4-19",
    ref: "Gálatas 4:19",
    book: "Gálatas",
    text: "Hijitos míos, por quienes vuelvo a sufrir dolores de parto, hasta que Cristo sea formado en vosotros.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "mt-12-30",
    ref: "Mateo 12:30",
    book: "Mateo",
    text: "El que no es conmigo, contra mí es; y el que conmigo no recoge, desparrama.",
    themes: ["evangelio"],
  },
  {
    id: "ro-6-3",
    ref: "Romanos 6:3-4",
    book: "Romanos",
    text: "¿O no sabéis que todos los que hemos sido bautizados en Cristo Jesús, hemos sido bautizados en su muerte? Porque somos sepultados juntamente con él para muerte por el bautismo, a fin de que como Cristo resucitó de los muertos por la gloria del Padre, así también nosotros andemos en vida nueva.",
    themes: ["evangelio", "perdon"],
  },
  {
    id: "gal-3-27",
    ref: "Gálatas 3:27",
    book: "Gálatas",
    text: "Porque todos los que habéis sido bautizados en Cristo, de Cristo estáis revestidos.",
    themes: ["evangelio"],
  },
  {
    id: "col-2-12",
    ref: "Colosenses 2:12",
    book: "Colosenses",
    text: "Sepultados con él en el bautismo, en el cual fuisteis también resucitados con él, mediante la fe en el poder de Dios que le levantó de los muertos.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "1ts-1-10",
    ref: "1 Tesalonicenses 1:10",
    book: "1 Tesalonicenses",
    text: "Y esperar de los cielos a su Hijo, al cual resucitó de los muertos, a Jesús, quien nos libra de la ira venidera.",
    themes: ["esperanza", "evangelio"],
  },
  {
    id: "1ts-5-9",
    ref: "1 Tesalonicenses 5:9",
    book: "1 Tesalonicenses",
    text: "Porque no nos ha puesto Dios para ira, sino para alcanzar salvación por medio de nuestro Señor Jesucristo.",
    themes: ["esperanza", "evangelio"],
  },
  {
    id: "ap-3-10",
    ref: "Apocalipsis 3:10",
    book: "Apocalipsis",
    text: "Por cuanto has guardado la palabra de mi paciencia, yo también te guardaré de la hora de la prueba que ha de venir sobre el mundo entero, para probar a los que moran sobre la tierra.",
    themes: ["esperanza", "fortaleza"],
  },
  {
    id: "mt-24-29",
    ref: "Mateo 24:29-31",
    book: "Mateo",
    text: "E inmediatamente después de la tribulación de aquellos días, el sol se oscurecerá, y la luna no dará su resplandor, y las estrellas caerán del cielo, y las potencias de los cielos serán conmovidas. Entonces aparecerá la señal del Hijo del Hombre en el cielo; y entonces lamentarán todas las tribus de la tierra, y verán al Hijo del Hombre viniendo sobre las nubes del cielo, con poder y gran gloria. Y enviará sus ángeles con gran voz de trompeta, y juntarán a sus escogidos, de los cuatro vientos, desde un extremo del cielo hasta el otro.",
    themes: ["esperanza", "evangelio"],
  },
  {
    id: "mt-24-44",
    ref: "Mateo 24:44",
    book: "Mateo",
    text: "Por tanto, también vosotros estad preparados; porque el Hijo del Hombre vendrá a la hora que no pensáis.",
    themes: ["esperanza", "fe"],
  },
  {
    id: "2ts-2-1",
    ref: "2 Tesalonicenses 2:1-4",
    book: "2 Tesalonicenses",
    text: "Pero os rogamos, hermanos, en cuanto a la venida de nuestro Señor Jesucristo, y nuestra reunión con él, que no os dejéis mover fácilmente de vuestro modo de pensar, ni os conturbéis, ni por espíritu, ni por palabra, ni por carta como si fuera nuestra, en el sentido de que el día del Señor está cerca. Nadie os engañe en ninguna manera; porque no vendrá sin que antes venga la apostasía, y se manifieste el hombre de pecado, el hijo de perdición, el cual se opone y se levanta contra todo lo que se llama Dios o es objeto de culto; tanto que se sienta en el templo de Dios como Dios, haciéndose pasar por Dios.",
    themes: ["esperanza", "evangelio"],
  },
  {
    id: "mt-26-26",
    ref: "Mateo 26:26-28",
    book: "Mateo",
    text: "Y mientras comían, tomó Jesús el pan, y bendijo, y lo partió, y dio a sus discípulos, y dijo: Tomad, comed; esto es mi cuerpo. Y tomando la copa, y habiendo dado gracias, les dio, diciendo: Bebed de ella todos; porque esto es mi sangre del nuevo pacto, que por muchos es derramada para remisión de los pecados.",
    themes: ["evangelio", "perdon"],
  },
  {
    id: "lc-22-19",
    ref: "Lucas 22:19",
    book: "Lucas",
    text: "Y tomó el pan y dio gracias, y lo partió y les dio, diciendo: Esto es mi cuerpo, que por vosotros es dado; haced esto en memoria de mí.",
    themes: ["evangelio"],
  },
  {
    id: "1co-11-26",
    ref: "1 Corintios 11:26",
    book: "1 Corintios",
    text: "Así, pues, todas las veces que comiereis este pan, y bebiereis esta copa, la muerte del Señor anunciáis hasta que él venga.",
    themes: ["evangelio", "esperanza"],
  },
  {
    id: "1co-11-28",
    ref: "1 Corintios 11:27-28",
    book: "1 Corintios",
    text: "De manera que cualquiera que comiere este pan o bebiere esta copa del Señor indignamente, será culpado del cuerpo y de la sangre del Señor. Por tanto, pruébese cada uno a sí mismo, y coma así del pan, y beba de la copa.",
    themes: ["evangelio"],
  },
  {
    id: "1co-10-16",
    ref: "1 Corintios 10:16-17",
    book: "1 Corintios",
    text: "La copa de bendición que bendecimos, ¿no es la comunión de la sangre de Cristo? El pan que partimos, ¿no es la comunión del cuerpo de Cristo? Siendo uno solo el pan, nosotros, con ser muchos, somos un cuerpo; pues todos participamos de aquel mismo pan.",
    themes: ["evangelio", "amor"],
  },
  {
    id: "gn-14-20",
    ref: "Génesis 14:20",
    book: "Génesis",
    text: "Y bendito sea el Dios Altísimo, que entregó tus enemigos en tu mano. Y le dio Abram los diezmos de todo.",
    themes: ["gratitud", "fe"],
  },
  {
    id: "gn-28-22",
    ref: "Génesis 28:22",
    book: "Génesis",
    text: "Y esta piedra que he puesto por señal, será casa de Dios; y de todo lo que me dieres, el diezmo apartaré para ti.",
    themes: ["gratitud", "fe"],
  },
  {
    id: "lv-27-30",
    ref: "Levítico 27:30",
    book: "Levítico",
    text: "Y el diezmo de la tierra, así de la simiente de la tierra como del fruto de los árboles, de Jehová es; es cosa dedicada a Jehová.",
    themes: ["gratitud"],
  },
  {
    id: "nm-18-21",
    ref: "Números 18:21",
    book: "Números",
    text: "Y he aquí yo he dado a los hijos de Leví todos los diezmos en Israel por heredad, por su ministerio, por cuanto ellos sirven en el ministerio del tabernáculo de reunión.",
    themes: ["gratitud"],
  },
  {
    id: "1co-16-2",
    ref: "1 Corintios 16:2",
    book: "1 Corintios",
    text: "Cada primer día de la semana cada uno de vosotros ponga aparte algo, según haya prosperado, guardándolo, para que cuando yo llegue no se recojan entonces ofrendas.",
    themes: ["gratitud"],
  },
  {
    id: "1co-9-14",
    ref: "1 Corintios 9:14",
    book: "1 Corintios",
    text: "Así también ordenó el Señor a los que anuncian el evangelio, que vivan del evangelio.",
    themes: ["evangelio", "gratitud"],
  },
  {
    id: "gal-6-6",
    ref: "Gálatas 6:6",
    book: "Gálatas",
    text: "El que es enseñado en la palabra, haga partícipe de toda cosa buena al que lo instruye.",
    themes: ["gratitud", "amor"],
  },
  {
    id: "ap-21-14",
    ref: "Apocalipsis 21:14",
    book: "Apocalipsis",
    text: "Y el muro de la ciudad tenía doce cimientos, y sobre ellos los doce nombres de los doce apóstoles del Cordero.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "1co-14-1",
    ref: "1 Corintios 14:1",
    book: "1 Corintios",
    text: "Seguid el amor; y procurad los dones espirituales, pero sobre todo que profeticéis.",
    themes: ["amor", "evangelio"],
  },
  {
    id: "1co-14-3",
    ref: "1 Corintios 14:3",
    book: "1 Corintios",
    text: "Pero el que profetiza habla a los hombres para edificación, exhortación y consolación.",
    themes: ["evangelio"],
  },
  {
    id: "1co-14-29",
    ref: "1 Corintios 14:29",
    book: "1 Corintios",
    text: "Asimismo, los profetas hablen dos o tres, y los demás juzguen.",
    themes: ["evangelio"],
  },
  {
    id: "1co-14-31",
    ref: "1 Corintios 14:31",
    book: "1 Corintios",
    text: "Porque podéis profetizar todos uno por uno, para que todos aprendan, y todos sean exhortados.",
    themes: ["evangelio"],
  },
  {
    id: "1ts-5-20",
    ref: "1 Tesalonicenses 5:20-21",
    book: "1 Tesalonicenses",
    text: "No menospreciéis las profecías. Examinadlo todo; retened lo bueno.",
    themes: ["evangelio", "sabiduria"],
  },
  {
    id: "1jn-4-1",
    ref: "1 Juan 4:1",
    book: "1 Juan",
    text: "Amados, no creáis a todo espíritu, sino probad los espíritus si son de Dios; porque muchos falsos profetas han salido por el mundo.",
    themes: ["evangelio", "fe"],
  },
  {
    id: "gal-3-28",
    ref: "Gálatas 3:28",
    book: "Gálatas",
    text: "No hay judío ni griego; no hay esclavo ni libre; no hay varón ni mujer; porque todos vosotros sois uno en Cristo Jesús.",
    themes: ["evangelio", "amor"],
  },
  {
    id: "hch-18-26",
    ref: "Hechos 18:26",
    book: "Hechos",
    text: "Y comenzó a hablar osadamente en la sinagoga; pero cuando le oyeron Priscila y Aquila, le tomaron aparte y le expusieron más exactamente el camino de Dios.",
    themes: ["evangelio"],
  },
  {
    id: "ro-16-1",
    ref: "Romanos 16:1",
    book: "Romanos",
    text: "Os recomiendo además nuestra hermana Febe, la cual es diaconisa de la iglesia en Cencrea.",
    themes: ["evangelio"],
  },
  {
    id: "hch-21-9",
    ref: "Hechos 21:9",
    book: "Hechos",
    text: "Y este tenía cuatro hijas doncellas que profetizaban.",
    themes: ["evangelio"],
  },
  {
    id: "1co-11-5",
    ref: "1 Corintios 11:5",
    book: "1 Corintios",
    text: "Pero toda mujer que ora o profetiza con la cabeza descubierta, afrenta su cabeza; porque lo mismo es que si se hubiese rapado.",
    themes: ["evangelio"],
  },
  {
    id: "tit-2-3",
    ref: "Tito 2:3-5",
    book: "Tito",
    text: "Las ancianas asimismo sean reverentes en su porte; no calumniadoras, no esclavas del vino, maestras del bien; que enseñen a las mujeres jóvenes a amar a sus maridos y a sus hijos, a ser prudentes, castas, cuidadosas de su casa, buenas, sujetas a sus maridos, para que la palabra de Dios no sea blasfemada.",
    themes: ["familia", "evangelio"],
  },
  {
    id: "1ti-3-1",
    ref: "1 Timoteo 3:1-2",
    book: "1 Timoteo",
    text: "Palabra fiel: Si alguno anhela obispado, buena obra desea. Pero es necesario que el obispo sea irreprensible, marido de una sola mujer, sobrio, prudente, decoroso, hospedador, apto para enseñar.",
    themes: ["evangelio"],
  },
  {
    id: "tit-1-5",
    ref: "Tito 1:5-6",
    book: "Tito",
    text: "Por esta causa te dejé en Creta, para que corrigieses lo deficiente, y establecieses ancianos en cada ciudad, así como yo te mandé; el que fuere irreprensible, marido de una sola mujer, y tenga hijos creyentes que no estén acusados de disolución ni de rebeldía.",
    themes: ["evangelio"],
  },
  {
    id: "1ti-2-11",
    ref: "1 Timoteo 2:11-13",
    book: "1 Timoteo",
    text: "La mujer aprenda en silencio, con toda sujeción. Porque no permito a la mujer enseñar, ni ejercer dominio sobre el hombre, sino estar en silencio. Porque Adán fue formado primero, después Eva.",
    themes: ["evangelio"],
  },
  {
    id: "1pe-5-2",
    ref: "1 Pedro 5:2-3",
    book: "1 Pedro",
    text: "Apacentad la grey de Dios que está entre vosotros, cuidando de ella, no por fuerza, sino voluntariamente; no por ganancia deshonesta, sino con ánimo pronto; no como teniendo señorío sobre los que están a vuestro cuidado, sino siendo ejemplos de la grey.",
    themes: ["evangelio"],
  },
  {
    id: "jn-15-4",
    ref: "Juan 15:4",
    book: "Juan",
    text: "Permaneced en mí, y yo en vosotros. Como el pámpano no puede llevar fruto por sí mismo, si no permanece en la vid, así tampoco vosotros, si no permanecéis en mí.",
    themes: ["fe", "amor"],
  },
  {
    id: "hch-4-31",
    ref: "Hechos 4:31",
    book: "Hechos",
    text: "Cuando hubieron orado, el lugar en que estaban congregados tembló; y todos fueron llenos del Espíritu Santo, y hablaban con denuedo la palabra de Dios.",
    themes: ["fortaleza", "evangelio"],
  },
  {
    id: "1co-12-11",
    ref: "1 Corintios 12:11",
    book: "1 Corintios",
    text: "Pero todas estas cosas las hace uno y el mismo Espíritu, repartiendo a cada uno en particular como él quiere.",
    themes: ["evangelio"],
  },
  {
    id: "mt-7-22",
    ref: "Mateo 7:22-23",
    book: "Mateo",
    text: "Muchos me dirán en aquel día: Señor, Señor, ¿no profetizamos en tu nombre, y en tu nombre echamos fuera demonios, y en tu nombre hicimos muchos milagros? Y entonces les declararé: Nunca os conocí; apartaos de mí, hacedores de maldad.",
    themes: ["evangelio"],
  },
];

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function hashString(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getDailyVerse(offset = 0, date = new Date()) {
  const index = (hashString(todayKey(date)) + offset) % VERSES.length;
  return VERSES[index]!;
}

export function getVerseById(id: string) {
  return VERSES.find((verse) => verse.id === id);
}

export function versesForTheme(id: ThemeId) {
  return VERSES.filter((verse) => verse.themes.includes(id));
}

export function searchVerses(query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return VERSES.filter((verse) => {
    const en = VERSE_EN[verse.id];
    return (
      verse.text.toLowerCase().includes(needle) ||
      verse.ref.toLowerCase().includes(needle) ||
      verse.book.toLowerCase().includes(needle) ||
      Boolean(
        en &&
          (en.text.toLowerCase().includes(needle) ||
            en.ref.toLowerCase().includes(needle) ||
            en.book.toLowerCase().includes(needle)),
      )
    );
  });
}

export function themeById(id: ThemeId) {
  return THEMES.find((theme) => theme.id === id)!;
}
