import type { Locale } from "@/lib/i18n";
import { recobroSource } from "@/lib/bible";
import type { Verse } from "@/lib/verses";

export type NviRow = {
  id: string;
  ref: string;
  language: string;
  original: string;
  spoken: string;
  meaning: string;
  recobro: string;
  nvi: string;
  difference: string;
};

export const NVI_SYSTEM = [
  "La NVI (Biblica) es la Biblia evangélica moderna más leída en español. Traduce idea por idea, para que suene natural hoy.",
  "La Versión Recobro se atiene más a las palabras griegas de la economía de Dios: tabernáculo, realidad, economía, «en» (hacia dentro), el Espíritu.",
  "La NVI no niega a Cristo. Recobro no inventa otra fe. La diferencia es qué tanto se oye el original cuando uno predica vida, Espíritu y Cuerpo.",
];

export const NVI_SYSTEM_EN = [
  "The NIV (Biblica) is the most-read modern evangelical Bible in English. It translates thought for thought, so it sounds natural today.",
  "The Recovery Version holds more closely to the Greek words of God’s economy: tabernacle, reality, economy, “into,” the Spirit.",
  "The NIV does not deny Christ. Recovery does not invent another faith. The difference is how much of the original you hear when you preach life, the Spirit, and the Body.",
];

export const NVI_ROWS: NviRow[] = [
  {
    id: "jn-1-14",
    ref: "Juan 1:14",
    language: "Griego koiné",
    original: "καὶ ἐσκήνωσεν ἐν ἡμῖν",
    spoken: "kaì eskḗnōsen en hēmîn",
    meaning:
      "σκηνόω es clavar tienda, el tabernáculo. El Verbo no «pasó una temporada»: puso Su tabernáculo en carne, como la shekiná en el desierto. Y ἀλήθεια aquí es realidad, no solo dato verdadero.",
    recobro:
      "Y la Palabra se hizo carne, y fijó tabernáculo entre nosotros (y contemplamos Su gloria, gloria como del Unigénito del Padre), llena de gracia y de realidad.",
    nvi: "Y el Verbo se hizo hombre y habitó entre nosotros. Y hemos contemplado su gloria, la gloria que corresponde al Hijo unigénito del Padre, lleno de gracia y de verdad.",
    difference:
      "NVI suaviza «se hizo carne» a «se hizo hombre», y «fijó tabernáculo» a «habitó». Recobro guarda la carne y el tabernáculo: Dios dispensándose en humanidad.",
  },
  {
    id: "jn-3-16",
    ref: "Juan 3:16",
    language: "Griego koiné",
    original: "πᾶς ὁ πιστεύων εἰς αὐτόν",
    spoken: "pâs ho pisteúōn eis autón",
    meaning:
      "εἰς no es sólo «acerca de». Es hacia dentro. Creer es entrar en Cristo, ser unidos a Él, no sólo estar de acuerdo con Él.",
    recobro:
      "Porque de tal manera amó Dios al mundo, que ha dado a Su Hijo unigénito, para que todo aquel que en Él cree, no perezca, mas tenga vida eterna.",
    nvi: "Porque tanto amó Dios al mundo, que dio a su Hijo unigénito, para que todo el que cree en él no se pierda, sino que tenga vida eterna.",
    difference:
      "NVI dice «cree en él», como opinión o confianza. Recobro, con el εἰς, predica un creer que mete al pecador dentro de Cristo.",
  },
  {
    id: "jn-7-39",
    ref: "Juan 7:39",
    language: "Griego koiné",
    original: "οὔπω γὰρ ἦν πνεῦμα",
    spoken: "oúpō gàr ên pneûma",
    meaning:
      "El texto dice: el Espíritu aún no era. No «aún no se había dado». Antes de la resurrección el Espíritu de Dios estaba; después de glorificar a Jesús, ese Espíritu es el Espíritu de Jesús, procesado, compuesto, dándose como vida.",
    recobro:
      "Esto dijo del Espíritu que habían de recibir los que creyesen en Él; pues aún no había el Espíritu, porque Jesús no había sido aún glorificado.",
    nvi: "Con esto se refería al Espíritu que habrían de recibir más tarde los que creyeran en él. Hasta ese momento el Espíritu no había sido dado, porque Jesús no había sido glorificado todavía.",
    difference:
      "NVI añade «dado», que el griego no trae, y suena a un poder que llega después. Recobro deja el «aún no era»: el Espíritu como vida de Cristo resucitado.",
  },
  {
    id: "jn-14-6",
    ref: "Juan 14:6",
    language: "Griego koiné",
    original: "ἐγώ εἰμι ἡ ὁδὸς καὶ ἡ ἀλήθεια καὶ ἡ ζωή",
    spoken: "egṓ eimi hē hodòs kaì hē alḗtheia kaì hē zōḗ",
    meaning:
      "ἀλήθεια es lo real, lo que no es sombra. Jesús no es una doctrina correcta. Es la realidad de Dios llegando al hombre, y la vida de esa realidad.",
    recobro:
      "Jesús le dijo: Yo soy el camino, y la realidad, y la vida; nadie viene al Padre, sino por Mí.",
    nvi: "Jesús le contestó: Yo soy el camino, la verdad y la vida. Nadie va al Padre sino por mí.",
    difference:
      "«Verdad» en NVI suena a información. Recobro dice «realidad»: Él mismo es lo que el Padre es, hecho accesible.",
  },
  {
    id: "ro-5-10",
    ref: "Romanos 5:10",
    language: "Griego koiné",
    original: "σωθησόμεθα ἐν τῇ ζωῇ αὐτοῦ",
    spoken: "sōthēsómetha en têi zōêi autoû",
    meaning:
      "ἐν τῇ ζωῇ: en Su vida, no sólo «por medio de» un hecho pasado. La muerte nos reconcilió. La salvación cotidiana es vivir en la vida de Él.",
    recobro:
      "Porque si siendo enemigos, fuimos reconciliados con Dios por la muerte de Su Hijo, mucho más, estando reconciliados, seremos salvos en Su vida.",
    nvi: "Porque si, cuando éramos enemigos de Dios, fuimos reconciliados con él mediante la muerte de su Hijo, ¡con cuánta más razón, habiendo sido reconciliados, seremos salvos por su vida!",
    difference:
      "NVI: «por su vida», como un instrumento. Recobro: «en Su vida». El predicador no anuncia sólo perdón. Anuncia una vida en la cual ser salvos hoy.",
  },
  {
    id: "ro-8-16",
    ref: "Romanos 8:16",
    language: "Griego koiné",
    original: "αὐτὸ τὸ πνεῦμα συμμαρτυρεῖ τῷ πνεύματι ἡμῶν",
    spoken: "autò tò pneûma summartureî tôi pneúmati hēmôn",
    meaning:
      "συμμαρτυρεῖ: da testimonio juntamente con. Hay el Espíritu de Dios y nuestro espíritu humano. No es una voz que «le asegura a la mente». Es Espíritu con espíritu.",
    recobro:
      "El Espíritu mismo da testimonio juntamente con nuestro espíritu, de que somos hijos de Dios.",
    nvi: "El Espíritu mismo le asegura a nuestro espíritu que somos hijos de Dios.",
    difference:
      "NVI convierte el testimonio conjunto en un aviso que «le llega» al espíritu. Recobro guarda el con: Dios y el hombre, espíritu con espíritu.",
  },
  {
    id: "1co-6-17",
    ref: "1 Corintios 6:17",
    language: "Griego koiné",
    original: "ἓν πνεῦμά ἐστιν",
    spoken: "hèn pneûmá estin",
    meaning:
      "El que se une al Señor es un solo espíritu. No «uno en espíritu» como ánimo compartido. Es unión orgánica: dos espíritus hechos uno.",
    recobro: "Pero el que se une al Señor, es un solo espíritu con Él.",
    nvi: "Pero el que se une al Señor se hace uno con él en espíritu.",
    difference:
      "NVI suena a compañerismo. Recobro dice lo que el griego dice: un solo espíritu. Eso es la base de «Cristo en vosotros».",
  },
  {
    id: "1co-15-45",
    ref: "1 Corintios 15:45",
    language: "Griego koiné",
    original: "ὁ ἔσχατος Ἀδὰμ εἰς πνεῦμα ζῳοποιοῦν",
    spoken: "ho éschatos Adàm eis pneûma zōiopoioun",
    meaning:
      "ἐγένετο εἰς: el postrer Adán llegó a ser Espíritu vivificante. Cristo resucitado no sólo envía el Espíritu. Él mismo, como el último Adán, es ese Espíritu que da vida.",
    recobro:
      "Así también está escrito: “Fue hecho el primer hombre Adán alma viviente”; el postrer Adán, Espíritu vivificante.",
    nvi: "Así está escrito: «El primer hombre, Adán, se convirtió en un ser viviente»; el último Adán, en el Espíritu que da vida.",
    difference:
      "NVI deja «en el Espíritu», como si Cristo pasara a otra cosa. Recobro: Él es el Espíritu vivificante. 2 Corintios 3:17: el Señor es el Espíritu.",
  },
  {
    id: "ef-3-9",
    ref: "Efesios 3:9",
    language: "Griego koiné",
    original: "ἡ οἰκονομία τοῦ μυστηρίου",
    spoken: "hē oikonomía toû mystēríou",
    meaning:
      "οἰκονομία es administración de una casa: cómo Dios reparte a Cristo para producir el Cuerpo. No es un «plan» en abstracto. Es la economía, el arreglo, la dispensación.",
    recobro:
      "y de alumbrar a todos para que vean cuál es la economía del misterio escondido a lo largo de los siglos en Dios, que creó todas las cosas;",
    nvi: "y de hacer entender a todos la realización del plan de Dios, el misterio que desde los tiempos eternos se mantuvo oculto en Dios, creador de todas las cosas.",
    difference:
      "NVI dice «plan». Recobro recupera economía: Dios administrando a Cristo como vida en los santos, hasta que haya un Cuerpo.",
  },
  {
    id: "fil-1-19",
    ref: "Filipenses 1:19",
    language: "Griego koiné",
    original: "ἐπιχορηγίας τοῦ πνεύματος Ἰησοῦ Χριστοῦ",
    spoken: "epichorēgías toû pneúmatos Iēsoû Christoû",
    meaning:
      "ἐπιχορηγία es suministración abundante, como el coro que un mecenas costeaba entero. El Espíritu de Jesucristo no «ayuda» un poco. Se da como provisión rica.",
    recobro:
      "Porque sé que por vuestra petición y la abundante suministración del Espíritu de Jesucristo, esto resultará en mi salvación,",
    nvi: "porque sé que, gracias a las oraciones de ustedes y a la ayuda que me da el Espíritu de Jesucristo, todo esto resultará en mi liberación.",
    difference:
      "NVI: «ayuda» y «liberación». Recobro: suministración y salvación. El Espíritu no es un empujón. Es Cristo suplido sin medida.",
  },
  {
    id: "mt-28-19",
    ref: "Mateo 28:19",
    language: "Griego koiné",
    original: "βαπτίζοντες αὐτοὺς εἰς τὸ ὄνομα",
    spoken: "baptízontes autoùs eis tò ónoma",
    meaning:
      "εἰς τὸ ὄνομα: hacia dentro del nombre. El nombre es la persona. El bautismo no es un rito «en el título de». Es sumergir a las naciones dentro del Padre, del Hijo y del Espíritu.",
    recobro:
      "Por tanto, id, y haced discípulos a todas las naciones, bautizándolos en el nombre del Padre y del Hijo y del Espíritu Santo;",
    nvi: "Por tanto, vayan y hagan discípulos de todas las naciones, bautizándolos en el nombre del Padre y del Hijo y del Espíritu Santo,",
    difference:
      "En español las dos dicen «en». El griego es εἰς, hacia dentro. Recobro lo marca en la nota: no es un formulario, es unión con la Persona triuna.",
  },
];

const NVI_EN: Record<string, Partial<NviRow>> = {
  "jn-1-14": {
    ref: "John 1:14",
    language: "Koine Greek",
    meaning:
      "σκηνόω is to pitch a tent, the tabernacle. The Word did not “spend some time here.” He tabernacled in flesh, as the shekinah in the wilderness. And ἀλήθεια here is reality, not a mere true statement.",
    recobro:
      "And the Word became flesh and tabernacled among us (and we beheld His glory, glory as of the only Begotten from the Father), full of grace and reality.",
    nvi: "The Word became flesh and made his dwelling among us. We have seen his glory, the glory of the one and only Son, who came from the Father, full of grace and truth.",
    difference:
      "NIV turns “tabernacled” into “made his dwelling,” and “reality” into “truth.” Recovery keeps the flesh and the tabernacle: God dispensing Himself in humanity.",
  },
  "jn-3-16": {
    ref: "John 3:16",
    language: "Koine Greek",
    meaning:
      "εἰς is not merely “about.” It is into. To believe is to enter into Christ, to be joined to Him, not only to agree with Him.",
    recobro:
      "For God so loved the world that He gave His only begotten Son, that everyone who believes into Him would not perish, but would have eternal life.",
    nvi: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    difference:
      "NIV says “believes in him,” like opinion or trust. Recovery, with εἰς, preaches a believing that puts the sinner into Christ.",
  },
  "jn-7-39": {
    ref: "John 7:39",
    language: "Koine Greek",
    meaning:
      "The text says: the Spirit was not yet. Not “had not been given.” Before the resurrection the Spirit of God was; after Jesus was glorified, that Spirit is the Spirit of Jesus, processed, compounded, given as life.",
    recobro:
      "But this He said concerning the Spirit, whom those who believed into Him were about to receive; for the Spirit was not yet, because Jesus had not yet been glorified.",
    nvi: "By this he meant the Spirit, whom those who believed in him were later to receive. Up to that time the Spirit had not been given, since Jesus had not yet been glorified.",
    difference:
      "NIV adds “given,” which the Greek does not have. Recovery leaves “was not yet”: the Spirit as the life of the risen Christ.",
  },
  "jn-14-6": {
    ref: "John 14:6",
    language: "Koine Greek",
    meaning:
      "ἀλήθεια is what is real, not a shadow. Jesus is not a correct doctrine. He is the reality of God coming to man, and the life of that reality.",
    recobro:
      "Jesus said to him, I am the way and the reality and the life; no one comes to the Father except through Me.",
    nvi: "Jesus answered, “I am the way and the truth and the life. No one comes to the Father except through me.”",
    difference:
      "“Truth” in the NIV sounds like information. Recovery says “reality”: He Himself is what the Father is, made available.",
  },
  "ro-5-10": {
    ref: "Romans 5:10",
    language: "Koine Greek",
    meaning:
      "ἐν τῇ ζωῇ: in His life, not only “through” a past event. The death reconciled us. Daily salvation is to live in His life.",
    recobro:
      "For if we, being enemies, were reconciled to God through the death of His Son, much more we will be saved in His life, having been reconciled,",
    nvi: "For if, while we were God’s enemies, we were reconciled to him through the death of his Son, how much more, having been reconciled, shall we be saved through his life!",
    difference:
      "NIV: “through his life,” as an instrument. Recovery: “in His life.” The preacher does not announce only pardon. He announces a life in which to be saved today.",
  },
  "ro-8-16": {
    ref: "Romans 8:16",
    language: "Koine Greek",
    meaning:
      "συμμαρτυρεῖ: bears witness together with. There is the Spirit of God and our human spirit. It is not a voice that “assures the mind.” It is Spirit with spirit.",
    recobro:
      "The Spirit Himself witnesses with our spirit that we are children of God.",
    nvi: "The Spirit himself testifies with our spirit that we are God’s children.",
    difference:
      "In English the NIV is closer here. In Spanish, NVI turns the joint witness into a notice that “reaches” the spirit. Recovery keeps the with: God and man, spirit with spirit.",
  },
  "1co-6-17": {
    ref: "1 Corinthians 6:17",
    language: "Koine Greek",
    meaning:
      "He who is joined to the Lord is one spirit. Not “one in spirit” as shared feeling. It is an organic union: two spirits made one.",
    recobro: "But he who is joined to the Lord is one spirit.",
    nvi: "But whoever is united with the Lord is one with him in spirit.",
    difference:
      "NIV sounds like companionship. Recovery says what the Greek says: one spirit. That is the ground of “Christ in you.”",
  },
  "1co-15-45": {
    ref: "1 Corinthians 15:45",
    language: "Koine Greek",
    meaning:
      "The last Adam became a life-giving Spirit. The risen Christ does not only send the Spirit. He Himself, as the last Adam, is that Spirit who gives life.",
    recobro:
      "So also it is written, “The first man, Adam, became a living soul”; the last Adam became a life-giving Spirit.",
    nvi: "So it is written: “The first man Adam became a living being”; the last Adam, a life-giving spirit.",
    difference:
      "NIV often prints “spirit” in lowercase, as a force. Recovery: He became a life-giving Spirit. 2 Corinthians 3:17: the Lord is the Spirit.",
  },
  "ef-3-9": {
    ref: "Ephesians 3:9",
    language: "Koine Greek",
    meaning:
      "οἰκονομία is the administration of a household: how God dispenses Christ to produce the Body. It is not an abstract “plan.” It is the economy, the arrangement, the dispensing.",
    recobro:
      "And to enlighten all that they may see what the economy of the mystery is, which throughout the ages has been hidden in God, who created all things,",
    nvi: "and to make plain to everyone the administration of this mystery, which for ages past was kept hidden in God, who created all things.",
    difference:
      "NIV says “administration.” Recovery recovers economy: God dispensing Christ as life in the saints until there is a Body.",
  },
  "fil-1-19": {
    ref: "Philippians 1:19",
    language: "Koine Greek",
    meaning:
      "ἐπιχορηγία is a bountiful supply, like a patron underwriting a whole chorus. The Spirit of Jesus Christ does not “help a little.” He is given as rich provision.",
    recobro:
      "For I know that for me this will turn out to salvation through your petition and the bountiful supply of the Spirit of Jesus Christ,",
    nvi: "for I know that through your prayers and God’s provision of the Spirit of Jesus Christ what has happened to me will turn out for my deliverance.",
    difference:
      "NIV: “provision” and “deliverance.” Recovery: bountiful supply and salvation. The Spirit is not a nudge. He is Christ supplied without measure.",
  },
  "mt-28-19": {
    ref: "Matthew 28:19",
    language: "Koine Greek",
    meaning:
      "εἰς τὸ ὄνομα: into the name. The name is the person. Baptism is not a rite “under the title of.” It is immersing the nations into the Father, the Son, and the Spirit.",
    recobro:
      "Go therefore and disciple all the nations, baptizing them into the name of the Father and of the Son and of the Holy Spirit,",
    nvi: "Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit,",
    difference:
      "NIV says “in the name.” The Greek is εἰς, into. Recovery marks it: not a formula, union with the Triune Person.",
  },
};

export function localizedNvi(item: NviRow, locale: Locale): NviRow {
  if (locale !== "en") return item;
  const en = NVI_EN[item.id];
  if (!en) return item;
  return { ...item, ...en };
}

export function nviSystem(locale: Locale) {
  return locale === "en" ? NVI_SYSTEM_EN : NVI_SYSTEM;
}

export function composeNviRowText(item: NviRow, locale: Locale = "es") {
  const row = localizedNvi(item, locale);
  if (locale === "en") {
    return [
      row.ref,
      "",
      `Original (${row.language}): ${row.original}`,
      `Read: ${row.spoken}`,
      `What it conveys: ${row.meaning}`,
      "",
      `Recovery Version: ${row.recobro}`,
      `NIV: ${row.nvi}`,
      `The difference: ${row.difference}`,
    ].join("\n");
  }
  return [
    row.ref,
    "",
    `Original (${row.language}): ${row.original}`,
    `Se lee: ${row.spoken}`,
    `Lo que transmite: ${row.meaning}`,
    "",
    `Versión Recobro: ${row.recobro}`,
    `NVI: ${row.nvi}`,
    `La diferencia: ${row.difference}`,
  ].join("\n");
}

export function nviRowVerse(item: NviRow, locale: Locale = "es"): Verse {
  const row = localizedNvi(item, locale);
  return {
    id: `nvi-${item.id}`,
    ref: row.ref,
    book: recobroSource(locale),
    text: composeNviRowText(item, locale),
    themes: ["evangelio"],
    source: recobroSource(locale),
  };
}

export function composeNviDigest(locale: Locale = "es") {
  const lines =
    locale === "en"
      ? ["Recovery Version and the NIV:", "", ...NVI_SYSTEM_EN, ""]
      : ["Versión Recobro y la NVI:", "", ...NVI_SYSTEM, ""];
  for (const item of NVI_ROWS) {
    const row = localizedNvi(item, locale);
    lines.push(row.ref);
    lines.push(`Original (${row.language}): ${row.original}`);
    lines.push(locale === "en" ? `Read: ${row.spoken}` : `Se lee: ${row.spoken}`);
    lines.push(locale === "en" ? `Conveys: ${row.meaning}` : `Transmite: ${row.meaning}`);
    lines.push(
      locale === "en"
        ? `Recovery Version: ${row.recobro}`
        : `Versión Recobro: ${row.recobro}`,
    );
    lines.push(locale === "en" ? `NIV: ${row.nvi}` : `NVI: ${row.nvi}`);
    lines.push(
      locale === "en" ? `Difference: ${row.difference}` : `Diferencia: ${row.difference}`,
    );
    lines.push("");
  }
  lines.push(
    locale === "en"
      ? "The Word became flesh and tabernacled among us."
      : "La Palabra se hizo carne, y fijó tabernáculo entre nosotros.",
  );
  return lines.join("\n").trim();
}

export function nviDigestVerse(locale: Locale = "es"): Verse {
  return {
    id: "nvi-digest",
    ref: locale === "en" ? "Recovery Version and NIV" : "Recobro y NVI",
    book: recobroSource(locale),
    text: composeNviDigest(locale),
    themes: ["evangelio"],
    source: recobroSource(locale),
  };
}
