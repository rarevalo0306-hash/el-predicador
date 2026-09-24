import { recobroSource } from "@/lib/bible";
import { t, type Locale } from "@/lib/i18n";
import { hydrateVerses } from "@/lib/recobro";
import { getVerseById, localizeVerse, type Verse } from "@/lib/verses";
import { hasMarkdown, messageText } from "@/lib/markdown-lite";
import { TESTIGOS_LETTER_EN, TESTIGOS_LETTER_ES } from "@/lib/cases/testigos-letter";

export type PreachCase = {
  id: string;
  title: string;
  who: string;
  issue: string;
  approach: string;
  points: string[];
  verseIds: string[];
  letter: string;
};

export const PREACH_CASES: PreachCase[] = [
  {
    id: "idolatria",
    title: "Idolatría",
    who: "Alguien que adora imágenes, santos, ídolos o cualquier cosa en el lugar de Dios.",
    issue: "Dios no comparte su gloria. La imagen no oye; Cristo sí.",
    approach:
      "No pelees por la estatuilla. Llévalo al primer mandamiento y a Jesús, el único mediador.",
    points: [
      "Un solo Dios. No hay otro.",
      "Prohibido hacerse imagen para adorarla.",
      "Hay un solo mediador: Jesucristo, no un santo.",
    ],
    verseIds: ["ex-20-3", "is-45-5", "1ti-2-5", "mt-4-10"],
    letter:
      "Quiero hablarte con respeto y con claridad. Dios no acepta que pongamos una imagen, un santo o cualquier cosa en su lugar. Él dice que no tendremos dioses ajenos, ni nos haremos imagen para adorar. Hay un solo mediador entre Dios y los hombres: Jesucristo. No la estatua. No el ritual. Él. Vuélvete a Cristo y sírvele a Él solo.",
  },
  {
    id: "brujeria",
    title: "Brujería y ocultismo",
    who: "Santería, hechizos, tarot, limpiezas, brujos, muertos, pactos.",
    issue: "Eso no es poder limpio. Es abominación, y ata el alma.",
    approach:
      "No discutas el ‘resultado’ del hechizo. Nombra el pecado, rompe el miedo y llama a Cristo, que es más fuerte que el diablo.",
    points: [
      "Adivinación, hechicería y consultar muertos es abominación.",
      "Hay que resistir al diablo, no negociar con él.",
      "Cristo liberta. No se mezcla el altar de Dios con el de los demonios.",
    ],
    verseIds: ["dt-18-10", "stgo-4-7", "mt-4-10", "hch-4-12"],
    letter:
      "Lo que te han vendido como protección o poder no viene de Dios. La Escritura llama abominación a la adivinación, la hechicería y el consultar a los muertos. El diablo no suelta a nadie por un pacto más. Somete tu vida a Dios, resiste al diablo, y él huirá. Jesús es el único nombre en que hay salvación. Déjalo todo y llámalo a Él.",
  },
  {
    id: "ateismo",
    title: "Ateísmo",
    who: "Quien dice que Dios no existe, o vive como si no existiera.",
    issue: "No es falta de pruebas. Es el corazón que no quiere doblarse.",
    approach:
      "No ganes un debate. Apunta a la creación, a la conciencia y a Cristo crucificado. Pregunta qué hará con su pecado.",
    points: [
      "La creación deja a todos sin excusa.",
      "Negar a Dios no borra a Dios.",
      "El evangelio no es una idea. Es una Persona que murió y resucitó.",
    ],
    verseIds: ["sal-14-1", "ro-1-20", "jn-14-6", "ro-5-8"],
    letter:
      "Sé que dices que Dios no existe. La Biblia dice que la creación misma deja al hombre sin excusa: su eterno poder se ve en lo hecho. Negarlo no lo apaga. Y el asunto no es ganar un argumento. Es que Cristo murió por pecadores, y no hay otro camino al Padre. Si estás dispuesto, míralo a Él. No a la religión. A Jesús.",
  },
  {
    id: "alcohol",
    title: "Alcohol y vicios",
    who: "Alcohólico, borrachera, drogas, cualquier cadena que manda la vida.",
    issue: "El vicio no es ‘debilidad’. Es esclavitud. Cristo lava y llena.",
    approach:
      "Sin humillar. Nombra el pecado, ofrece lavamiento y un Espíritu que llena de verdad. No prometas magia; llama al Señor.",
    points: [
      "El vino escarnece; la embriaguez es disolución.",
      "Los borrachos no heredan el reino, pero algunos ya fueron lavados.",
      "No se trata de fuerza de voluntad. Se trata de ser lleno del Espíritu.",
    ],
    verseIds: ["prv-20-1", "ef-5-18", "1co-6-11", "2co-5-17"],
    letter:
      "Esto no te lo digo para aplastarte. El alcohol y el vicio te están robando. La Palabra dice que el vino es escarnecedor y que no nos embriaguemos, sino que seamos llenos del Espíritu. Algunos eran borrachos, y ya fueron lavados en el nombre del Señor Jesús. Si alguno está en Cristo, nueva criatura es. Él puede sacarte. Llámale hoy.",
  },
  {
    id: "testigos",
    title: "Testigos de Jehová",
    who: "Quien niega que Jesús es Dios, y pone la organización en el lugar de Cristo.",
    issue: "Otro Jesús, y otra Biblia. El Verbo no es una criatura. El Verbo era Dios.",
    approach:
      "No pelees por la Watchtower. Abre el griego de Juan 1 y Juan 8. Pregunta: si el original dice «yo soy» y «el Verbo era Dios», ¿quién le cambió la Biblia?",
    points: [
      "El Nuevo Testamento se escribió en griego. Ahí no dice «un dios».",
      "Insertan Jehová en el NT donde los manuscritos dicen Señor.",
      "El Verbo era Dios. Antes que Abraham, Jesús dijo: Yo soy.",
      "No hay salvación en una organización. Hay un solo nombre.",
    ],
    verseIds: ["jn-1-1", "jn-8-58", "col-2-9", "hch-4-12"],
    letter: TESTIGOS_LETTER_ES,
  },
  {
    id: "mormones",
    title: "Mormones",
    who: "Santos de los Últimos Días: otro evangelio, otros dioses, otro Jesús.",
    issue: "Un ángel trajo otro evangelio. Dios no fue formado, ni lo será.",
    approach:
      "Gálatas 1 cierra el caso del ‘evangelio extra’. Isaías cierra el caso de muchos dioses. Cristo no es un hombre exaltado.",
    points: [
      "Antes de Jehová no fue formado Dios, ni lo será después.",
      "Si un ángel anuncia otro evangelio, sea anatema.",
      "Hay un solo mediador, no un sistema de exaltación.",
      "La gracia salva. No el progreso a ser dios.",
    ],
    verseIds: ["is-43-10", "gal-1-8", "1ti-2-5", "ef-2-8"],
    letter:
      "Te hablo con amor, no para pelear. El Libro de Mormón y la exaltación a dioses es otro evangelio. Pablo dijo: si aun un ángel anunciare otro evangelio, sea anatema. Jehová dice: antes de mí no fue formado Dios, ni lo será después de mí. No hay muchos dioses. Hay un solo mediador: Jesucristo. Por gracia sois salvos, por medio de la fe, no por obras ni por linaje. Vuélvete a este Cristo, el de las Escrituras.",
  },
  {
    id: "metodistas",
    title: "Iglesia que suaviza la doctrina",
    who: "Metodista liberal u otra iglesia que acomoda la Biblia a la cultura.",
    issue: "Cuando no sufren la sana doctrina, se amontonan maestros y se vuelve a las fábulas.",
    approach:
      "No ataques el nombre de la denominación. Pregunta si la Escritura manda, o la época. Llama al nuevo nacimiento, no a una ética social.",
    points: [
      "Toda la Escritura es inspirada y sirve para redargüir, no para votarse.",
      "Vendrá tiempo cuando no sufrirán la sana doctrina.",
      "El que no naciere de nuevo no puede ver el reino.",
      "Jesús es el único camino. La iglesia no puede abrir otro.",
    ],
    verseIds: ["2ti-3-16", "2ti-4-3", "jn-3-3", "jn-14-6"],
    letter:
      "Hay iglesias con nombre cristiano que ya no sufren la sana doctrina. Acomodan el pecado y suavizan a Cristo. Toda la Escritura es inspirada por Dios, útil para redargüir y corregir. No se actualiza con la cultura. Jesús dijo: el que no naciere de nuevo, no puede ver el reino de Dios. Él es el camino, la verdad y la vida. No basta ser buena persona ni miembro de una iglesia. Hay que nacer de nuevo y obedecer la Palabra.",
  },
  {
    id: "religion",
    title: "Religión sin Cristo",
    who: "Muy de iglesia, de reglas y de nombre, pero sin nuevo nacimiento.",
    issue: "La religión no salva. Otro evangelio también puede usar el nombre de Jesús.",
    approach:
      "Afirma su seriedad, y clava Juan 3. Nicodemo era religioso. Le faltaba nacer de nuevo.",
    points: [
      "Hay quien predica otro Jesús y se le tolera.",
      "Nacer de nuevo no es mejorar. Es vida nueva.",
      "Por gracia, no por obras.",
    ],
    verseIds: ["jn-3-3", "2co-11-4", "ef-2-8", "hch-4-12"],
    letter:
      "Se puede ser muy religioso y estar perdido. Nicodemo conocía la ley, y Jesús le dijo que debía nacer de nuevo. Hay quien predica otro Jesús, y se le tolera. La salvación no es por obras ni por iglesia. Es por gracia, por medio de la fe, en el único nombre dado a los hombres: Jesucristo. No te apoyes en tu religión. Apóyate en Él.",
  },
];

const CASES_EN: Record<
  string,
  Pick<PreachCase, "title" | "who" | "issue" | "approach" | "points" | "letter">
> = {
  idolatria: {
    title: "Idolatry",
    who: "Someone who worships images, saints, idols, or anything in the place of God.",
    issue: "God does not share His glory. The image does not hear; Christ does.",
    approach:
      "Do not fight over the statue. Take them to the first commandment and to Jesus, the only mediator.",
    points: [
      "One God. There is no other.",
      "It is forbidden to make an image to worship it.",
      "There is one mediator: Jesus Christ, not a saint.",
    ],
    letter:
      "I want to speak to you with respect and with clarity. God does not accept that we put an image, a saint, or anything else in His place. He says we shall have no other gods, nor make an image to worship. There is one mediator between God and men: Jesus Christ. Not the statue. Not the ritual. Him. Turn to Christ and serve Him alone.",
  },
  brujeria: {
    title: "Witchcraft and the occult",
    who: "Santería, spells, tarot, cleansings, sorcerers, the dead, pacts.",
    issue: "That is not clean power. It is an abomination, and it binds the soul.",
    approach:
      "Do not argue the ‘result’ of the spell. Name the sin, break the fear, and call on Christ, who is stronger than the devil.",
    points: [
      "Divination, sorcery, and consulting the dead is an abomination.",
      "Resist the devil; do not bargain with him.",
      "Christ sets free. You cannot mix the altar of God with the altar of demons.",
    ],
    letter:
      "What they sold you as protection or power does not come from God. Scripture calls divination, sorcery, and consulting the dead an abomination. The devil does not let anyone go for one more pact. Submit your life to God, resist the devil, and he will flee. Jesus is the only name in which there is salvation. Leave it all and call on Him.",
  },
  ateismo: {
    title: "Atheism",
    who: "Someone who says God does not exist, or lives as if He did not.",
    issue: "It is not a lack of proof. It is a heart that will not bow.",
    approach:
      "Do not win a debate. Point to creation, to conscience, and to Christ crucified. Ask what they will do with their sin.",
    points: [
      "Creation leaves everyone without excuse.",
      "Denying God does not erase God.",
      "The gospel is not an idea. It is a Person who died and rose.",
    ],
    letter:
      "I know you say God does not exist. The Bible says creation itself leaves man without excuse: His eternal power is seen in what was made. Denying Him does not put Him out. And the issue is not winning an argument. It is that Christ died for sinners, and there is no other way to the Father. If you are willing, look at Him. Not at religion. At Jesus.",
  },
  alcohol: {
    title: "Alcohol and addictions",
    who: "The alcoholic, drunkenness, drugs, any chain that rules the life.",
    issue: "Addiction is not ‘weakness.’ It is slavery. Christ washes and fills.",
    approach:
      "Without humiliating. Name the sin, offer washing, and a Spirit who truly fills. Do not promise magic; call on the Lord.",
    points: [
      "Wine is a mocker; drunkenness is excess.",
      "Drunkards do not inherit the kingdom, but some have already been washed.",
      "It is not willpower. It is being filled with the Spirit.",
    ],
    letter:
      "I am not saying this to crush you. Alcohol and addiction are stealing from you. The Word says wine is a mocker, and that we should not be drunk, but filled with the Spirit. Some were drunkards, and they have already been washed in the name of the Lord Jesus. If anyone is in Christ, he is a new creature. He can take you out. Call on Him today.",
  },
  testigos: {
    title: "Jehovah’s Witnesses",
    who: "Someone who denies that Jesus is God, and puts the organization in the place of Christ.",
    issue: "Another Jesus, and another Bible. The Word is not a creature. The Word was God.",
    approach:
      "Do not fight about the Watchtower. Open the Greek of John 1 and John 8. Ask: if the original says «I am» and «the Word was God», who changed their Bible?",
    points: [
      "The New Testament was written in Greek. It does not say «a god».",
      "They insert Jehovah in the NT where the manuscripts say Lord.",
      "The Word was God. Before Abraham, Jesus said: I am.",
      "There is no salvation in an organization. There is one name.",
    ],
    letter: TESTIGOS_LETTER_EN,
  },
  mormones: {
    title: "Mormons",
    who: "Latter-day Saints: another gospel, other gods, another Jesus.",
    issue: "An angel brought another gospel. God was not formed, nor shall He be.",
    approach:
      "Galatians 1 closes the case of the ‘extra gospel’. Isaiah closes the case of many gods. Christ is not an exalted man.",
    points: [
      "Before the LORD no God was formed, nor shall there be after Him.",
      "If an angel announces another gospel, let him be accursed.",
      "There is one mediator, not a system of exaltation.",
      "Grace saves. Not progress toward becoming a god.",
    ],
    letter:
      "I speak with love, not to fight. The Book of Mormon and exaltation to gods is another gospel. Paul said: if even an angel preach another gospel, let him be accursed. The LORD says: before me there was no God formed, neither shall there be after me. There are not many gods. There is one mediator: Jesus Christ. By grace you are saved, through faith, not by works or lineage. Turn to this Christ, the Christ of the Scriptures.",
  },
  metodistas: {
    title: "A church that softens doctrine",
    who: "A liberal Methodist church, or any church that fits the Bible to the culture.",
    issue: "When they will not endure sound doctrine, they heap teachers and turn to fables.",
    approach:
      "Do not attack the name of the denomination. Ask whether Scripture commands, or the age. Call to new birth, not to a social ethic.",
    points: [
      "All Scripture is inspired and serves to reprove, not to be voted on.",
      "The time will come when they will not endure sound doctrine.",
      "Except a man be born again, he cannot see the kingdom.",
      "Jesus is the only way. The church cannot open another.",
    ],
    letter:
      "There are churches with a Christian name that no longer endure sound doctrine. They accommodate sin and soften Christ. All Scripture is given by inspiration of God, profitable for reproof and correction. It is not updated by the culture. Jesus said: except a man be born again, he cannot see the kingdom of God. He is the way, the truth, and the life. It is not enough to be a good person or a church member. You must be born again and obey the Word.",
  },
  religion: {
    title: "Religion without Christ",
    who: "Very much of church, of rules and of a name, but without new birth.",
    issue: "Religion does not save. Another gospel can also use the name of Jesus.",
    approach:
      "Affirm their seriousness, and drive John 3. Nicodemus was religious. He still needed to be born again.",
    points: [
      "Some preach another Jesus, and it is tolerated.",
      "To be born again is not to improve. It is new life.",
      "By grace, not by works.",
    ],
    letter:
      "You can be very religious and still be lost. Nicodemus knew the law, and Jesus told him he must be born again. Some preach another Jesus, and it is tolerated. Salvation is not by works or by church. It is by grace, through faith, in the only name given among men: Jesus Christ. Do not rest on your religion. Rest on Him.",
  },
};

export function localizedCase(entry: PreachCase, locale: Locale): PreachCase {
  if (locale !== "en") return entry;
  const en = CASES_EN[entry.id];
  if (!en) return entry;
  return { ...entry, ...en };
}

export function caseVerses(entry: PreachCase, locale: Locale = "es") {
  return entry.verseIds
    .map((id) => getVerseById(id))
    .filter((verse): verse is Verse => Boolean(verse))
    .map((verse) => localizeVerse(verse, locale));
}

export async function composeCaseText(entry: PreachCase, locale: Locale = "es") {
  const localized = localizedCase(entry, locale);
  if (hasMarkdown(localized.letter)) return messageText(localized.letter);
  const hydrated = await hydrateVerses(caseVerses(entry, locale), locale);
  const lines = [localized.letter, ""];
  for (const verse of hydrated) {
    lines.push(`«${verse.text}»`);
    lines.push(`— ${verse.ref}`);
    lines.push("");
  }
  return lines.join("\n").trim();
}

/**
 * A few lines about the case for places with no room for the whole message
 * (a topic reply): the message itself when short, else its summary.
 */
export function caseBrief(entry: PreachCase): string {
  return hasMarkdown(entry.letter) ? `${entry.issue} ${entry.approach}` : entry.letter;
}

export async function caseMessageVerse(
  entry: PreachCase,
  locale: Locale = "es",
): Promise<Verse> {
  const localized = localizedCase(entry, locale);
  return {
    id: `caso-${entry.id}`,
    ref: localized.title,
    book: t(locale, "preachFor"),
    text: await composeCaseText(entry, locale),
    themes: ["evangelio"],
    source: recobroSource(locale),
  };
}
