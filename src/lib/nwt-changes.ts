import type { Locale } from "@/lib/i18n";
import type { Verse } from "@/lib/verses";

export type NwtChange = {
  id: string;
  ref: string;
  language: string;
  original: string;
  spoken: string;
  meaning: string;
  reina: string;
  nwt: string;
  change: string;
};

export const NWT_SYSTEM = [
  "El Nuevo Testamento se escribió en griego koiné. El Antiguo, casi todo en hebreo (y algo en arameo). Ningún manuscrito griego del Nuevo Testamento trae el Tetragrámaton (YHWH).",
  "La Traducción del Nuevo Mundo inserta «Jehová» unas 237 veces en el Nuevo Testamento donde el griego dice κύριος (Señor) o θεός (Dios).",
  "Bajan a Jesús de Dios a «un dios» creado, y al Espíritu Santo de Persona a «fuerza activa».",
];

export const NWT_CHANGES: NwtChange[] = [
  {
    id: "jn-1-1",
    ref: "Juan 1:1",
    language: "Griego koiné",
    original: "καὶ θεὸς ἦν ὁ λόγος",
    spoken: "kai theòs ēn ho lógos",
    meaning:
      "El Verbo era Dios. θεὸς sin artículo, delante del verbo, habla de la naturaleza: no «un dios» menor, sino lo que Dios es. En griego no hay artículo indefinido «un». Juan 1:3 dice que nada de lo hecho se hizo sin Él: si el Verbo fuera creado, se habría creado a sí mismo.",
    reina: "En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios.",
    nwt: "En el principio la Palabra existía, la Palabra estaba con Dios, y la Palabra era un dios.",
    change: "Añaden «un» y ponen «dios» en minúscula. El original no dice eso.",
  },
  {
    id: "jn-8-58",
    ref: "Juan 8:58",
    language: "Griego koiné",
    original: "πρὶν Ἀβραὰμ γενέσθαι ἐγὼ εἰμί",
    spoken: "prìn Abraàm genésthai egṑ eimí",
    meaning:
      "«Antes que Abraham existiera, Yo soy.» ἐγὼ εἰμί es presente de existencia, el mismo nombre con el que Dios se reveló (Éxodo 3:14, LXX: ἐγώ εἰμι). No es «yo he sido». Por eso quisieron apedrearlo: se identificó con Jehová.",
    reina: "Jesús les dijo: De cierto, de cierto os digo: Antes que Abraham fuese, yo soy.",
    nwt: "Muy verdaderamente les digo: Antes de que Abraham llegara a existir, yo he sido.",
    change: "Cambian «yo soy» por «yo he sido» para que Jesús no diga el nombre de Dios.",
  },
  {
    id: "col-1-16",
    ref: "Colosenses 1:16",
    language: "Griego koiné",
    original: "ὅτι ἐν αὐτῷ ἐκτίσθη τὰ πάντα",
    spoken: "hóti en autōi ektísthē tà pánta",
    meaning:
      "En Él fueron creadas todas las cosas. τὰ πάντα = la totalidad. No hay «otras» ni «lo demás». Primogénito (πρωτότοκος) es rango, no «el primero fabricado».",
    reina:
      "Porque en él fueron creadas todas las cosas, las que hay en los cielos y las que hay en la tierra, visibles e invisibles; sean tronos, sean dominios, sean principados, sean potestades; todo fue creado por medio de él y para él.",
    nwt: "Porque por medio de él todo lo demás fue creado… Todo lo demás ha sido creado mediante él y para él.",
    change:
      "Insertan «otras» / «lo demás», que no está en el griego, para hacer de Jesús una criatura que creó el resto.",
  },
  {
    id: "col-2-9",
    ref: "Colosenses 2:9",
    language: "Griego koiné",
    original: "ὅτι ἐν αὐτῷ κατοικεῖ πᾶν τὸ πλήρωμα τῆς θεότητος σωματικῶς",
    spoken: "hóti en autōi katoikeî pân tò plḗrōma tês theótētos sōmatikôs",
    meaning:
      "En Él habita corporalmente toda la plenitud de la Deidad. θεότης es la esencia de Dios, no una «cualidad divina» de una criatura.",
    reina: "Porque en él habita corporalmente toda la plenitud de la Deidad.",
    nwt: "Porque en él mora corporalmente toda la plenitud de la cualidad divina.",
    change: "«Deidad» baja a «cualidad divina». El original habla de quién es, no de un atributo prestado.",
  },
  {
    id: "heb-1-8",
    ref: "Hebreos 1:8",
    language: "Griego koiné",
    original: "ὁ θρόνος σου ὁ θεός εἰς τὸν αἰῶνα τοῦ αἰῶνος",
    spoken: "ho thrónos sou ho theós eis tòn aiôna toû aiônos",
    meaning:
      "El Padre le dice al Hijo: «Tu trono, oh Dios, es por los siglos.» ὁ θεός es vocativo: se dirige al Hijo como Dios. Cita del Salmo 45:6.",
    reina: "Mas del Hijo dice: Tu trono, oh Dios, por el siglo del siglo.",
    nwt: "Pero con respecto al Hijo: Dios es tu trono para siempre jamás.",
    change: "Voltean la frase para que el Hijo no sea llamado Dios, sino que Dios sea su trono.",
  },
  {
    id: "tit-2-13",
    ref: "Tito 2:13",
    language: "Griego koiné",
    original: "τοῦ μεγάλου θεοῦ καὶ σωτῆρος ἡμῶν Ἰησοῦ Χριστοῦ",
    spoken: "toû megálou theoû kaì sōtêros hēmôn Iēsoû Christoû",
    meaning:
      "Regla de Granville Sharp: un artículo y dos títulos unidos por «y» = una sola Persona. Jesús es nuestro gran Dios y Salvador. Lo mismo en 2 Pedro 1:1.",
    reina: "Aguardando la esperanza bienaventurada y la manifestación gloriosa de nuestro gran Dios y Salvador Jesucristo.",
    nwt: "Mientras esperamos la feliz esperanza y la gloriosa manifestación del gran Dios y de nuestro Salvador, Jesucristo.",
    change: "Parten a dos personas: «el gran Dios» y, aparte, «nuestro Salvador». El griego no lo parte.",
  },
  {
    id: "2pe-1-1",
    ref: "2 Pedro 1:1",
    language: "Griego koiné",
    original: "τοῦ θεοῦ ἡμῶν καὶ σωτῆρος Ἰησοῦ Χριστοῦ",
    spoken: "toû theoû hēmôn kaì sōtêros Iēsoû Christoû",
    meaning: "Otra vez Sharp: nuestro Dios y Salvador, Jesucristo. Una Persona.",
    reina: "A los que habéis alcanzado, por la justicia de nuestro Dios y Salvador Jesucristo, una fe igualmente preciosa que la nuestra.",
    nwt: "A los que han obtenido una fe… por la justicia de nuestro Dios y del Salvador Jesucristo.",
    change: "Añaden «del» para separar a Dios y al Salvador. El artículo único del griego no lo permite.",
  },
  {
    id: "jn-20-28",
    ref: "Juan 20:28",
    language: "Griego koiné",
    original: "ὁ κύριός μου καὶ ὁ θεός μου",
    spoken: "ho kýrios mou kaì ho theós mou",
    meaning:
      "Tomás le dice a Jesús: «Señor mío y Dios mío.» Se lo dirige a Él (εἶπεν αὐτῷ). Jesús no lo corrige; lo bendice por creer.",
    reina: "Entonces Tomás respondió y le dijo: ¡Señor mío, y Dios mío!",
    nwt: "En respuesta, Tomás le dijo: «¡Mi Señor y mi Dios!».",
    change:
      "Aquí no pueden cambiar las palabras, así que enseñan que Tomás miraba al cielo. El texto dice que se lo dijo a Jesús.",
  },
  {
    id: "hch-20-28",
    ref: "Hechos 20:28",
    language: "Griego koiné",
    original: "τὴν ἐκκλησίαν τοῦ θεοῦ, ἣν περιεποιήσατο διὰ τοῦ αἵματος τοῦ ἰδίου",
    spoken: "tḕn ekklēsían toû theoû, hḕn periepoiḗsato dià toû haímatos toû idíou",
    meaning:
      "La iglesia de Dios, la cual Él ganó con su propia sangre. τοῦ ἰδίου señala la sangre de Dios mismo: el Hijo es Dios y derramó sangre.",
    reina: "Para apacentar la iglesia del Señor, la cual él ganó por su propia sangre.",
    nwt: "Para pastorear la congregación de Dios, que él compró con la sangre de su propio Hijo.",
    change: "Añaden «Hijo», que no está en el griego, para que Dios no tenga sangre.",
  },
  {
    id: "fil-2-6",
    ref: "Filipenses 2:6",
    language: "Griego koiné",
    original: "ὃς ἐν μορφῇ θεοῦ ὑπάρχων οὐχ ἁρπαγμὸν ἡγήσατο τὸ εἶναι ἴσα θεῷ",
    spoken: "hòs en morphêi theoû hypárchōn ouch harpagmòn hēgḗsato tò eînai ísa theōi",
    meaning:
      "Existiendo en forma de Dios, no consideró el ser igual a Dios como algo a qué aferrarse (para explotarlo), sino que se despojó. La igualdad ya era suya; se humilló.",
    reina:
      "El cual, siendo en forma de Dios, no estimó el ser igual a Dios como cosa a que aferrarse.",
    nwt: "Quien, aunque existía en la forma de Dios, no dio consideración a una usurpación, a saber, que debiera ser igual a Dios.",
    change: "Hacen que Jesús no quiera ser igual a Dios, como si nunca lo hubiera sido.",
  },
  {
    id: "heb-1-6",
    ref: "Hebreos 1:6",
    language: "Griego koiné",
    original: "καὶ προσκυνησάτωσαν αὐτῷ πάντες ἄγγελοι θεοῦ",
    spoken: "kaì proskynēsátōsan autōi pántes ángeloi theoû",
    meaning:
      "Todos los ángeles de Dios adórenle. προσκυνέω es el mismo verbo de adorar a Dios (Mateo 4:10). El Hijo recibe adoración que solo Dios puede recibir.",
    reina: "Y otra vez, cuando introduce al Primogénito en el mundo, dice: Adórenle todos los ángeles de Dios.",
    nwt: "Y nuevamente, cuando introduce a su Primogénito en la tierra habitada, dice: «Y que todos los ángeles de Dios le rindan homenaje».",
    change: "Cuando el verbo cae sobre Jesús, lo bajan a «homenaje». Cuando cae sobre Jehová, dicen «adorar».",
  },
  {
    id: "jn-1-3",
    ref: "Juan 1:3",
    language: "Griego koiné",
    original: "πάντα δι’ αὐτοῦ ἐγένετο, καὶ χωρὶς αὐτοῦ ἐγένετο οὐδὲ ἕν ὃ γέγονεν",
    spoken: "pánta di’ autoû egéneto, kaì chōrìs autoû egéneto oudè hén hò gégonen",
    meaning:
      "Todas las cosas fueron hechas por medio de Él, y sin Él nada de lo que ha sido hecho fue hecho. Si el Verbo fuera una de las cosas hechas, este verso se contradice.",
    reina: "Todas las cosas por él fueron hechas, y sin él nada de lo que ha sido hecho, fue hecho.",
    nwt: "Todas las cosas vinieron a existir por medio de él, y sin él ni siquiera una cosa llegó a existir.",
    change:
      "Aquí el griego los obliga, por eso el cambio lo hacen en Colosenses 1:16, metiendo «lo demás».",
  },
  {
    id: "lc-23-43",
    ref: "Lucas 23:43",
    language: "Griego koiné",
    original: "ἀμήν σοι λέγω, σήμερον μετ’ ἐμοῦ ἔσῃ ἐν τῷ παραδείσῳ",
    spoken: "amḗn soi légō, sḗmeron met’ emoû ésēi en tôi paradeísōi",
    meaning:
      "El griego no traía comas. σήμερον («hoy») modifica de modo natural a «estarás conmigo». El ladrón está con Cristo ese día. No hay sueño del alma.",
    reina: "De cierto te digo que hoy estarás conmigo en el paraíso.",
    nwt: "Te digo hoy: Estarás conmigo en el Paraíso.",
    change: "Mueven la coma (que no existía) para negar que el muerto esté con Cristo hoy.",
  },
  {
    id: "mt-25-46",
    ref: "Mateo 25:46",
    language: "Griego koiné",
    original: "καὶ ἀπελεύσονται οὗτοι εἰς κόλασιν αἰώνιον",
    spoken: "kaì apeleúsontai hoûtoi eis kólasin aiṓnion",
    meaning:
      "Estos irán al castigo eterno. αἰώνιον es el mismo adjetivo de «vida eterna» en la misma frase. Si la vida es eterna, el castigo también.",
    reina: "E irán éstos al castigo eterno, y los justos a la vida eterna.",
    nwt: "Y estos se irán al cortamiento eterno, pero los justos a la vida eterna.",
    change: "«Castigo eterno» lo hacen «cortamiento» para negar el infierno.",
  },
  {
    id: "jn-16-13",
    ref: "Juan 16:13",
    language: "Griego koiné",
    original: "ὅταν δὲ ἔλθῃ ἐκεῖνος, τὸ πνεῦμα τῆς ἀληθείας",
    spoken: "hótan dè élthēi ekeînos, tò pneûma tês alētheías",
    meaning:
      "πνεῦμα es neutro, pero Juan usa ἐκεῖνος, masculino: «cuando Él venga». El Espíritu Santo es Persona, no una fuerza.",
    reina: "Pero cuando venga el Espíritu de verdad, él os guiará a toda la verdad.",
    nwt: "Sin embargo, cuando llegue ese, el espíritu de la verdad, él los guiará a toda la verdad.",
    change:
      "En su doctrina el espíritu santo es «fuerza activa» impersonal. El pronombre de Juan no es de una fuerza.",
  },
  {
    id: "jehova-nt",
    ref: "El nombre en el Nuevo Testamento",
    language: "Griego koiné (todos los manuscritos)",
    original: "κύριος / θεός",
    spoken: "kýrios / theós",
    meaning:
      "Los manuscritos griegos del NT dicen Señor o Dios. El Tetragrámaton no aparece en ellos. Donde el NT cita al AT, los apóstoles escribieron κύριος, no YHWH. Jesús es el Señor sobre el que se invoca (Romanos 10:13 cita Joel 2:32).",
    reina: "Y todo aquel que invocare el nombre del Señor, será salvo. (Romanos 10:13)",
    nwt: "Porque todo el que invoque el nombre de Jehová será salvo. (Romanos 10:13, TNM)",
    change:
      "Ponen «Jehová» unas 237 veces en el NT. Así apartan de Jesús el nombre que el griego le da como Señor.",
  },
  {
    id: "is-43-10",
    ref: "Isaías 43:10",
    language: "Hebreo bíblico",
    original: "לְפָנַי לֹא־נוֹצַר אֵל וְאַחֲרַי לֹא יִהְיֶה",
    spoken: "lefanái lo-notsár El veacharai lo yihyéh",
    meaning:
      "Antes de mí no fue formado dios alguno, ni lo será después. Si Juan 1:1 dijera «un dios», Isaías lo prohibiría. Jehová no deja espacio para un segundo dios.",
    reina:
      "Antes de mí no fue formado dios, ni lo será después de mí.",
    nwt: "Antes de mí no fue formado ningún Dios, y después de mí continúa sin que lo haya.",
    change:
      "El hebreo cierra el caso: no hay «un dios» al lado de Jehová. Su Juan 1:1 choca con su propio Isaías.",
  },
  {
    id: "stauros",
    ref: "La cruz (σταυρός)",
    language: "Griego koiné",
    original: "σταυρός / σταυρόω",
    spoken: "staurós / stauróō",
    meaning:
      "σταυρός es el madero de ejecución. En el siglo I romano incluía el palo transversal. El escándalo del evangelio es Cristo crucificado (1 Corintios 1:23), no un símbolo que hay que borrar.",
    reina: "Mas nosotros predicamos a Cristo crucificado. (1 Corintios 1:23)",
    nwt: "Nosotros predicamos a Cristo en el madero. / madero de tormento.",
    change:
      "Quitan la cruz y ponen «madero de tormento» para marcar distancia con la iglesia, no porque el griego lo exija.",
  },
];

export const NWT_SYSTEM_EN = [
  "The New Testament was written in Koine Greek. The Old Testament is almost entirely Hebrew (with some Aramaic). No Greek manuscript of the New Testament carries the Tetragrammaton (YHWH).",
  "The New World Translation inserts «Jehovah» about 237 times in the New Testament where the Greek says κύριος (Lord) or θεός (God).",
  "They lower Jesus from God to a created «a god», and the Holy Spirit from a Person to an «active force».",
];

type NwtLocaleCopy = Pick<NwtChange, "ref" | "language" | "meaning" | "reina" | "nwt" | "change">;

const NWT_EN: Record<string, NwtLocaleCopy> = {
  "jn-1-1": {
    ref: "John 1:1",
    language: "Koine Greek",
    meaning:
      "The Word was God. θεὸς without the article, before the verb, speaks of nature: not a lesser «a god», but what God is. Greek has no indefinite article «a». John 1:3 says that nothing that was made was made without Him: if the Word were created, He would have created Himself.",
    reina: "In the beginning was the Word, and the Word was with God, and the Word was God.",
    nwt: "In the beginning was the Word, and the Word was with God, and the Word was a god.",
    change: "They add «a» and put «god» in lowercase. The original does not say that.",
  },
  "jn-8-58": {
    ref: "John 8:58",
    language: "Koine Greek",
    meaning:
      "«Before Abraham was, I am.» ἐγὼ εἰμί is a present of existence, the same name with which God revealed Himself (Exodus 3:14, LXX: ἐγώ εἰμι). It is not «I have been». That is why they wanted to stone Him: He identified Himself with Jehovah.",
    reina: "Jesus said unto them, Verily, verily, I say unto you, Before Abraham was, I am.",
    nwt: "Most truly I say to you, before Abraham came into existence, I have been.",
    change: "They change «I am» to «I have been» so that Jesus does not speak the name of God.",
  },
  "col-1-16": {
    ref: "Colossians 1:16",
    language: "Koine Greek",
    meaning:
      "In Him were all things created. τὰ πάντα = the totality. There is no «other» and no «the rest». Firstborn (πρωτότοκος) is rank, not «the first one manufactured».",
    reina:
      "For by him were all things created, that are in heaven, and that are in earth, visible and invisible, whether they be thrones, or dominions, or principalities, or powers: all things were created by him, and for him.",
    nwt: "Because by means of him all other things were created… All other things have been created through him and for him.",
    change:
      "They insert «other», which is not in the Greek, to make Jesus a creature who created the rest.",
  },
  "col-2-9": {
    ref: "Colossians 2:9",
    language: "Koine Greek",
    meaning:
      "In Him dwells all the fullness of the Godhead bodily. θεότης is the essence of God, not a «divine quality» of a creature.",
    reina: "For in him dwelleth all the fulness of the Godhead bodily.",
    nwt: "Because it is in him that all the fullness of the divine quality dwells bodily.",
    change: "«Godhead» is lowered to «divine quality». The original speaks of who He is, not a borrowed attribute.",
  },
  "heb-1-8": {
    ref: "Hebrews 1:8",
    language: "Koine Greek",
    meaning:
      "The Father says to the Son: «Thy throne, O God, is for ever and ever.» ὁ θεός is vocative: He addresses the Son as God. It cites Psalm 45:6.",
    reina: "But unto the Son he saith, Thy throne, O God, is for ever and ever.",
    nwt: "But about the Son: God is your throne forever and ever.",
    change: "They reverse the phrase so the Son is not called God, but God is His throne.",
  },
  "tit-2-13": {
    ref: "Titus 2:13",
    language: "Koine Greek",
    meaning:
      "Granville Sharp’s rule: one article and two titles joined by «and» = one Person. Jesus is our great God and Savior. The same in 2 Peter 1:1.",
    reina: "Looking for that blessed hope, and the glorious appearing of the great God and our Saviour Jesus Christ.",
    nwt: "While we wait for the happy hope and glorious manifestation of the great God and of our Savior, Jesus Christ.",
    change: "They split it into two persons: «the great God» and, separately, «our Savior». The Greek does not split it.",
  },
  "2pe-1-1": {
    ref: "2 Peter 1:1",
    language: "Koine Greek",
    meaning: "Sharp again: our God and Savior, Jesus Christ. One Person.",
    reina: "To them that have obtained like precious faith with us through the righteousness of God and our Saviour Jesus Christ.",
    nwt: "To those who have acquired a faith… by the righteousness of our God and the Savior Jesus Christ.",
    change: "They add a separator so God and the Savior are two. The single Greek article does not allow it.",
  },
  "jn-20-28": {
    ref: "John 20:28",
    language: "Koine Greek",
    meaning:
      "Thomas says to Jesus: «My Lord and my God.» He says it to Him (εἶπεν αὐτῷ). Jesus does not correct him; He blesses him for believing.",
    reina: "And Thomas answered and said unto him, My Lord and my God.",
    nwt: "In answer Thomas said to him: «My Lord and my God!»",
    change:
      "Here they cannot change the words, so they teach that Thomas was looking to heaven. The text says he said it to Jesus.",
  },
  "hch-20-28": {
    ref: "Acts 20:28",
    language: "Koine Greek",
    meaning:
      "The church of God, which He purchased with His own blood. τοῦ ἰδίου points to the blood of God Himself: the Son is God and shed blood.",
    reina: "To feed the church of God, which he hath purchased with his own blood.",
    nwt: "To shepherd the congregation of God, which he purchased with the blood of his own Son.",
    change: "They add «Son», which is not in the Greek, so that God would not have blood.",
  },
  "fil-2-6": {
    ref: "Philippians 2:6",
    language: "Koine Greek",
    meaning:
      "Existing in the form of God, He did not consider equality with God something to cling to (to exploit), but emptied Himself. The equality was already His; He humbled Himself.",
    reina: "Who, being in the form of God, thought it not robbery to be equal with God.",
    nwt: "Who, although he was existing in God’s form, gave no consideration to a seizure, namely, that he should be equal to God.",
    change: "They make it so Jesus does not want to be equal with God, as if He never had been.",
  },
  "heb-1-6": {
    ref: "Hebrews 1:6",
    language: "Koine Greek",
    meaning:
      "Let all the angels of God worship Him. προσκυνέω is the same verb for worshiping God (Matthew 4:10). The Son receives worship that only God can receive.",
    reina: "And again, when he bringeth in the firstbegotten into the world, he saith, And let all the angels of God worship him.",
    nwt: "But when he again brings his Firstborn into the inhabited earth, he says: «And let all of God’s angels do obeisance to him».",
    change: "When the verb falls on Jesus, they lower it to «obeisance». When it falls on Jehovah, they say «worship».",
  },
  "jn-1-3": {
    ref: "John 1:3",
    language: "Koine Greek",
    meaning:
      "All things were made through Him, and without Him was not anything made that was made. If the Word were one of the things made, this verse contradicts itself.",
    reina: "All things were made by him; and without him was not any thing made that was made.",
    nwt: "All things came into existence through him, and apart from him not even one thing came into existence.",
    change:
      "Here the Greek forces them, so they make the change in Colossians 1:16, inserting «other».",
  },
  "lc-23-43": {
    ref: "Luke 23:43",
    language: "Koine Greek",
    meaning:
      "Greek had no commas. σήμερον («today») naturally modifies «you will be with me». The thief is with Christ that day. There is no soul sleep.",
    reina: "And Jesus said unto him, Verily I say unto thee, To day shalt thou be with me in paradise.",
    nwt: "Truly I tell you today, you will be with me in Paradise.",
    change: "They move the comma (which did not exist) to deny that the dead are with Christ today.",
  },
  "mt-25-46": {
    ref: "Matthew 25:46",
    language: "Koine Greek",
    meaning:
      "These shall go away into everlasting punishment. αἰώνιον is the same adjective as «eternal life» in the same sentence. If the life is eternal, the punishment is too.",
    reina: "And these shall go away into everlasting punishment: but the righteous into life eternal.",
    nwt: "These will depart into everlasting cutting-off, but the righteous ones into everlasting life.",
    change: "«Everlasting punishment» becomes «cutting-off» to deny hell.",
  },
  "jn-16-13": {
    ref: "John 16:13",
    language: "Koine Greek",
    meaning:
      "πνεῦμα is neuter, but John uses ἐκεῖνος, masculine: «when He comes». The Holy Spirit is a Person, not a force.",
    reina: "Howbeit when he, the Spirit of truth, is come, he will guide you into all truth.",
    nwt: "However, when that one comes, the spirit of the truth, he will guide you into all the truth.",
    change:
      "In their doctrine the holy spirit is an impersonal «active force». John’s pronoun is not the pronoun of a force.",
  },
  "jehova-nt": {
    ref: "The name in the New Testament",
    language: "Koine Greek (all the manuscripts)",
    meaning:
      "The Greek manuscripts of the NT say Lord or God. The Tetragrammaton does not appear in them. Where the NT quotes the OT, the apostles wrote κύριος, not YHWH. Jesus is the Lord on whom one calls (Romans 10:13 quotes Joel 2:32).",
    reina: "For whosoever shall call upon the name of the Lord shall be saved. (Romans 10:13)",
    nwt: "For everyone who calls on the name of Jehovah will be saved. (Romans 10:13, NWT)",
    change:
      "They put «Jehovah» about 237 times in the NT. That way they take from Jesus the name the Greek gives Him as Lord.",
  },
  "is-43-10": {
    ref: "Isaiah 43:10",
    language: "Biblical Hebrew",
    meaning:
      "Before me there was no God formed, neither shall there be after me. If John 1:1 said «a god», Isaiah would forbid it. Jehovah leaves no room for a second god.",
    reina: "Before me there was no God formed, neither shall there be after me.",
    nwt: "Before me there was no God formed, and after me there continued to be none.",
    change:
      "The Hebrew closes the case: there is no «a god» beside Jehovah. Their John 1:1 collides with their own Isaiah.",
  },
  stauros: {
    ref: "The cross (σταυρός)",
    language: "Koine Greek",
    meaning:
      "σταυρός is the execution timber. In the first-century Roman world it included the crossbeam. The scandal of the gospel is Christ crucified (1 Corinthians 1:23), not a symbol that must be erased.",
    reina: "But we preach Christ crucified. (1 Corinthians 1:23)",
    nwt: "We preach Christ on the stake. / torture stake.",
    change:
      "They remove the cross and put «torture stake» to mark distance from the church, not because the Greek requires it.",
  },
};

export function localizedNwt(item: NwtChange, locale: Locale): NwtChange {
  if (locale !== "en") return item;
  const en = NWT_EN[item.id];
  if (!en) return item;
  return { ...item, ...en };
}

export function nwtSystem(locale: Locale) {
  return locale === "en" ? NWT_SYSTEM_EN : NWT_SYSTEM;
}

export function composeNwtChangeText(item: NwtChange, locale: Locale = "es") {
  const row = localizedNwt(item, locale);
  if (locale === "en") {
    return [
      row.ref,
      "",
      `Original (${row.language}): ${row.original}`,
      `Read: ${row.spoken}`,
      `What it conveys: ${row.meaning}`,
      "",
      `King James: ${row.reina}`,
      `New World Translation: ${row.nwt}`,
      `The change: ${row.change}`,
    ].join("\n");
  }
  return [
    row.ref,
    "",
    `Original (${row.language}): ${row.original}`,
    `Se lee: ${row.spoken}`,
    `Lo que transmite: ${row.meaning}`,
    "",
    `Reina-Valera: ${row.reina}`,
    `Traducción del Nuevo Mundo: ${row.nwt}`,
    `El cambio: ${row.change}`,
  ].join("\n");
}

export function nwtChangeVerse(item: NwtChange, locale: Locale = "es"): Verse {
  const row = localizedNwt(item, locale);
  return {
    id: `nwt-${item.id}`,
    ref: row.ref,
    book: locale === "en" ? "Original" : "Original",
    text: composeNwtChangeText(item, locale),
    themes: ["evangelio"],
  };
}

export function composeNwtDigest(locale: Locale = "es") {
  const lines =
    locale === "en"
      ? [
          "What the New World Translation changes in the Bible:",
          "",
          ...NWT_SYSTEM_EN,
          "",
        ]
      : [
          "Lo que la Traducción del Nuevo Mundo le cambia a la Biblia:",
          "",
          ...NWT_SYSTEM,
          "",
        ];
  for (const item of NWT_CHANGES) {
    const row = localizedNwt(item, locale);
    lines.push(row.ref);
    lines.push(`Original (${row.language}): ${row.original}`);
    lines.push(locale === "en" ? `Read: ${row.spoken}` : `Se lee: ${row.spoken}`);
    lines.push(locale === "en" ? `Conveys: ${row.meaning}` : `Transmite: ${row.meaning}`);
    lines.push(
      locale === "en" ? `King James: ${row.reina}` : `Reina-Valera: ${row.reina}`,
    );
    lines.push(locale === "en" ? `NWT: ${row.nwt}` : `TNM: ${row.nwt}`);
    lines.push(locale === "en" ? `Change: ${row.change}` : `Cambio: ${row.change}`);
    lines.push("");
  }
  lines.push(
    locale === "en"
      ? "The Word was God. Call Him Lord."
      : "El Verbo era Dios. Llámalo Señor.",
  );
  return lines.join("\n").trim();
}

export function nwtDigestVerse(locale: Locale = "es"): Verse {
  return {
    id: "caso-testigos-nwt",
    ref:
      locale === "en"
        ? "Changes in the New World Translation"
        : "Cambios de la Traducción del Nuevo Mundo",
    book: locale === "en" ? "Assistant" : "Asistente",
    text: composeNwtDigest(locale),
    themes: ["evangelio"],
  };
}
