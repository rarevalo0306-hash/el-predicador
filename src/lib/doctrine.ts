import { recobroSource } from "@/lib/bible";
import { t, type Locale } from "@/lib/i18n";
import { hydrateVerses } from "@/lib/recobro";
import { getVerseById, localizeVerse, type Verse } from "@/lib/verses";

export type DoctrineSection = {
  title: string;
  body: string;
};

export type DoctrineSide = {
  name: string;
  mine?: boolean;
  line: string;
  why?: string;
  sections?: DoctrineSection[];
  biblical: string[];
  notBiblical: string[];
};

export type DoctrineTopic = {
  id: string;
  title: string;
  who: string;
  issue: string;
  sides: DoctrineSide[];
  verseIds: string[];
  letter: string;
};

export const DOCTRINE_TOPICS: DoctrineTopic[] = [
  {
    id: "identidad",
    title: "Identidad de Dios",
    who: "Cómo Dios se da a conocer, no desde una etiqueta, sino desde la Escritura.",
    issue: "Dios con el hombre → Dios entre los hombres → Dios en el hombre.",
    verseIds: [
      "heb-1-1",
      "is-7-14",
      "mt-1-23",
      "is-9-6",
      "jn-1-14",
      "col-1-15",
      "col-2-9",
      "is-45-5",
      "jn-14-16",
      "1co-3-16",
      "ro-8-9",
      "gal-4-19",
      "mt-12-30",
    ],
    letter:
      "La doctrina unicista\n\nLa doctrina unicista enseña que Dios es uno de manera absoluta. No existen tres personas divinas eternas y distintas dentro de la Deidad, sino un solo Dios, eterno, invisible y Espíritu, que se manifestó plenamente en Jesucristo para llevar a cabo la obra de redención y que hoy obra en su pueblo por medio de su Espíritu.\n\nEl unicismo no niega al Padre, al Hijo ni al Espíritu Santo. Los reconoce como términos completamente bíblicos, pero no los interpreta como tres personas divinas coeternas.\n\nEn términos sencillos:\nEl Padre es Dios en su eternidad, trascendencia y paternidad.\nEl Hijo es la verdadera humanidad en la cual ese único Dios se manifestó para nuestra salvación.\nEl Espíritu Santo es el mismo Dios obrando y habitando en su pueblo.\n\nPor eso, el unicismo enseña que Jesucristo es verdaderamente hombre y verdaderamente Dios manifestado en carne. La humanidad de Cristo podía orar, sufrir, obedecer y morir; pero la Deidad que habitaba plenamente en Él era el único Dios eterno.\n\nEsta doctrina puede resumirse en una sola declaración:\nHay un solo Dios, y ese único Dios se reveló plenamente en Jesucristo.\n\nFundamento bíblico de la doctrina unicista\n\n1. Hay un solo Dios\n\nEl punto de partida es el monoteísmo bíblico.\n\nDeuteronomio 6:4\n«Oye, Israel: Jehová nuestro Dios, Jehová uno es.»\n\nIsaías 43:10-11\n«Antes de mí no fue formado dios, ni lo será después de mí. Yo, yo Jehová, y fuera de mí no hay quien salve.»\n\nIsaías 44:6\n«Yo soy el primero, y yo soy el postrero, y fuera de mí no hay Dios.»\n\nIsaías 45:5\n«Yo soy Jehová, y ninguno más hay; no hay Dios fuera de mí.»\n\nEstos textos forman la base de la doctrina unicista. La Biblia presenta repetidamente a Dios como uno, sin otro Dios antes, después o fuera de Él.\n\n2. Dios es Espíritu e invisible\n\nLa Escritura enseña que Dios, en su naturaleza eterna, es Espíritu.\n\nJuan 4:24\n«Dios es Espíritu.»\n\nTambién es invisible.\n\n1 Timoteo 1:17\n«Al Rey de los siglos, inmortal, invisible, al único y sabio Dios...»\n\nEsto significa que Dios, por naturaleza, no depende de un cuerpo físico. Sin embargo, el Nuevo Testamento enseña que ese Dios invisible decidió darse a conocer de una manera visible.\n\n3. Dios se manifestó en carne\n\nAquí aparece una de las afirmaciones centrales del unicismo.\n\n1 Timoteo 3:16\n«Dios fue manifestado en carne.»\n\nEl texto presenta la encarnación como una manifestación de Dios. Juan expresa la misma verdad de otra manera.\n\nJuan 1:1\n«En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios.»\n\nDespués declara:\n\nJuan 1:14\n«Y aquel Verbo fue hecho carne, y habitó entre nosotros.»\n\nPara el unicismo, el Verbo no es otro Dios distinto, sino la autoexpresión eterna de Dios que se manifestó verdaderamente en humanidad.\n\n4. Jesucristo es la imagen del Dios invisible\n\nPablo dice:\n\nColosenses 1:15\n«Él es la imagen del Dios invisible.»\n\nDios es invisible, pero Jesucristo es su imagen visible. Esto significa que, al mirar a Cristo, vemos la revelación humana del Dios que por naturaleza no puede ser visto. Por eso Jesús pudo decir:\n\nJuan 14:9\n«El que me ha visto a mí, ha visto al Padre.»\n\n5. Toda la plenitud de la Deidad habita en Cristo\n\nUno de los textos más importantes es:\n\nColosenses 2:9\n«Porque en él habita corporalmente toda la plenitud de la Deidad.»\n\nEl término clave es: toda. La Escritura no dice que una parte de la Deidad habita en Cristo. Dice que toda la plenitud de la Deidad habita corporalmente en Él. Por eso el unicismo sostiene que Jesucristo es la revelación completa del único Dios.\n\n6. El Padre estaba en Cristo\n\nJesús explicó directamente la relación entre Él y el Padre.\n\nJuan 14:10\n«¿No crees que yo soy en el Padre, y el Padre en mí? ... el Padre que mora en mí, él hace las obras.»\n\nPara el unicismo, esta frase es fundamental. Jesús no está diciendo que su humanidad sea literalmente el Padre. Está diciendo que el Padre habitaba en Él.\n\nTambién:\n\n2 Corintios 5:19\n«Dios estaba en Cristo reconciliando consigo al mundo.»\n\nPor eso, el unicista entiende que Dios no estaba simplemente acompañando a Cristo desde lejos. Dios estaba en Cristo.\n\n7. ¿Quién es el Hijo?\n\nEl Hijo está relacionado con la encarnación. El ángel dijo a María:\n\nLucas 1:35\n«El Santo Ser que nacerá, será llamado Hijo de Dios.»\n\nObserve la expresión: «que nacerá». La Deidad es eterna. El Hijo, en cuanto a humanidad, nace.\n\nPor eso, el unicismo distingue entre Dios eterno, que no comenzó a existir, y el Hijo, la humanidad del Mesías nacida de María. Dios no comenzó en Belén. La humanidad del Mesías sí.\n\n8. Jesucristo es verdaderamente Dios y verdaderamente hombre\n\nLa Biblia presenta a Cristo con características humanas y divinas.\n\nComo hombre\n\nJesús nació.\nLucas 2:7\nMaría «dio a luz a su hijo primogénito».\n\nJesús tuvo hambre.\nMateo 4:2\n«Tuvo hambre.»\n\nJesús se cansó.\nJuan 4:6\n«Jesús, cansado del camino...»\n\nJesús lloró.\nJuan 11:35\n«Jesús lloró.»\n\nJesús murió.\nJuan 19:30\n«Entregó el espíritu.»\n\nComo Dios\n\nJesús perdonó pecados.\nMarcos 2:5\n«Hijo, tus pecados te son perdonados.»\n\nJesús recibió adoración.\nMateo 14:33\n«Entonces los que estaban en la barca vinieron y le adoraron.»\n\nJesús fue llamado Dios.\nJuan 20:28\n«¡Señor mío, y Dios mío!»\n\nPor eso, el unicismo enseña que Jesucristo tiene verdadera humanidad y plena Deidad.\n\n9. ¿Por qué Jesús oraba?\n\nSi Jesús es Dios, una pregunta natural es: ¿por qué oraba? El unicismo responde que Jesús era verdaderamente hombre.\n\n1 Timoteo 2:5\n«Hay un solo Dios, y un solo mediador entre Dios y los hombres, Jesucristo hombre.»\n\nComo hombre, Jesús oraba, obedecía, dependía de Dios, sufría y se sometía a la voluntad divina.\n\nPor eso sus oraciones no obligan necesariamente a concluir que una persona divina estaba hablando con otra persona divina. Pueden entenderse como la verdadera humanidad de Cristo relacionándose con Dios.\n\n10. «No se haga mi voluntad, sino la tuya»\n\nJesús oró:\n\nLucas 22:42\n«No se haga mi voluntad, sino la tuya.»\n\nEsto demuestra que Jesús tenía una verdadera voluntad humana. Ante la cruz, su humanidad experimentó angustia real. Pero esa voluntad humana se sometió perfectamente a la voluntad divina. Para el unicismo, esta escena demuestra la realidad de la encarnación.\n\n11. «El Padre mayor es que yo»\n\nJesús dijo:\n\nJuan 14:28\n«El Padre mayor es que yo.»\n\nEl unicismo entiende esta declaración desde la condición humana de Cristo. Filipenses 2:7-8 dice que Cristo «tomó forma de siervo» y «se humilló a sí mismo». Como hombre, Jesús estaba en una posición de servicio y humillación. Por eso podía decir: «El Padre mayor es que yo».\n\nSin embargo, el mismo Jesús también declaró:\n\nJuan 10:30\n«Yo y el Padre uno somos.»\n\nPor eso, la inferioridad de Juan 14:28 no se interpreta como una inferioridad de Deidad, sino como parte de la condición humana del Mesías.\n\n12. Jesús perdona pecados\n\nCuando Jesús perdonó al paralítico, los escribas preguntaron:\n\nMarcos 2:7\n«¿Quién puede perdonar pecados, sino sólo Dios?»\n\nJesús no negó que perdonar pecados fuera prerrogativa divina. Al contrario, demostró su autoridad.\n\nMarcos 2:10\n«Pues para que sepáis que el Hijo del Hombre tiene potestad en la tierra para perdonar pecados...»\n\nPara el unicismo, este pasaje revela que la autoridad de Dios estaba presente en Cristo.\n\n13. Jesús es Salvador\n\nJehová declara:\n\nIsaías 43:11\n«Yo, yo Jehová, y fuera de mí no hay quien salve.»\n\nSin embargo, el Nuevo Testamento presenta a Jesús como Salvador.\n\nTito 2:13\n«Aguardando la esperanza bienaventurada y la manifestación gloriosa de nuestro gran Dios y Salvador Jesucristo.»\n\nEl unicismo ve aquí continuidad: el único Salvador del Antiguo Testamento se revela plenamente en Jesucristo.\n\n14. «Antes que Abraham fuese, yo soy»\n\nJesús dijo:\n\nJuan 8:58\n«Antes que Abraham fuese, yo soy.»\n\nEsta declaración recuerda la revelación divina de:\n\nÉxodo 3:14\n«YO SOY EL QUE SOY.»\n\nLa humanidad de Jesús nació en el tiempo. Pero la Deidad que estaba en Él es eterna. Por eso, el unicismo entiende esta expresión como una afirmación relacionada con la identidad divina presente en Cristo.\n\n15. Jesús es Emanuel\n\nLa profecía dice:\n\nMateo 1:23\n«Y llamarás su nombre Emanuel, que traducido es: Dios con nosotros.»\n\nNo solamente «un profeta de Dios». No solamente «un mensajero de Dios». Sino: Dios con nosotros. Esta es una de las expresiones más sencillas de la doctrina de la encarnación.\n\n16. El Espíritu Santo es Dios obrando en nosotros\n\nEl unicismo no considera al Espíritu Santo como otro Dios separado. Dios es Espíritu.\n\nJuan 4:24\n«Dios es Espíritu.»\n\nPablo utiliza varias expresiones en Romanos 8.\n\nRomanos 8:9\n«Espíritu de Dios.»\nEn el mismo versículo: «Espíritu de Cristo.»\n\nRomanos 8:10\n«Pero si Cristo está en vosotros...»\n\nPara el unicismo, estas expresiones muestran una misma presencia divina actuando en el creyente.\n\nTambién:\n\n2 Corintios 3:17\n«El Señor es el Espíritu.»\n\n17. Padre, Hijo y Espíritu Santo\n\nEl unicismo acepta plenamente estos tres términos. Pero los entiende de esta manera:\n\nPadre: el único Dios en su eternidad y trascendencia.\nHijo: el único Dios manifestado en verdadera humanidad.\nEspíritu Santo: el único Dios obrando y habitando en su pueblo.\n\nEsto puede resumirse así:\nDios sobre nosotros como Padre.\nDios con nosotros en el Hijo.\nDios en nosotros por su Espíritu.\n\n18. El bautismo en el nombre de Jesús\n\nJesús ordenó:\n\nMateo 28:19\n«Bautizándolos en el nombre del Padre, y del Hijo, y del Espíritu Santo.»\n\nEl texto dice «en el nombre», en singular. Después vemos cómo los apóstoles bautizaban.\n\nHechos 2:38\n«Bautícese cada uno de vosotros en el nombre de Jesucristo.»\n\nHechos 8:16\n«Habían sido bautizados en el nombre de Jesús.»\n\nHechos 10:48\n«Mandó bautizarles en el nombre del Señor Jesús.»\n\nHechos 19:5\n«Fueron bautizados en el nombre del Señor Jesús.»\n\nEl unicismo entiende que los apóstoles estaban aplicando el mandato de Mateo 28:19 en el nombre revelado de Jesucristo.\n\n19. Dios y el Cordero en Apocalipsis\n\nApocalipsis presenta a Dios y al Cordero. El unicismo reconoce esa distinción. El Cordero representa a Jesucristo en su humanidad glorificada y en su obra redentora.\n\nPero también observe:\n\nApocalipsis 4:2\n«Un trono establecido en el cielo, y en el trono, uno sentado.»\n\nDespués:\n\nApocalipsis 22:3\n«El trono de Dios y del Cordero estará en ella.»\n\nDice «el trono», en singular. Y luego:\n\nApocalipsis 22:4\n«Verán su rostro, y su nombre estará en sus frentes.»\n\nOtra vez aparecen expresiones en singular: su rostro, su nombre. Para el unicismo, esto es coherente con la revelación del único Dios en Jesucristo.\n\nConclusión\n\nLa doctrina unicista no enseña simplemente que Jesús es importante o que representa a Dios. Enseña algo mucho más profundo: el único Dios eterno se manifestó verdaderamente en Jesucristo.\n\nEl Padre es el Dios invisible.\nEl Hijo es la manifestación humana de ese Dios para nuestra redención.\nEl Espíritu Santo es ese mismo Dios obrando en nosotros.\n\nPor eso:\n\nColosenses 2:9\n«En él habita corporalmente toda la plenitud de la Deidad.»\n\nY por eso Jesús pudo decir:\n\nJuan 14:9\n«El que me ha visto a mí, ha visto al Padre.»\n\nEl corazón de la doctrina unicista es:\nUn solo Dios.\nUna sola Deidad.\nUna manifestación perfecta en Jesucristo.",
    sides: [
      {
        name: "Nuestra visión",
        mine: true,
        line: "Un solo Dios que se revela, se acerca en Jesucristo y habita en sus hijos por su Espíritu.",
        why: "No comenzamos desde una doctrina trinitaria o unicista. Observamos cómo Dios se da a conocer en las Escrituras. El centro es Jesucristo, no una etiqueta.",
        sections: [
          {
            title: "Dios con el hombre",
            body: "Desde el principio Dios habló con los hombres, se manifestó y comunicó su voluntad por los profetas. Hebreos 1:1.",
          },
          {
            title: "Dios entre los hombres",
            body: "La revelación llega a su punto en Jesucristo: Emanuel, Dios con nosotros. El Verbo fue hecho carne. En él habita toda la plenitud de la Deidad. Un solo Dios: no hay Dios fuera de Jehová. No hacemos de Jesús un segundo Dios, ni ignoramos los textos que distinguen al Padre y al Hijo.",
          },
          {
            title: "Dios en el hombre",
            body: "Después de la obra de Cristo, Dios habita en el creyente por su Espíritu. Somos templo de Dios. El Espíritu de Dios, el Espíritu de Cristo y Cristo en nosotros, hasta que Cristo sea formado en vosotros.",
          },
        ],
        biblical: [
          "Dios habló por los profetas, y en estos días por el Hijo (Hebreos 1:1-2).",
          "Emanuel: Dios con nosotros (Isaías 7:14; Mateo 1:23).",
          "El niño es Dios Fuerte y Padre Eterno (Isaías 9:6).",
          "El Verbo fue hecho carne y habitó entre nosotros (Juan 1:14).",
          "Cristo es la imagen del Dios invisible (Colosenses 1:15).",
          "En él habita corporalmente toda la plenitud de la Deidad (Colosenses 2:9).",
          "Jehová, y ninguno más; no hay Dios fuera de mí (Isaías 45:5).",
          "El Espíritu mora con vosotros y estará en vosotros (Juan 14:17).",
          "Sois templo de Dios (1 Corintios 3:16).",
          "Espíritu de Dios, Espíritu de Cristo, Cristo en vosotros (Romanos 8:9-10).",
          "Hasta que Cristo sea formado en vosotros (Gálatas 4:19).",
        ],
        notBiblical: [
          "Comenzar por la etiqueta «trinitario» o «unicista».",
          "Hacer de Jesús un segundo Dios.",
          "Ignorar los textos que distinguen al Padre y al Hijo.",
          "Imponer una posición teológica en lugar de llamar a conocer a Cristo.",
        ],
      },
      {
        name: "Trinitario de tres personas",
        line: "Un Dios en tres personas distintas: Padre, Hijo y Espíritu.",
        biblical: [
          "En el Jordán están el Hijo, el Espíritu y la voz del Padre a la vez (Mateo 3:16-17).",
          "El Hijo ora al Padre.",
          "La gracia del Señor, el amor de Dios, la comunión del Espíritu (2 Corintios 13:14).",
        ],
        notBiblical: [
          "La palabra «personas» no aparece en la Biblia para la Deidad.",
          "Si suena a tres dioses, choca con Deuteronomio 6:4.",
        ],
      },
      {
        name: "Dios Triuno (Recobro)",
        line: "Un Dios; Padre, Hijo y Espíritu distintos, no separados; coexisten.",
        biblical: [
          "El Verbo era con Dios, y era Dios (Juan 1:1).",
          "Mateo 28:19: un nombre, y tres.",
          "El Jordán: tres a la vez.",
        ],
        notBiblical: [
          "«Coinherencia» y «Trinidad económica» son palabras de enseñanza, no el texto mismo.",
        ],
      },
    ],
  },
  {
    id: "bautismo",
    title: "El bautismo",
    who: "Primero los textos. Después la interpretación. Sin empezar por una etiqueta.",
    issue: "Arrepentimiento → fe en Jesucristo → bautismo → nueva vida en Cristo.",
    verseIds: [
      "mt-28-19",
      "hch-2-38",
      "hch-8-16",
      "hch-10-48",
      "hch-19-5",
      "ro-6-3",
      "gal-3-27",
      "col-2-12",
    ],
    letter:
      "Nuestra visión del bautismo\n\nEl bautismo en agua ocupa un lugar central en la proclamación del evangelio. Nuestra comprensión debe surgir de las palabras de Jesús y de la práctica de sus apóstoles, sin enfrentar artificialmente una contra la otra.\n\nJesús ordenó el bautismo: «Id, y haced discípulos a todas las naciones, bautizándolos en el nombre del Padre, y del Hijo, y del Espíritu Santo» (Mateo 28:19). El griego dice eis to onoma, «en el nombre», en singular. No debemos eliminar ninguna parte de Mateo 28:19. La pregunta es: ¿cómo entendieron y obedecieron los apóstoles este mandamiento?\n\nEn la primera predicación después de Pentecostés, Pedro dijo: «Arrepentíos, y bautícese cada uno de vosotros en el nombre de Jesucristo para perdón de los pecados…» (Hechos 2:38). En Samaria habían sido bautizados en el nombre de Jesús (Hechos 8:16). Pedro mandó bautizar a Cornelio en el nombre del Señor Jesús (Hechos 10:48). En Éfeso fueron bautizados en el nombre del Señor Jesús (Hechos 19:5). Cuando Lucas describe el nombre asociado al bautismo cristiano, encontramos repetidamente Jesús, Jesucristo, el Señor Jesús.\n\n¿Contradijeron los apóstoles a Mateo 28:19? Nuestra interpretación es que no. No es razonable presentar a Pedro y a los demás como desobedeciendo una orden que Jesús acababa de darles. Mateo registra el mandamiento; Hechos registra cómo lo llevaron a la práctica. Debemos estudiar la relación entre «el nombre» de Mateo 28:19 y «el nombre de Jesucristo» de Hechos 2:38.\n\nPablo profundiza: hemos sido bautizados en Cristo Jesús, en su muerte; sepultados con él por el bautismo (Romanos 6:3-4). Los bautizados en Cristo de Cristo están revestidos (Gálatas 3:27). Sepultados con él en el bautismo (Colosenses 2:12).\n\nConsiderando Mateo 28:19 y la práctica apostólica, entendemos que el bautismo cristiano está centrado en Jesucristo y que los apóstoles bautizaron identificando al creyente con el nombre de Jesús. No borramos Mateo 28:19. Lo conservamos y preguntamos por qué los mismos discípulos que recibieron aquel mandamiento bautizaron en el nombre de Jesucristo.\n\nTampoco convertimos el bautismo en una simple discusión sobre qué palabras pronuncia el ministro sobre el agua. Bíblicamente está conectado con Cristo, arrepentimiento, fe, perdón, identificación con su muerte y resurrección, y nueva vida.\n\nNo buscamos ganar una discusión. Buscamos que cada persona examine cómo Jesús lo ordenó, cómo los apóstoles lo practicaron y qué significado le da el Nuevo Testamento.",
    sides: [
      {
        name: "Nuestra visión",
        mine: true,
        line: "El bautismo cristiano está centrado en Jesucristo. Mateo 28:19 se guarda. Hechos muestra cómo lo obedecieron.",
        why: "No comenzamos diciendo «debe ser trinitario» o «debe ser en el nombre de Jesús». Primero reunimos los textos. Después formulamos la interpretación.",
        sections: [
          {
            title: "Jesús ordenó el bautismo",
            body: "Mateo 28:19: en el nombre —singular— del Padre, y del Hijo, y del Espíritu Santo. No se borra ninguna parte. La pregunta es cómo lo obedecieron los apóstoles.",
          },
          {
            title: "La práctica en Hechos",
            body: "Hechos 2:38, 8:16, 10:48 y 19:5 asocian el bautismo con el nombre de Jesús, Jesucristo o el Señor Jesús. No es un caso aislado.",
          },
          {
            title: "¿Contradijeron Mateo 28:19?",
            body: "No. Mateo registra el mandamiento; Hechos registra la práctica. No es razonable decir que Pedro desobedeció lo que Jesús acababa de mandar.",
          },
          {
            title: "Bautizados en Cristo",
            body: "Romanos 6, Gálatas 3:27 y Colosenses 2:12: identificación con su muerte, sepultura y resurrección. No es solo una frase sobre el agua.",
          },
        ],
        biblical: [
          "Bautizándolos en el nombre del Padre, y del Hijo, y del Espíritu Santo (Mateo 28:19).",
          "Eis to onoma: el nombre, en singular.",
          "Bautícese cada uno en el nombre de Jesucristo (Hechos 2:38).",
          "Bautizados en el nombre de Jesús (Hechos 8:16).",
          "Bautizarles en el nombre del Señor Jesús (Hechos 10:48).",
          "Bautizados en el nombre del Señor Jesús (Hechos 19:5).",
          "Bautizados en Cristo Jesús, en su muerte (Romanos 6:3-4).",
          "Bautizados en Cristo, de Cristo revestidos (Gálatas 3:27).",
          "Sepultados con él en el bautismo (Colosenses 2:12).",
        ],
        notBiblical: [
          "Empezar por «debe ser trinitario» o «debe ser en Jesús», antes de abrir los textos.",
          "Borrar Mateo 28:19 para sostener Hechos.",
          "Presentar a los apóstoles como desobedientes al Señor.",
          "Reducir el bautismo a una pelea sobre las palabras que se dicen sobre el agua.",
        ],
      },
      {
        name: "Fórmula de tres títulos",
        line: "Pronunciar «Padre, Hijo y Espíritu Santo» como las palabras del agua.",
        biblical: [
          "Mateo 28:19 está en la Biblia y no se elimina.",
        ],
        notBiblical: [
          "En Hechos no aparece esa frase dicha sobre el agua.",
          "Hacer de la receta el centro, y no de Cristo, el arrepentimiento y la nueva vida.",
        ],
      },
    ],
  },
  {
    id: "cena",
    title: "La Santa Cena",
    who: "Primero lo que Jesús instituyó y lo que Pablo enseña. Después las escuelas sobre los elementos.",
    issue: "Memoria, proclamación, comunión, examen y esperanza: Cristo crucificado, hasta que Él venga.",
    verseIds: ["mt-26-26", "lc-22-19", "1co-11-26", "1co-11-28", "1co-10-16"],
    letter:
      "Nuestra visión de la Santa Cena\n\nLa Cena del Señor fue instituida por Jesucristo para que sus discípulos recordaran su sacrificio, anunciaran su muerte y mantuvieran comunión como cuerpo de Cristo hasta su regreso.\n\nJesús tomó pan: «Tomad, comed; esto es mi cuerpo» (Mateo 26:26). Tomó la copa: «Esto es mi sangre del nuevo pacto, que por muchos es derramada para remisión de los pecados» (Mateo 26:27-28). «Haced esto en memoria de mí» (Lucas 22:19).\n\nPablo: todas las veces que comiereis este pan y bebiereis esta copa, la muerte del Señor anunciáis hasta que él venga (1 Corintios 11:26). El pan mira al cuerpo entregado; la copa, a su sangre y al nuevo pacto.\n\nLa Cena mira hacia atrás: recordamos la muerte de Cristo. Hacia adentro: examinamos nuestra vida. Hacia adelante: esperamos su regreso.\n\nNo es simplemente un ritual. «Pruébese cada uno a sí mismo, y coma así» (1 Corintios 11:28). En Corinto había divisiones, egoísmo y desprecio. «Indignamente» no significa que solo el perfecto puede participar. Habla de participar sin discernir lo que representa la Cena ni al cuerpo reunido.\n\nLa copa es comunión de la sangre de Cristo; el pan, comunión de su cuerpo. Siendo uno solo el pan, con ser muchos somos un cuerpo (1 Corintios 10:16-17). No es solo mi relación individual con Jesús: declara nuestra unidad.\n\n¿Se convierten el pan y el vino literalmente? Hay quien enseña presencia real, quien enseña presencia espiritual, y quien enseña memorial. No convertimos esa diferencia en prueba de quién pertenece a Cristo. El texto sí establece: Jesús lo ordenó, relacionó el pan con su cuerpo y la copa con su sangre, mandó hacerlo en memoria de Él, y Pablo lo presenta como comunión y proclamación.\n\n¿Quién participa? Quienes han puesto su fe en Jesucristo y desean la comunión de su cuerpo. Pablo no dice «si alguien tiene pecado, no coma». Dice: pruébese, y coma así. El examen conduce a participar correctamente, no a excluirse automáticamente.\n\nCristo → su cuerpo entregado → su sangre derramada → nuevo pacto → comunión → examen personal → esperanza de su regreso.\n\nNo usamos la mesa para alimentar divisiones. Precisamente en una iglesia dividida Pablo recordó: siendo muchos, somos un cuerpo. Memoria, proclamación, comunión, examen y esperanza: recordamos a Cristo crucificado mientras esperamos a Cristo que viene.",
    sides: [
      {
        name: "Nuestra visión",
        mine: true,
        line: "La Cena es memoria, proclamación, comunión, examen y esperanza. El centro es Cristo, no la teoría de los elementos.",
        why: "Jesús la instituyó. Pablo la transmite. No empezamos por transubstanciación o memorial: empezamos por el texto.",
        sections: [
          {
            title: "Jesús instituyó la Cena",
            body: "Pan: esto es mi cuerpo. Copa: mi sangre del nuevo pacto, derramada para remisión. Haced esto en memoria de mí.",
          },
          {
            title: "Hacia atrás, adentro y adelante",
            body: "Recordamos su muerte. Examinamos nuestra vida. Esperamos su venida. Todas las veces, anunciáis la muerte del Señor hasta que él venga.",
          },
          {
            title: "No es solo un rito",
            body: "Pruébese cada uno, y coma así. Indignamente, en Corinto, era despreciar al cuerpo reunido. El examen lleva a participar bien, no a quedarse fuera por defecto.",
          },
          {
            title: "Comunión del cuerpo",
            body: "Un pan, un cuerpo. La Cena declara unidad, no solo una piedad privada.",
          },
        ],
        biblical: [
          "Tomad, comed; esto es mi cuerpo. Esta es mi sangre del nuevo pacto (Mateo 26:26-28).",
          "Haced esto en memoria de mí (Lucas 22:19).",
          "La muerte del Señor anunciáis hasta que él venga (1 Corintios 11:26).",
          "Pruébese cada uno a sí mismo, y coma así (1 Corintios 11:28).",
          "Comunión de la sangre y del cuerpo de Cristo; un pan, un cuerpo (1 Corintios 10:16-17).",
        ],
        notBiblical: [
          "Hacer de la teoría de los elementos una prueba de salvación.",
          "Reducir «indignamente» a «solo el perfecto puede comer».",
          "Usar la mesa para dividir a la iglesia.",
          "Tratar la Cena como un rito vacío, sin Cristo ni el cuerpo.",
        ],
      },
      {
        name: "Presencia real / transubstanciación",
        line: "El pan y el vino se convierten, o contienen, el cuerpo y la sangre de Cristo.",
        biblical: [
          "Jesús dijo: esto es mi cuerpo; esto es mi sangre.",
        ],
        notBiblical: [
          "Un versículo que explique el cambio de sustancia como dogma. Eso es escuela, no el texto plano.",
        ],
      },
      {
        name: "Memorial",
        line: "El pan y la copa recuerdan; no se convierten.",
        biblical: [
          "Haced esto en memoria de mí (Lucas 22:19).",
          "Anunciáis la muerte del Señor (1 Corintios 11:26).",
        ],
        notBiblical: [
          "Vaciar las palabras «esto es mi cuerpo» hasta que quede solo un símbolo sin comunión (1 Corintios 10:16).",
        ],
      },
    ],
  },
  {
    id: "diezmo",
    title: "Diezmo y ofrendas",
    who: "Antes de la Ley, bajo la Ley, y lo que enseñan Jesús y los apóstoles. Sin imponer una carga.",
    issue: "Bajo la Ley, diezmo establecido. Bajo el Nuevo Pacto: generosidad, proporcionalidad, libertad y responsabilidad.",
    verseIds: [
      "gn-14-20",
      "gn-28-22",
      "lv-27-30",
      "nm-18-21",
      "mal-3-10",
      "mt-23-23",
      "1co-16-2",
      "2co-9-7",
      "1co-9-14",
      "gal-6-6",
    ],
    letter:
      "Nuestra visión sobre el diezmo y las ofrendas\n\nEl diezmo se estudia recorriendo toda la Biblia: lo que ocurrió antes de la Ley, lo que Dios ordenó a Israel bajo Moisés, y lo que enseñaron Jesús y los apóstoles. El propósito no es imponer una carga económica, sino ver qué enseñan las Escrituras.\n\nAntes de la Ley, Abram dio los diezmos de todo a Melquisedec (Génesis 14:20). Describe lo que Abraham hizo; no manda que todo creyente entregue para siempre el 10 % de sus ingresos. Jacob prometió: de todo lo que me dieres, el diezmo apartaré para ti (Génesis 28:22). Es voto personal, no legislación universal.\n\nBajo la Ley, el diezmo es del pacto. El diezmo de la tierra de Jehová es (Levítico 27:30). Los diezmos se dan a los levitas, que no tuvieron heredad como las otras tribus (Números 18:21). Deuteronomio también habla de celebraciones y de levitas, extranjeros, huérfanos y viudas. Era más amplio que entregar el 10 % del salario al líder religioso.\n\nMalaquías 3:10 está dentro del pacto con Israel: templo, sacerdotes, levitas y la Ley. No es metodológicamente correcto tomarlo aislado y afirmar, sin más, que obliga al 10 % del salario a cada cristiano bajo el Nuevo Pacto.\n\nJesús dijo a escribas y fariseos: diezmáis la menta y dejáis lo más importante de la ley: la justicia, la misericordia y la fe (Mateo 23:23). No condenó que aquellos judíos diezmaran. Hablaba a quienes vivían bajo la Ley, antes de su muerte y del Nuevo Pacto. Por sí solo no resuelve si los gentiles quedaron obligados al 10 %.\n\nLos apóstoles enseñan a dar, pero no mandan: cada cristiano debe entregar exactamente el diez por ciento. Pablo: cada primer día, según haya prosperado (1 Corintios 16:2). Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad; Dios ama al dador alegre (2 Corintios 9:7). El dar cristiano es voluntario, consciente, proporcional, generoso y alegre.\n\n¿Debe sostenerse el ministerio? Sí. El Señor ordenó que los que anuncian el evangelio vivan del evangelio (1 Corintios 9:14). El que es enseñado, haga partícipe de toda cosa buena al que lo instruye (Gálatas 6:6). También hay ayuda para necesitados, pobres y viudas.\n\nEl 10 % fue institución explícita del pacto mosaico. Abraham y Jacob muestran la décima parte antes de Moisés, pero no un mandamiento universal a la Iglesia. En el Nuevo Testamento el creyente debe dar generosamente y sostener la obra. No hay mandato apostólico inequívoco del 10 % como requisito. Quien use el 10 % como referencia personal, puede. Incluso puede dar más.\n\nNo hay fundamento para enseñar que se pierde la salvación por no entregar exactamente el 10 %. La avaricia sí se trata en serio. Convertir un porcentaje en condición de salvación es una afirmación que el Nuevo Testamento no hace.\n\nNuestra visión no es «no hay que dar». Es lo contrario: un corazón tan generoso que deje de preguntar cuál es el mínimo, y pregunte cómo usar lo que Dios confió para servir y avanzar su obra. Quien da el 10 % puede hacerlo como disciplina. Quien da de otra manera, que lo haga responsablemente, no con tristeza ni por necesidad.\n\nNo imponemos el diezmo como condición de salvación ni condenamos al que lo practica. Enseñamos a dar con libertad, responsabilidad, generosidad y alegría.",
    sides: [
      {
        name: "Nuestra visión",
        mine: true,
        line: "No es «no hay que dar». Es dar con libertad, proporcionalidad y alegría. El 10 % no es condición de salvación.",
        why: "Se recorre toda la Biblia. No se usa el diezmo para imponer una carga. Se pregunta qué enseñan realmente las Escrituras.",
        sections: [
          {
            title: "Antes de la Ley",
            body: "Abraham dio diezmos a Melquisedec. Jacob hizo un voto. Relato y voto, no mandamiento universal a la Iglesia.",
          },
          {
            title: "Bajo la Ley",
            body: "El diezmo es del pacto con Israel: levitas, templo, tierra, pobres. Malaquías 3:10 vive ahí. No se aísla para el salario del cristiano.",
          },
          {
            title: "Jesús y los apóstoles",
            body: "Mateo 23:23 habla a judíos bajo la Ley. Pablo enseña a dar según se haya prosperado, como propuso el corazón, no por necesidad. El ministerio sí se sostiene.",
          },
        ],
        biblical: [
          "Abram le dio los diezmos de todo (Génesis 14:20).",
          "El diezmo de la tierra, de Jehová es (Levítico 27:30).",
          "Los diezmos a los levitas por su ministerio (Números 18:21).",
          "Traed los diezmos al alfolí (Malaquías 3:10), en el pacto con Israel.",
          "Justicia, misericordia y fe pesan más que el diezmo de la hierba (Mateo 23:23).",
          "Según haya prosperado (1 Corintios 16:2).",
          "Como propuso en su corazón: no con tristeza, ni por necesidad (2 Corintios 9:7).",
          "Los que anuncian el evangelio, que vivan del evangelio (1 Corintios 9:14).",
          "Haga partícipe de toda cosa buena al que lo instruye (Gálatas 6:6).",
        ],
        notBiblical: [
          "Tomar Malaquías 3:10 aislado como ley del 10 % para todo cristiano.",
          "«Si no das el 10 % no hay bendición» o «pierdes la salvación».",
          "«No hay que dar»: eso tampoco está en el Nuevo Testamento.",
          "Convertir el dar en el centro del evangelio, o en un mínimo a regañadientes.",
        ],
      },
      {
        name: "Diezmo como ley de la iglesia",
        line: "El 10 % es mandamiento, y si no das estás robando a Dios.",
        biblical: [
          "El diezmo de la tierra de Jehová es (Levítico 27:30) — bajo Moisés.",
          "Malaquías 3:10, dicho a Israel con templo y sacerdotes.",
        ],
        notBiblical: [
          "Un mandamiento apostólico: «cada cristiano, exactamente el 10 % de todos sus ingresos».",
          "Usar Malaquías para vender milagros o para atar la salvación al porcentaje.",
        ],
      },
    ],
  },
  {
    id: "apostoles",
    title: "Apóstoles, profetas y profecía",
    who: "Distinguir oficio, don y lo que el texto dice frente a lo que inferimos.",
    issue: "Apóstoles: fundamento cumplido. Profetas: no el oficio revelador de entonces. Don de profecía: vigente, y se juzga.",
    verseIds: [
      "ef-2-20",
      "ap-21-14",
      "heb-1-1",
      "mt-27-51",
      "heb-10-19",
      "1co-14-1",
      "1co-14-3",
      "1co-14-31",
      "1co-14-29",
      "1ts-5-20",
      "1jn-4-1",
    ],
    letter:
      "Nuestra visión sobre apóstoles, profetas y profecía\n\nDistinguimos el ministerio de apóstol, el ministerio de profeta y el don de profecía. No son términos intercambiables.\n\nLos apóstoles cumplieron una función fundacional. La Iglesia está edificada sobre el fundamento de los apóstoles y profetas; la piedra del ángulo es Jesucristo (Efesios 2:20). El fundamento se coloca para establecer el edificio; no se vuelve a colocar. Apocalipsis 21:14 da un lugar singular a los doce apóstoles del Cordero. Por eso el ministerio apostólico fundacional ya cumplió su propósito. No reconocemos hoy personas con la posición y autoridad de Pedro, Juan, Pablo y los apóstoles del Nuevo Testamento.\n\nDios habló antiguamente por los profetas; en estos días nos ha hablado por el Hijo (Hebreos 1:1-2). Con Cristo llega la revelación culminante. El velo se rasgó (Mateo 27:51). Por la sangre de Jesús tenemos libertad para entrar en el Lugar Santísimo (Hebreos 10:19-20). El cristiano no necesita un profeta como intermediario entre él y Dios. El ministerio del profeta como autoridad reveladora comparable a los profetas bíblicos no continúa de esa manera.\n\nPrecisión: el velo rasgado demuestra el acceso directo a Dios por Cristo. El Nuevo Testamento no dice explícitamente: «por haberse rasgado el velo, cesó el oficio de profeta». Eso es nuestra inferencia doctrinal, no una declaración textual.\n\nEl don de profecía continúa. Procurad los dones, sobre todo que profeticéis (1 Corintios 14:1). El que profetiza habla para edificación, exhortación y consolación (1 Corintios 14:3). El Espíritu puede conceder ese don. Profetizar no convierte automáticamente a alguien en profeta. Podéis profetizar todos uno por uno (1 Corintios 14:31); eso no hace a todos profetas de oficio. Se puede enseñar sin ser «el maestro», y se puede profetizar sin ser «el profeta» de la congregación.\n\nToda profecía debe ser juzgada. Los profetas hablen dos o tres, y los demás juzguen (1 Corintios 14:29). No menospreciéis las profecías. Examinadlo todo; retened lo bueno (1 Tesalonicenses 5:20-21). Probad los espíritus (1 Juan 4:1). Ninguna profecía está por encima de la Palabra. No establece otro evangelio.\n\nCristo es suficiente. Acceso a Dios por Él. No necesitamos nuevos apóstoles que vuelvan a poner el fundamento, ni profetas como intermediarios necesarios. Tampoco apagamos al Espíritu ni menospreciamos las profecías. Lo que alguien diga que recibió de Dios se examina. Profetizar no hace profeta, y ninguna profecía contemporánea corrige, reemplaza o se pone sobre la Escritura.",
    sides: [
      {
        name: "Nuestra visión",
        mine: true,
        line: "Oficio apostólico fundacional, cumplido. Oficio de profeta como autoridad reveladora, no. Don de profecía, sí: se juzga por la Palabra.",
        why: "Apóstol, profeta y profecía no son lo mismo. El texto y la inferencia se marcan por separado.",
        sections: [
          {
            title: "Los apóstoles",
            body: "Fundamento de la Iglesia. Los doce del Cordero. No se vuelve a echar. No reconocemos hoy esa autoridad.",
          },
          {
            title: "El ministerio de profeta",
            body: "Dios nos ha hablado por el Hijo. Acceso directo por Cristo. No hace falta un profeta como intermediario. El oficio revelador de entonces no continúa así.",
          },
          {
            title: "El don de profecía",
            body: "Sigue. Edifica, exhorta, consuela. Profetizar no es ser profeta. Toda profecía se juzga a la luz de la Escritura.",
          },
        ],
        biblical: [
          "Edificados sobre el fundamento de los apóstoles y profetas; la piedra es Cristo (Efesios 2:20).",
          "Los doce apóstoles del Cordero (Apocalipsis 21:14).",
          "En estos días nos ha hablado por el Hijo (Hebreos 1:1-2).",
          "El velo se rasgó; hay entrada al Lugar Santísimo por la sangre de Jesús (Mateo 27:51; Hebreos 10:19-20).",
          "Procurad que profeticéis; es para edificación, exhortación y consolación (1 Corintios 14:1, 3).",
          "Podéis profetizar todos uno por uno (1 Corintios 14:31).",
          "Hablen dos o tres, y los demás juzguen (1 Corintios 14:29).",
          "No menospreciéis las profecías. Examinadlo todo (1 Tesalonicenses 5:20-21).",
          "Probad los espíritus (1 Juan 4:1).",
        ],
        notBiblical: [
          "«Por haberse rasgado el velo, cesó el oficio de profeta»: el NT no lo dice así. Es inferencia nuestra, no declaración textual.",
          "«Ya no hay ninguna palabra de Dios a nadie»: eso apaga lo que Pablo manda procurar.",
          "«Dios me dijo» como autoridad sobre la iglesia, sin examen.",
          "Que profetizar te convierta automáticamente en el profeta de la congregación.",
        ],
      },
      {
        name: "Cinco ministerios vigentes",
        line: "Hoy hay apóstoles y profetas como cargo, con autoridad sobre la iglesia.",
        biblical: [
          "Él dio apóstoles, profetas, evangelistas, pastores y maestros (Efesios 4:11).",
        ],
        notBiblical: [
          "Igualar ese texto con la autoridad de los Doce o de los profetas que escribieron Escritura.",
          "Un intermediario necesario otra vez, cuando Hebreos abre el Lugar Santísimo por Cristo.",
        ],
      },
    ],
  },
  {
    id: "mujer-ministerio",
    title: "La mujer y el ministerio pastoral",
    who: "Igual dignidad. Distintas funciones. Sin inferioridad.",
    issue: "Igualdad en Cristo → diversidad de funciones → gobierno pastoral reservado al varón calificado → Cristo cabeza de todos.",
    verseIds: [
      "gal-3-28",
      "hch-18-26",
      "ro-16-1",
      "hch-21-9",
      "1co-11-5",
      "tit-2-3",
      "1ti-3-1",
      "tit-1-5",
      "1ti-2-11",
      "1pe-5-2",
    ],
    letter:
      "Nuestra visión sobre la mujer y el ministerio pastoral\n\nHombres y mujeres tienen igual dignidad y valor delante de Dios, participan de la salvación en Jesucristo y pueden ser usados por el Espíritu Santo. No hay varón ni mujer; todos sois uno en Cristo Jesús (Gálatas 3:28). Igualdad de valor no significa necesariamente identidad de funciones en el gobierno de la congregación.\n\nDios usa a las mujeres. Priscila, con Aquila, expuso a Apolos más exactamente el camino de Dios (Hechos 18:26). Febe es diakonos de la iglesia en Cencrea (Romanos 16:1). Las hijas de Felipe profetizaban (Hechos 21:9). Las mujeres oraban y profetizaban en la congregación (1 Corintios 11:5). Tito 2: las ancianas enseñan lo bueno y forman a otras mujeres. No interpretamos que Dios haya prohibido a la mujer hablar, enseñar en cualquier circunstancia, profetizar, evangelizar, discipular o servir.\n\nNuestra distinción está en el gobierno pastoral. La Escritura reserva al varón calificado la responsabilidad de anciano u obispo que ejerce el gobierno doctrinal y pastoral. El obispo, marido de una sola mujer (1 Timoteo 3:1-2). Ancianos: irreprensible, marido de una sola mujer (Tito 1:5-6). 1 Timoteo 2:11-12: no permito a la mujer enseñar, ni ejercer dominio sobre el hombre. Lo leemos como restricción de la enseñanza autoritativa y el gobierno de la congregación, no como prohibición de toda enseñanza. Así se armoniza con Priscila, Tito 2 y las que profetizaban.\n\nNo es superioridad del hombre. Pedro: apacentad la grey, no como teniendo señorío, sino siendo ejemplos (1 Pedro 5:2-3). Autoridad pastoral es responsabilidad, servicio, enseñanza, cuidado y rendición de cuentas; no dominio abusivo. Jesucristo es la cabeza de la Iglesia.\n\nHay otra interpretación: 1 Timoteo 2 y 1 Corintios 14 como circunstancias de aquellas iglesias, y por eso el pastorado femenino. No la adoptamos. El argumento de Pablo en 1 Timoteo 2:13 remite a Adán y Eva, no solo a Éfeso. Hay un principio de orden que trasciende aquella congregación. Esa diferencia no autoriza a menospreciar a las mujeres ni a negar sus dones.\n\nDios llama a las mujeres a servir, discipular, enseñar dentro del orden bíblico, evangelizar, profetizar, ejercer funciones diaconales y edificar el cuerpo. El oficio de pastor, anciano u obispo con autoridad doctrinal y gubernamental corresponde al varón que cumple las cualificaciones. Por eso no ordenamos mujeres al ministerio pastoral. No porque la mujer sea menos capaz, menos espiritual o menos valiosa, sino por nuestra comprensión del orden ministerial. Hombre y mujer obedecen a Cristo y usan los dones bajo su autoridad.",
    sides: [
      {
        name: "Nuestra visión",
        mine: true,
        line: "Igual valor. La mujer sirve, enseña y profetiza. El ancianato pastoral, al varón calificado. Cristo es la cabeza.",
        why: "No es inferioridad. Es orden de autoridad ministerial en ciertos textos del Nuevo Testamento.",
        sections: [
          {
            title: "Igualdad y servicio",
            body: "Uno en Cristo. Priscila instruye. Febe sirve. Hijas de Felipe profetizan. Ancianas enseñan a otras. No hay veda general de voz o ministerio.",
          },
          {
            title: "El gobierno pastoral",
            body: "Obispo y anciano: marido de una sola mujer. 1 Timoteo 2: enseñanza autoritativa y gobierno, no toda forma de enseñar.",
          },
          {
            title: "No es señorío",
            body: "Los ancianos apacientan como ejemplos, no como dueños. La cabeza es Cristo.",
          },
        ],
        biblical: [
          "Todos sois uno en Cristo Jesús (Gálatas 3:28).",
          "Priscila y Aquila expusieron más exactamente el camino (Hechos 18:26).",
          "Febe, diaconisa de Cencrea (Romanos 16:1).",
          "Las hijas de Felipe profetizaban (Hechos 21:9).",
          "La mujer que ora o profetiza (1 Corintios 11:5).",
          "Las ancianas, maestras del bien (Tito 2:3-5).",
          "El obispo, marido de una sola mujer (1 Timoteo 3:1-2; Tito 1:5-6).",
          "No permito a la mujer enseñar, ni ejercer dominio sobre el hombre; Adán primero, después Eva (1 Timoteo 2:11-13).",
          "Apacentad, no como teniendo señorío, sino siendo ejemplos (1 Pedro 5:2-3).",
        ],
        notBiblical: [
          "Que la mujer valga menos, sea menos espiritual o no pueda ser usada por Dios.",
          "Prohibir toda enseñanza, profecía, evangelismo o servicio de mujeres.",
          "Convertir el pastorado en dominio abusivo del varón.",
          "Menospreciar a quienes leen estos textos de otra manera.",
        ],
      },
      {
        name: "Pastorado femenino",
        line: "1 Timoteo 2 y 1 Corintios 14 como circunstancias de aquellas iglesias; la mujer puede pastorear.",
        biblical: [
          "Uno en Cristo, sin varón ni mujer (Gálatas 3:28).",
          "Mujeres que profetizan y enseñan en el NT.",
        ],
        notBiblical: [
          "Pasar por alto que 1 Timoteo 2:13 apela a Adán y Eva, no solo a Éfeso.",
          "Hacer del pastorado femenino una prueba de quién ama a las mujeres.",
        ],
      },
    ],
  },
  {
    id: "arrebatamiento",
    title: "El arrebatamiento",
    who: "Primero lo que está claro. Después las escuelas sobre el cuándo.",
    issue: "Cristo regresará → los muertos en Cristo resucitarán → los creyentes serán reunidos con Él.",
    verseIds: [
      "1ts-4-16",
      "1co-15-51",
      "1ts-1-10",
      "1ts-5-9",
      "ap-3-10",
      "mt-24-29",
      "2ts-2-1",
      "mt-24-44",
    ],
    letter:
      "Nuestra visión sobre el arrebatamiento\n\nLa Escritura enseña claramente que Jesucristo regresará y que los creyentes serán reunidos con Él. El Señor mismo descenderá del cielo; los muertos en Cristo resucitarán, y seremos arrebatados para recibir al Señor en el aire (1 Tesalonicenses 4:16-17). No todos dormiremos; pero todos seremos transformados, a la final trompeta (1 Corintios 15:51-52).\n\nNuestra esperanza fundamental no depende de una escuela escatológica: Cristo volverá, los muertos en Cristo resucitarán y los creyentes serán reunidos con Él.\n\nLa diferencia está en cuándo ocurre el arrebatamiento respecto de la gran tribulación. De ahí tres escuelas:\n\nPretribulacionismo: Cristo arrebatará a su Iglesia antes de la gran tribulación. Textos: 1 Tesalonicenses 1:10; 4:13-18; 5:9; Apocalipsis 3:10. Esperanza: Cristo puede recoger a su Iglesia antes de ese juicio.\n\nMesotribulacionismo: el arrebatamiento durante la tribulación, a menudo a la mitad. Relacionan Daniel, Mateo 24, 1 Corintios 15, 1 Tesalonicenses 4 y las trompetas de Apocalipsis. Esperanza: la Iglesia verá parte de la tribulación antes de ser reunida con Cristo.\n\nPostribulacionismo: la Iglesia atraviesa la gran tribulación y el arrebatamiento va unido a la venida visible de Cristo. Mateo 24:29-31: después de la tribulación de aquellos días, juntarán a sus escogidos. También 1 Tesalonicenses 4, 2 Tesalonicenses 2 y Apocalipsis 20. Esperanza: permanecer fiel durante la tribulación.\n\nLo que las tres tienen en común: Cristo regresará, los muertos en Cristo resucitarán, los creyentes serán reunidos con Él, y estaremos con el Señor. Por eso la cronología exacta no debe dividir a quienes confiesan a Jesucristo.\n\nReconocemos las tres escuelas y animamos a estudiar las Escrituras. Nuestra preparación no depende de acertar el calendario. Si Cristo recoge a su Iglesia antes, debemos estar preparados. Si hay que enfrentar tribulación, permanecer fieles. Si permanece hasta después, perseverar hasta el final.\n\nMás que una escuela, nuestra fe descansa en Jesucristo. Esperar a Cristo como si pudiera venir en cualquier momento, y permanecer firmes como si tuviéramos que atravesar la prueba más difícil. «Estad preparados; porque el Hijo del Hombre vendrá a la hora que no pensáis» (Mateo 24:44).",
    sides: [
      {
        name: "Nuestra visión",
        mine: true,
        line: "Esperar a Cristo como si pudiera venir ahora, y permanecer firmes como si hubiera que atravesar la prueba más difícil.",
        why: "Lo claro es la venida, la resurrección y la reunión con Él. El cuándo respecto de la tribulación no debe dividirnos ni sostener nuestra fe.",
        sections: [
          {
            title: "Lo que está claro",
            body: "Cristo volverá. Los muertos en Cristo resucitarán. Los creyentes serán reunidos con Él. 1 Tesalonicenses 4 y 1 Corintios 15.",
          },
          {
            title: "Las tres escuelas",
            body: "Pretribulación: antes del juicio. Mesotribulación: a la mitad. Postribulación: después, con la venida visible. Cada una cita Escritura. Ninguna es el evangelio.",
          },
          {
            title: "Lo que tienen en común",
            body: "Cristo regresará → los muertos resucitarán → los creyentes serán reunidos con Él → estaremos con el Señor.",
          },
        ],
        biblical: [
          "El Señor descenderá; seremos arrebatados para recibirle en el aire (1 Tesalonicenses 4:16-17).",
          "Todos seremos transformados a la final trompeta (1 Corintios 15:51-52).",
          "Estad preparados; vendrá a la hora que no pensáis (Mateo 24:44).",
        ],
        notBiblical: [
          "Hacer de la cronología una causa de división.",
          "Depositar la seguridad en acertar el calendario, y no en Cristo.",
          "Decir que solo una escuela es cristiana.",
        ],
      },
      {
        name: "Pretribulación",
        line: "La Iglesia es arrebatada antes de la gran tribulación.",
        biblical: [
          "Jesús nos libra de la ira venidera (1 Tesalonicenses 1:10).",
          "No nos ha puesto Dios para ira (1 Tesalonicenses 5:9).",
          "Te guardaré de la hora de la prueba (Apocalipsis 3:10).",
        ],
        notBiblical: [
          "Un versículo que diga: «siete años antes, toda la iglesia se va». Eso es sistema.",
        ],
      },
      {
        name: "Mesotribulación",
        line: "El arrebatamiento a mitad de la tribulación, a menudo con las trompetas.",
        biblical: [
          "La final trompeta de 1 Corintios 15:52, leída junto al curso de Apocalipsis.",
        ],
        notBiblical: [
          "Un versículo que fije el punto medio como ley. Hay variantes dentro de esta escuela.",
        ],
      },
      {
        name: "Postribulación",
        line: "La Iglesia atraviesa la tribulación; el arrebatamiento va con la venida visible.",
        biblical: [
          "Después de la tribulación de aquellos días, juntarán a sus escogidos (Mateo 24:29-31).",
          "Nuestra reunión con Él, y primero la apostasía (2 Tesalonicenses 2:1-4).",
        ],
        notBiblical: [
          "Identificar sin resto «escogidos» de Mateo 24 con toda la Iglesia, como si no hubiera debate.",
        ],
      },
    ],
  },
  {
    id: "salvacion",
    title: "¿Se pierde la salvación?",
    who: "Cuando den licencia para pecar, o quiten toda seguridad.",
    issue: "Jesús da vida eterna. El pecado se disciplina. Caer no es permiso.",
    verseIds: ["jn-10-28", "ro-8-38", "jn-1-12", "heb-10-26", "mt-24-13", "1jn-1-9"],
    letter:
      "Si naciste de Dios, eres hijo. Jesús da vida eterna y nadie las arrebata de Su mano. Eso no es licencia. Si pecamos a sabiendas, hay juicio. Confiesa y vuelve. El que nunca vuelve, muestra que no nació de nuevo.",
    sides: [
      {
        name: "Hijo, y no licencia",
        mine: true,
        line: "Vida eterna en la mano de Cristo. El pecado no se celebra.",
        why: "Juan 10 y Romanos 8 dan seguridad. Hebreos 10 y 1 Juan 1 quitan la juerga.",
        biblical: [
          "Yo les doy vida eterna; no perecerán jamás (Juan 10:28).",
          "Nada nos separa del amor de Dios (Romanos 8:38-39).",
          "Si pecamos voluntariamente, queda juicio (Hebreos 10:26).",
          "Si confesamos, Él es fiel para perdonar (1 Juan 1:9).",
        ],
        notBiblical: [
          "«Peca, total ya estás salvado».",
          "«Un tropiezo y ya no eres hijo».",
        ],
      },
    ],
  },
  {
    id: "fe-obras",
    title: "Fe o obras",
    who: "Cuando digan que con ser bueno basta, o que la fe no pide nada.",
    issue: "Salva la fe, no las obras. Una fe viva se ve.",
    verseIds: ["ef-2-8", "gal-2-16", "tit-3-5", "stgo-2-17", "ro-3-23"],
    letter:
      "Por gracia sois salvos por medio de la fe, no por obras. La fe sin obras está muerta. Las obras no compran; muestran que hay vida. Cree en el Señor Jesús.",
    sides: [
      {
        name: "Gracia que se ve",
        mine: true,
        line: "Fe para entrar. Obras como fruto, no como pago.",
        why: "Efesios 2 cierra el pago. Santiago 2 cierra la fe vacía.",
        biblical: [
          "Por gracia, por fe, no de obras (Efesios 2:8-9).",
          "Justificados por la fe de Cristo, no por la ley (Gálatas 2:16).",
          "Fe sin obras, muerta (Santiago 2:17).",
        ],
        notBiblical: [
          "Ganar el cielo con conducta.",
          "Una fe que no toca la vida y se llama fe.",
        ],
      },
    ],
  },
  {
    id: "espiritu",
    title: "El Espíritu Santo",
    who: "Presencia, llenura y dones: relacionados, no idénticos.",
    issue: "Espíritu en nosotros → comunión → llenura continua → fruto → dones según Él quiere.",
    verseIds: [
      "jn-14-16",
      "ro-8-9",
      "1co-3-16",
      "gal-4-19",
      "ef-5-18",
      "jn-15-4",
      "hch-4-31",
      "gal-5-22",
      "1co-12-11",
      "1co-12-30",
      "mt-7-22",
      "1ts-5-20",
    ],
    letter:
      "Nuestra visión sobre el Espíritu Santo, su llenura y sus dones\n\nHay que distinguir tres aspectos relacionados, no idénticos: la presencia del Espíritu en el creyente, la llenura del Espíritu y los dones. Confundirlos convierte una experiencia o un don en medida de salvación o de espiritualidad.\n\nEl Espíritu en el creyente. Jesús: mora con vosotros, y estará en vosotros (Juan 14:17). Si alguno no tiene el Espíritu de Cristo, no es de él (Romanos 8:9). Sois templo de Dios (1 Corintios 3:16). Dios con el hombre → Dios entre los hombres en Cristo → Dios en el hombre por su Espíritu. El propósito no es solo lo sobrenatural: hasta que Cristo sea formado en vosotros (Gálatas 4:19).\n\nSer llenos es una vida de comunión. Una cosa es que el Espíritu habite, otra es vivir lleno y gobernado por Él. Sed llenos del Espíritu (Efesios 5:18). No son porcentajes de Dios: cada vez más de la vida queda sujeta a su dirección. Permaneced en mí (Juan 15:4). Oración, Palabra, obediencia y adoración son esa relación. En Hechos 2 fueron llenos; en Hechos 4:31 vuelven a ser llenos. Buscamos una vida llena, no solo una experiencia. El fruto: amor, gozo, paz, paciencia, benignidad, bondad, fe, mansedumbre, templanza (Gálatas 5:22-23).\n\nLos dones continúan. Palabra de sabiduría, conocimiento, fe, sanidades, milagros, profecía, discernimiento, lenguas e interpretación (1 Corintios 12). Romanos 12 añade servicio. Uno y el mismo Espíritu reparte a cada uno como él quiere (1 Corintios 12:11). No todos tienen el mismo don. ¿Hablan todos lenguas? ¿interpretan todos? (1 Corintios 12:30).\n\nUn don no confirma automáticamente la salvación. Muchos dirán: ¿no profetizamos en tu nombre, y hicimos milagros? Y el Señor: nunca os conocí (Mateo 7:22-23). Tampoco un don es la prueba universal del bautismo del Espíritu: Él reparte como quiere.\n\nDones y fruto no son lo mismo. A Corinto no le faltaba ningún don, y Pablo los llama carnales. El don muestra cómo Dios puede usarnos. El fruto, cómo nos transforma. Hacen falta ambos; no se confunden.\n\nToda manifestación se examina. No apaguéis al Espíritu. No menospreciéis las profecías. Examinadlo todo; retened lo bueno (1 Tesalonicenses 5:19-21). La Palabra es la norma.\n\nDios habita en el creyente. Procuramos estar llenos por una relación rendida. Los dones siguen, soberanos, para el cuerpo. No hacemos de un don prueba de salvación, confirmación universal del bautismo del Espíritu ni medida de superioridad. La meta no es solo manifestar dones: conocer a Dios, permanecer en Cristo, y que el Espíritu forme el carácter de Jesús. No buscamos simplemente tener más de Dios; buscamos que Dios tenga más de nosotros.",
    sides: [
      {
        name: "Nuestra visión",
        mine: true,
        line: "El Espíritu habita. La llenura es comunión continua. Los dones siguen, como Él quiere. Ni boleto ni apagón.",
        why: "Presencia, llenura y dones no son lo mismo. Confundirlos mide a las personas por una experiencia.",
        sections: [
          {
            title: "El Espíritu en el creyente",
            body: "Estará en vosotros. Si no tiene el Espíritu de Cristo, no es de él. Templo de Dios. Hasta que Cristo sea formado en vosotros.",
          },
          {
            title: "Llenura como comunión",
            body: "Sed llenos. Permaneced en mí. No es una sola vez: Hechos 2 y Hechos 4. El fruto es el carácter de Cristo.",
          },
          {
            title: "Dones según Él quiere",
            body: "Continúan. No todos el mismo. Un don no prueba salvación. Dones y fruto no se confunden. Se examina todo; no se apaga al Espíritu.",
          },
        ],
        biblical: [
          "Mora con vosotros, y estará en vosotros (Juan 14:17).",
          "Si alguno no tiene el Espíritu de Cristo, no es de él (Romanos 8:9).",
          "Sois templo de Dios (1 Corintios 3:16).",
          "Hasta que Cristo sea formado en vosotros (Gálatas 4:19).",
          "Sed llenos del Espíritu (Efesios 5:18).",
          "Permaneced en mí (Juan 15:4).",
          "Todos fueron llenos… y hablaban con denuedo (Hechos 4:31).",
          "El fruto del Espíritu (Gálatas 5:22-23).",
          "Repartiendo a cada uno como él quiere (1 Corintios 12:11).",
          "¿Hablan todos lenguas? (1 Corintios 12:30).",
          "¿No profetizamos…? Nunca os conocí (Mateo 7:22-23).",
          "No menospreciéis las profecías. Examinadlo todo (1 Tesalonicenses 5:20-21).",
        ],
        notBiblical: [
          "Que un don, sobre todo las lenguas, sea prueba de salvación o del bautismo del Espíritu.",
          "Que todos deban manifestar el mismo don.",
          "Medir espiritualidad por el espectáculo, y no por el fruto.",
          "Apagar al Espíritu, o aceptar sin examen todo lo que alguien atribuya a Dios.",
        ],
      },
      {
        name: "Lenguas como evidencia",
        line: "Todo el que es bautizado en el Espíritu habla en lenguas.",
        biblical: [
          "En Hechos 2 hablaron en otras lenguas.",
        ],
        notBiblical: [
          "Pablo pregunta: ¿hablan todos lenguas? La respuesta esperada es no (1 Corintios 12:30).",
          "Hacer de un don la medida de quién es de Cristo (Mateo 7:22-23).",
        ],
      },
      {
        name: "Los dones cesaron",
        line: "Los dones milagrosos se acabaron con los apóstoles.",
        biblical: [
          "La Escritura es suficiente para doctrina y vida.",
        ],
        notBiblical: [
          "Un versículo que diga: «después de los apóstoles, ningún don». Pablo manda no apagar al Espíritu.",
        ],
      },
    ],
  },
  {
    id: "infierno",
    title: "El infierno",
    who: "Cuando nieguen el juicio, o lo usen de palo.",
    issue: "El infierno es real. Se predica para que huyan a Cristo.",
    verseIds: ["mt-25-46", "lc-16-23", "ap-20-15", "2ts-1-9", "jn-3-16"],
    letter:
      "El infierno no es un cuento. Castigo eterno y vida eterna usan la misma palabra: eterno. El que no está en el libro de la vida es lanzado al lago de fuego. Por eso Cristo vino: para que no te pierdas, mas tengas vida eterna.",
    sides: [
      {
        name: "Juicio real",
        mine: true,
        line: "Hay lago de fuego. Hay vida eterna. El centro sigue siendo Cristo, no el miedo.",
        why: "Jesús lo dijo. El mismo «eterno» va al castigo y a la vida.",
        biblical: [
          "Castigo eterno y vida eterna (Mateo 25:46).",
          "El rico en tormentos (Lucas 16:23-24).",
          "Lago de fuego (Apocalipsis 20:15).",
        ],
        notBiblical: [
          "«Al final todos se salvan».",
          "Usar el infierno como espectáculo, sin llamar a Cristo.",
        ],
      },
    ],
  },
];

const DOCTRINE_EN: Record<string, Pick<DoctrineTopic, "title" | "who" | "issue" | "letter" | "sides">> = {
  identidad: {
    title: "The identity of God",
    who: "How God makes Himself known: not from a label, but from Scripture.",
    issue: "God with man → God among men → God in man.",
    letter:
      "The Oneness doctrine\n\nThe Oneness doctrine teaches that God is one in an absolute sense. There are not three eternal, distinct divine persons within the Godhead, but one God, eternal, invisible and Spirit, who was fully manifested in Jesus Christ to carry out the work of redemption and who today works in His people through His Spirit.\n\nOneness does not deny the Father, the Son or the Holy Spirit. It recognizes them as fully biblical terms, but does not interpret them as three coeternal divine persons.\n\nIn simple terms:\nThe Father is God in His eternity, transcendence and fatherhood.\nThe Son is the true humanity in which that one God was manifested for our salvation.\nThe Holy Spirit is the same God working and dwelling in His people.\n\nTherefore, Oneness teaches that Jesus Christ is truly man and truly God manifested in the flesh. The humanity of Christ could pray, suffer, obey and die; but the Deity that dwelt fully in Him was the one eternal God.\n\nThis doctrine can be summed up in a single statement:\nThere is one God, and that one God was fully revealed in Jesus Christ.\n\nBiblical foundation of the Oneness doctrine\n\n1. There is one God\n\nThe starting point is biblical monotheism.\n\nDeuteronomy 6:4\n“Hear, O Israel: The LORD our God, the LORD is one.”\n\nIsaiah 43:10-11\n“Before Me there was no God formed, nor shall there be after Me. I, even I, am the LORD, and besides Me there is no savior.”\n\nIsaiah 44:6\n“I am the First and I am the Last; besides Me there is no God.”\n\nIsaiah 45:5\n“I am the LORD, and there is no other; there is no God besides Me.”\n\nThese texts form the basis of the Oneness doctrine. The Bible repeatedly presents God as one, with no other God before, after or beside Him.\n\n2. God is Spirit and invisible\n\nScripture teaches that God, in His eternal nature, is Spirit.\n\nJohn 4:24\n“God is Spirit.”\n\nHe is also invisible.\n\n1 Timothy 1:17\n“To the King eternal, immortal, invisible, the only wise God...”\n\nThis means that God, by nature, does not depend on a physical body. Yet the New Testament teaches that this invisible God chose to make Himself known in a visible way.\n\n3. God was manifested in the flesh\n\nHere appears one of the central affirmations of Oneness.\n\n1 Timothy 3:16\n“God was manifested in the flesh.”\n\nThe text presents the incarnation as a manifestation of God. John expresses the same truth in another way.\n\nJohn 1:1\n“In the beginning was the Word, and the Word was with God, and the Word was God.”\n\nThen he declares:\n\nJohn 1:14\n“And the Word became flesh and dwelt among us.”\n\nFor Oneness, the Word is not another, distinct God, but the eternal self-expression of God, truly manifested in humanity.\n\n4. Jesus Christ is the image of the invisible God\n\nPaul says:\n\nColossians 1:15\n“He is the image of the invisible God.”\n\nGod is invisible, but Jesus Christ is His visible image. This means that when we look at Christ, we see the human revelation of the God who by nature cannot be seen. That is why Jesus could say:\n\nJohn 14:9\n“He who has seen Me has seen the Father.”\n\n5. All the fullness of the Godhead dwells in Christ\n\nOne of the most important texts is:\n\nColossians 2:9\n“For in Him dwells all the fullness of the Godhead bodily.”\n\nThe key word is: all. Scripture does not say that a part of the Godhead dwells in Christ. It says that all the fullness of the Godhead dwells bodily in Him. That is why Oneness holds that Jesus Christ is the complete revelation of the one God.\n\n6. The Father was in Christ\n\nJesus explained directly the relationship between Himself and the Father.\n\nJohn 14:10\n“Do you not believe that I am in the Father, and the Father in Me? ... the Father who dwells in Me does the works.”\n\nFor Oneness, this sentence is fundamental. Jesus is not saying that His humanity is literally the Father. He is saying that the Father dwelt in Him.\n\nAlso:\n\n2 Corinthians 5:19\n“God was in Christ reconciling the world to Himself.”\n\nTherefore, the Oneness believer understands that God was not simply accompanying Christ from afar. God was in Christ.\n\n7. Who is the Son?\n\nThe Son is related to the incarnation. The angel said to Mary:\n\nLuke 1:35\n“That Holy One who is to be born will be called the Son of God.”\n\nNotice the expression: “who is to be born.” The Deity is eternal. The Son, as to humanity, is born.\n\nTherefore, Oneness distinguishes between the eternal God, who never began to exist, and the Son, the humanity of the Messiah born of Mary. God did not begin in Bethlehem. The humanity of the Messiah did.\n\n8. Jesus Christ is truly God and truly man\n\nThe Bible presents Christ with human and divine characteristics.\n\nAs man\n\nJesus was born.\nLuke 2:7\nMary “brought forth her firstborn Son.”\n\nJesus was hungry.\nMatthew 4:2\n“He was hungry.”\n\nJesus grew weary.\nJohn 4:6\n“Jesus, being wearied from His journey...”\n\nJesus wept.\nJohn 11:35\n“Jesus wept.”\n\nJesus died.\nJohn 19:30\n“He gave up His spirit.”\n\nAs God\n\nJesus forgave sins.\nMark 2:5\n“Son, your sins are forgiven you.”\n\nJesus received worship.\nMatthew 14:33\n“Then those who were in the boat came and worshiped Him.”\n\nJesus was called God.\nJohn 20:28\n“My Lord and my God!”\n\nTherefore, Oneness teaches that Jesus Christ has true humanity and full Deity.\n\n9. Why did Jesus pray?\n\nIf Jesus is God, a natural question is: why did He pray? Oneness answers that Jesus was truly man.\n\n1 Timothy 2:5\n“There is one God and one Mediator between God and men, the Man Christ Jesus.”\n\nAs man, Jesus prayed, obeyed, depended on God, suffered and submitted to the divine will.\n\nTherefore, His prayers do not necessarily force the conclusion that one divine person was speaking to another divine person. They can be understood as the true humanity of Christ relating to God.\n\n10. “Not My will, but Yours, be done”\n\nJesus prayed:\n\nLuke 22:42\n“Not My will, but Yours, be done.”\n\nThis shows that Jesus had a true human will. Facing the cross, His humanity experienced real anguish. But that human will submitted perfectly to the divine will. For Oneness, this scene demonstrates the reality of the incarnation.\n\n11. “My Father is greater than I”\n\nJesus said:\n\nJohn 14:28\n“My Father is greater than I.”\n\nOneness understands this statement from the human condition of Christ. Philippians 2:7-8 says that Christ took “the form of a bondservant” and “humbled Himself.” As man, Jesus was in a position of service and humiliation. That is why He could say: “My Father is greater than I.”\n\nYet the same Jesus also declared:\n\nJohn 10:30\n“I and My Father are one.”\n\nTherefore, the inferiority of John 14:28 is not interpreted as an inferiority of Deity, but as part of the human condition of the Messiah.\n\n12. Jesus forgives sins\n\nWhen Jesus forgave the paralytic, the scribes asked:\n\nMark 2:7\n“Who can forgive sins but God alone?”\n\nJesus did not deny that forgiving sins was a divine prerogative. On the contrary, He demonstrated His authority.\n\nMark 2:10\n“But that you may know that the Son of Man has power on earth to forgive sins...”\n\nFor Oneness, this passage reveals that the authority of God was present in Christ.\n\n13. Jesus is Savior\n\nThe LORD declares:\n\nIsaiah 43:11\n“I, even I, am the LORD, and besides Me there is no savior.”\n\nYet the New Testament presents Jesus as Savior.\n\nTitus 2:13\n“Looking for the blessed hope and glorious appearing of our great God and Savior Jesus Christ.”\n\nOneness sees continuity here: the only Savior of the Old Testament is fully revealed in Jesus Christ.\n\n14. “Before Abraham was, I AM”\n\nJesus said:\n\nJohn 8:58\n“Before Abraham was, I AM.”\n\nThis declaration recalls the divine revelation of:\n\nExodus 3:14\n“I AM WHO I AM.”\n\nThe humanity of Jesus was born in time. But the Deity that was in Him is eternal. Therefore, Oneness understands this expression as a statement related to the divine identity present in Christ.\n\n15. Jesus is Emmanuel\n\nThe prophecy says:\n\nMatthew 1:23\n“And they shall call His name Immanuel, which is translated, God with us.”\n\nNot only “a prophet of God.” Not only “a messenger of God.” But: God with us. This is one of the simplest expressions of the doctrine of the incarnation.\n\n16. The Holy Spirit is God working in us\n\nOneness does not regard the Holy Spirit as another, separate God. God is Spirit.\n\nJohn 4:24\n“God is Spirit.”\n\nPaul uses several expressions in Romans 8.\n\nRomans 8:9\n“Spirit of God.”\nIn the same verse: “Spirit of Christ.”\n\nRomans 8:10\n“And if Christ is in you...”\n\nFor Oneness, these expressions show one and the same divine presence acting in the believer.\n\nAlso:\n\n2 Corinthians 3:17\n“Now the Lord is the Spirit.”\n\n17. Father, Son and Holy Spirit\n\nOneness fully accepts these three terms. But it understands them this way:\n\nFather: the one God in His eternity and transcendence.\nSon: the one God manifested in true humanity.\nHoly Spirit: the one God working and dwelling in His people.\n\nThis can be summed up as:\nGod above us as Father.\nGod with us in the Son.\nGod in us by His Spirit.\n\n18. Baptism in the name of Jesus\n\nJesus commanded:\n\nMatthew 28:19\n“Baptizing them in the name of the Father and of the Son and of the Holy Spirit.”\n\nThe text says “in the name,” singular. Then we see how the apostles baptized.\n\nActs 2:38\n“Let every one of you be baptized in the name of Jesus Christ.”\n\nActs 8:16\n“They had been baptized in the name of the Lord Jesus.”\n\nActs 10:48\n“He commanded them to be baptized in the name of the Lord.”\n\nActs 19:5\n“They were baptized in the name of the Lord Jesus.”\n\nOneness understands that the apostles were applying the command of Matthew 28:19 in the revealed name of Jesus Christ.\n\n19. God and the Lamb in Revelation\n\nRevelation presents God and the Lamb. Oneness recognizes that distinction. The Lamb represents Jesus Christ in His glorified humanity and in His redemptive work.\n\nBut notice also:\n\nRevelation 4:2\n“A throne set in heaven, and One sat on the throne.”\n\nThen:\n\nRevelation 22:3\n“The throne of God and of the Lamb shall be in it.”\n\nIt says “the throne,” singular. And then:\n\nRevelation 22:4\n“They shall see His face, and His name shall be on their foreheads.”\n\nAgain the expressions are singular: His face, His name. For Oneness, this is consistent with the revelation of the one God in Jesus Christ.\n\nConclusion\n\nThe Oneness doctrine does not simply teach that Jesus is important or that He represents God. It teaches something far deeper: the one eternal God was truly manifested in Jesus Christ.\n\nThe Father is the invisible God.\nThe Son is the human manifestation of that God for our redemption.\nThe Holy Spirit is that same God working in us.\n\nTherefore:\n\nColossians 2:9\n“In Him dwells all the fullness of the Godhead bodily.”\n\nAnd that is why Jesus could say:\n\nJohn 14:9\n“He who has seen Me has seen the Father.”\n\nThe heart of the Oneness doctrine is:\nOne God.\nOne Godhead.\nOne perfect manifestation in Jesus Christ.",
    sides: [
      {
        name: "Our vision",
        mine: true,
        line: "One God who reveals Himself, comes near in Jesus Christ, and dwells in His children by His Spirit.",
        why: "We do not begin from a trinitarian or oneness doctrine. We watch how God makes Himself known in Scripture. The center is Jesus Christ, not a label.",
        sections: [
          {
            title: "God with man",
            body: "From the beginning God spoke with men, manifested Himself, and made His will known by the prophets. Hebrews 1:1.",
          },
          {
            title: "God among men",
            body: "The revelation reaches its height in Jesus Christ: Emmanuel, God with us. The Word was made flesh. In Him dwells all the fullness of the Godhead. One God: there is no God beside the LORD. We do not make Jesus a second God, nor ignore the texts that distinguish the Father and the Son.",
          },
          {
            title: "God in man",
            body: "After the work of Christ, God dwells in the believer by His Spirit. You are the temple of God. The Spirit of God, the Spirit of Christ, and Christ in you, until Christ be formed in you.",
          },
        ],
        biblical: [
          "God spoke by the prophets, and in these days by the Son (Hebrews 1:1-2).",
          "Emmanuel: God with us (Isaiah 7:14; Matthew 1:23).",
          "The child is Mighty God and Everlasting Father (Isaiah 9:6).",
          "The Word was made flesh and dwelt among us (John 1:14).",
          "Christ is the image of the invisible God (Colossians 1:15).",
          "In Him dwells all the fullness of the Godhead bodily (Colossians 2:9).",
          "I am the LORD, and there is none else (Isaiah 45:5).",
          "The Spirit dwells with you and shall be in you (John 14:17).",
          "You are the temple of God (1 Corinthians 3:16).",
          "Spirit of God, Spirit of Christ, Christ in you (Romans 8:9-10).",
          "Until Christ be formed in you (Galatians 4:19).",
        ],
        notBiblical: [
          "Starting from the label “trinitarian” or “oneness.”",
          "Making Jesus a second God.",
          "Ignoring the texts that distinguish the Father and the Son.",
          "Imposing a theological position instead of calling people to know Christ.",
        ],
      },
      {
        name: "Three-person Trinity",
        line: "One God in three distinct persons: Father, Son, and Spirit.",
        biblical: [
          "At the Jordan: the Son, the Spirit, and the Father’s voice at once (Matthew 3:16-17).",
          "The Son prays to the Father.",
          "The grace of the Lord, the love of God, the communion of the Spirit (2 Corinthians 13:14).",
        ],
        notBiblical: [
          "The word “persons” is not in the Bible for the Godhead.",
          "If it sounds like three gods, it hits Deuteronomy 6:4.",
        ],
      },
      {
        name: "Triune God (Recovery)",
        line: "One God; Father, Son, and Spirit distinct, not separate; they coexist.",
        biblical: [
          "The Word was with God, and was God (John 1:1).",
          "Matthew 28:19: one name, and three.",
          "The Jordan: three at once.",
        ],
        notBiblical: [
          "“Coinherence” and “economical Trinity” are teaching words, not the text itself.",
        ],
      },
    ],
  },
  bautismo: {
    title: "Baptism",
    who: "The texts first. Then the interpretation. Not starting from a label.",
    issue: "Repentance → faith in Jesus Christ → baptism → new life in Christ.",
    letter:
      "Our vision of baptism\n\nWater baptism is central in the New Testament gospel. Our understanding must arise from the words of Jesus and the practice of His apostles, without setting one against the other.\n\nJesus commanded baptism: baptizing them in the name of the Father, and of the Son, and of the Holy Spirit (Matthew 28:19). The Greek is eis to onoma, “in the name,” singular. We must not erase any part of Matthew 28:19. The question is how the apostles understood and obeyed that command.\n\nAt Pentecost Peter said: repent, and be baptized every one of you in the name of Jesus Christ (Acts 2:38). In Samaria they had been baptized in the name of Jesus (Acts 8:16). Peter commanded Cornelius to be baptized in the name of the Lord Jesus (Acts 10:48). In Ephesus they were baptized in the name of the Lord Jesus (Acts 19:5). When Luke names the baptism, we repeatedly find Jesus, Jesus Christ, the Lord Jesus.\n\nDid the apostles contradict Matthew 28:19? Our interpretation is no. It is not reasonable to present Peter as disobeying an order Jesus had just given. Matthew records the command; Acts records the practice.\n\nPaul goes deeper: baptized into Jesus Christ, into His death, buried with Him by baptism (Romans 6:3-4). Baptized into Christ, put on Christ (Galatians 3:27). Buried with Him in baptism (Colossians 2:12).\n\nHolding Matthew 28:19 and Acts together, we understand that Christian baptism is centered in Jesus Christ, and that the apostles baptized identifying the believer with the name of Jesus. We do not erase Matthew 28:19. We keep it, and ask why the same disciples baptized in the name of Jesus Christ.\n\nWe also refuse to make baptism a fight over the words said over the water. Biblically it is bound to Christ, repentance, faith, forgiveness, identification with His death and resurrection, and new life.\n\nWe are not trying to win an argument. We want each person to examine how Jesus commanded it, how the apostles practiced it, and what meaning the New Testament gives it.",
    sides: [
      {
        name: "Our vision",
        mine: true,
        line: "Christian baptism is centered in Jesus Christ. Matthew 28:19 is kept. Acts shows how they obeyed it.",
        why: "We do not begin by saying “it must be trinitarian” or “it must be in Jesus’ name.” First we gather the texts. Then we form the interpretation.",
        sections: [
          {
            title: "Jesus commanded baptism",
            body: "Matthew 28:19: in the name —singular— of the Father, and of the Son, and of the Holy Spirit. No part is erased. The question is how the apostles obeyed it.",
          },
          {
            title: "The practice in Acts",
            body: "Acts 2:38, 8:16, 10:48, and 19:5 associate baptism with the name of Jesus, Jesus Christ, or the Lord Jesus. It is not an isolated case.",
          },
          {
            title: "Did they contradict Matthew 28:19?",
            body: "No. Matthew records the command; Acts records the practice. It is not reasonable to say Peter disobeyed what Jesus had just commanded.",
          },
          {
            title: "Baptized into Christ",
            body: "Romans 6, Galatians 3:27, and Colossians 2:12: identification with His death, burial, and resurrection. It is not only a phrase over the water.",
          },
        ],
        biblical: [
          "Baptizing them in the name of the Father, and of the Son, and of the Holy Spirit (Matthew 28:19).",
          "Eis to onoma: the name, singular.",
          "Be baptized in the name of Jesus Christ (Acts 2:38).",
          "Baptized in the name of Jesus (Acts 8:16).",
          "Baptized in the name of the Lord Jesus (Acts 10:48; 19:5).",
          "Baptized into Jesus Christ, into His death (Romans 6:3-4).",
          "Baptized into Christ, put on Christ (Galatians 3:27).",
          "Buried with Him in baptism (Colossians 2:12).",
        ],
        notBiblical: [
          "Starting with “it must be trinitarian” or “it must be in Jesus,” before opening the texts.",
          "Erasing Matthew 28:19 to hold Acts.",
          "Presenting the apostles as disobedient to the Lord.",
          "Reducing baptism to a fight over the words said over the water.",
        ],
      },
      {
        name: "A three-title formula",
        line: "Say “Father, Son, and Holy Spirit” as the words over the water.",
        biblical: ["Matthew 28:19 is in the Bible and is not erased."],
        notBiblical: [
          "That phrase does not appear over the water in Acts.",
          "Making the recipe the center, and not Christ, repentance, and new life.",
        ],
      },
    ],
  },
  cena: {
    title: "The Lord’s Supper",
    who: "What Jesus instituted and what Paul teaches first. Then the schools about the elements.",
    issue: "Remembrance, proclamation, communion, examination, and hope: Christ crucified, until He comes.",
    letter:
      "Our vision of the Lord’s Supper\n\nThe Lord’s Supper was instituted by Jesus Christ so that His disciples would remember His sacrifice, proclaim His death, and keep communion as the body of Christ until He returns.\n\nJesus took bread: Take, eat; this is my body (Matthew 26:26). He took the cup: this is my blood of the new covenant, shed for many for the remission of sins (Matthew 26:27-28). This do in remembrance of me (Luke 22:19).\n\nPaul: as often as you eat this bread and drink this cup, you proclaim the Lord’s death till He come (1 Corinthians 11:26). The bread looks to the body given; the cup, to His blood and the new covenant.\n\nThe Supper looks backward: we remember Christ’s death. Inward: we examine our life. Forward: we wait for His return.\n\nIt is not merely a ritual. Let a man examine himself, and so let him eat (1 Corinthians 11:28). In Corinth there were divisions, selfishness, and contempt. “Unworthily” does not mean only the perfect may partake. It speaks of taking part without discerning what the Supper means, or the gathered body.\n\nThe cup is the communion of the blood of Christ; the bread, of His body. Being many, we are one body (1 Corinthians 10:16-17). It is not only my private relation to Jesus: it declares our unity.\n\nDo the bread and wine become body and blood? Some teach real presence, some spiritual presence, some memorial. We do not make that difference a test of who belongs to Christ. The text does establish: Jesus commanded it, related the bread to His body and the cup to His blood, said do this in remembrance of Him, and Paul presents it as communion and proclamation.\n\nWho partakes? Those who have put their faith in Jesus Christ and want the communion of His body. Paul does not say “if anyone has sin, do not eat.” He says: examine yourself, and so eat. Examination leads to taking part rightly, not to automatic exclusion.\n\nChrist → His body given → His blood shed → new covenant → communion → personal examination → hope of His return.\n\nWe will not use the table to feed needless divisions. In a divided church Paul remembered: being many, we are one body. Remembrance, proclamation, communion, examination, and hope: we remember Christ crucified while we wait for Christ who comes.",
    sides: [
      {
        name: "Our vision",
        mine: true,
        line: "The Supper is remembrance, proclamation, communion, examination, and hope. The center is Christ, not a theory of the elements.",
        why: "Jesus instituted it. Paul hands it on. We do not start from transubstantiation or memorial: we start from the text.",
        sections: [
          {
            title: "Jesus instituted the Supper",
            body: "Bread: this is my body. Cup: my blood of the new covenant, shed for remission. Do this in remembrance of me.",
          },
          {
            title: "Back, inward, and forward",
            body: "We remember His death. We examine our life. We wait for His coming. As often as you eat and drink, you proclaim the Lord’s death till He come.",
          },
          {
            title: "Not only a rite",
            body: "Let each one examine himself, and so eat. Unworthily, in Corinth, was despising the gathered body. Examination leads to taking part well, not staying away by default.",
          },
          {
            title: "Communion of the body",
            body: "One bread, one body. The Supper declares unity, not only private piety.",
          },
        ],
        biblical: [
          "Take, eat; this is my body. This is my blood of the new covenant (Matthew 26:26-28).",
          "This do in remembrance of me (Luke 22:19).",
          "You proclaim the Lord’s death till He come (1 Corinthians 11:26).",
          "Let a man examine himself, and so let him eat (1 Corinthians 11:28).",
          "Communion of the blood and body of Christ; one bread, one body (1 Corinthians 10:16-17).",
        ],
        notBiblical: [
          "Making a theory of the elements a test of salvation.",
          "Reducing “unworthily” to “only the perfect may eat.”",
          "Using the table to divide the church.",
          "Treating the Supper as an empty rite, without Christ or the body.",
        ],
      },
      {
        name: "Real presence / transubstantiation",
        line: "The bread and wine become, or contain, the body and blood of Christ.",
        biblical: ["Jesus said: this is my body; this is my blood."],
        notBiblical: [
          "A verse that explains a change of substance as dogma. That is a school, not the plain text.",
        ],
      },
      {
        name: "Memorial",
        line: "The bread and the cup remember; they do not become.",
        biblical: [
          "This do in remembrance of me (Luke 22:19).",
          "You proclaim the Lord’s death (1 Corinthians 11:26).",
        ],
        notBiblical: [
          "Emptying “this is my body” until only a symbol remains, without communion (1 Corinthians 10:16).",
        ],
      },
    ],
  },
  diezmo: {
    title: "Tithe and offerings",
    who: "Before the Law, under the Law, and what Jesus and the apostles teach. Without laying a burden.",
    issue: "Under the Law, the tithe is established. Under the New Covenant: generosity, proportion, freedom, and responsibility.",
    letter:
      "Our vision of the tithe and offerings\n\nThe tithe is studied through the whole Bible: what happened before the Law, what God commanded Israel under Moses, and what Jesus and the apostles taught. The purpose is not to impose an economic burden, but to see what the Scriptures teach.\n\nBefore the Law, Abram gave tithes of all to Melchizedek (Genesis 14:20). It describes what Abraham did; it does not command every believer to give 10% of income forever. Jacob vowed: of all that you give me I will give the tenth (Genesis 28:22). A personal vow, not universal legislation.\n\nUnder the Law the tithe belongs to the covenant. The tithe of the land is the LORD’s (Leviticus 27:30). Tithes were given to the Levites, who had no inheritance like the other tribes (Numbers 18:21). Deuteronomy also speaks of feasts and of Levites, strangers, orphans, and widows. It was wider than handing 10% of a wage to a religious leader.\n\nMalachi 3:10 lives inside God’s covenant with Israel: temple, priests, Levites, and the Law. It is not sound method to take it in isolation and say it binds every Christian under the New Covenant to 10% of salary.\n\nJesus told scribes and Pharisees they tithed mint and left the weightier matters of the law: justice, mercy, and faith (Matthew 23:23). He did not condemn those Jews for tithing. He was speaking to people under Moses, before His death and the New Covenant. By itself that verse does not settle whether Gentile Christians were bound to exactly 10%.\n\nThe apostles teach giving, but they do not command: every Christian must give exactly ten percent. Paul: on the first day, as he has prospered (1 Corinthians 16:2). Each one as he purposes in his heart: not grudgingly or of necessity; God loves a cheerful giver (2 Corinthians 9:7). Christian giving is voluntary, conscious, proportional, generous, and cheerful.\n\nMust the ministry be supported? Yes. The Lord ordained that those who preach the gospel should live of the gospel (1 Corinthians 9:14). Let him who is taught share all good things with him who teaches (Galatians 6:6). There is also help for the needy, the poor, and widows.\n\nThe 10% was an explicit institution of the Mosaic covenant. Abraham and Jacob show a tenth before Moses, but not a universal command to the church. In the New Testament the believer must give generously and support the work. There is no unequivocal apostolic mandate of 10% as a requirement. Anyone may use 10% as a personal reference. He may even give more.\n\nThere is not enough ground to teach that a person automatically loses salvation for not giving exactly 10%. Greed is treated seriously. Making a specific percentage a condition of salvation is a claim the New Testament does not make.\n\nOur vision is not “you need not give.” It is the opposite: a heart so generous that the question is no longer “what is the minimum?” but “how can I use what God entrusted, to serve others and advance His work?” Whoever gives 10% may do it as a discipline of generosity. Whoever gives otherwise must do it responsibly, not grudgingly or of necessity.\n\nWe do not impose the tithe as a condition of salvation, nor condemn the one who practices it. We teach giving with freedom, responsibility, generosity, and joy.",
    sides: [
      {
        name: "Our vision",
        mine: true,
        line: "Not “you need not give.” Give with freedom, proportion, and joy. 10% is not a condition of salvation.",
        why: "The whole Bible is walked. The tithe is not used to impose a burden. The question is what the Scriptures actually teach.",
        sections: [
          {
            title: "Before the Law",
            body: "Abraham gave tithes to Melchizedek. Jacob made a vow. Narrative and vow, not a universal command to the church.",
          },
          {
            title: "Under the Law",
            body: "The tithe belongs to the covenant with Israel: Levites, temple, land, the poor. Malachi 3:10 lives there. It is not isolated for the Christian’s wage.",
          },
          {
            title: "Jesus and the apostles",
            body: "Matthew 23:23 speaks to Jews under the Law. Paul teaches giving as one has prospered, as he purposes in his heart, not of necessity. The ministry is supported.",
          },
        ],
        biblical: [
          "Abram gave him tithes of all (Genesis 14:20).",
          "The tithe of the land is the LORD’s (Leviticus 27:30).",
          "Tithes to the Levites for their ministry (Numbers 18:21).",
          "Bring the tithes into the storehouse (Malachi 3:10), in the covenant with Israel.",
          "Justice, mercy, and faith weigh more than tithing herbs (Matthew 23:23).",
          "As he has prospered (1 Corinthians 16:2).",
          "As he purposes in his heart: not grudgingly, or of necessity (2 Corinthians 9:7).",
          "They who preach the gospel should live of the gospel (1 Corinthians 9:14).",
          "Share all good things with him who teaches (Galatians 6:6).",
        ],
        notBiblical: [
          "Taking Malachi 3:10 in isolation as a 10% law for every Christian.",
          "“If you do not give 10% there is no blessing,” or “you lose salvation.”",
          "“You need not give”: that is not in the New Testament either.",
          "Making giving the center of the gospel, or a grudging minimum.",
        ],
      },
      {
        name: "Tithe as church law",
        line: "10% is a command, and if you do not give you are robbing God.",
        biblical: [
          "The tithe of the land is the LORD’s (Leviticus 27:30) — under Moses.",
          "Malachi 3:10, said to Israel with temple and priests.",
        ],
        notBiblical: [
          "An apostolic command: “every Christian, exactly 10% of all income.”",
          "Using Malachi to sell miracles or to bind salvation to a percentage.",
        ],
      },
    ],
  },
  apostoles: {
    title: "Apostles, prophets, and prophecy",
    who: "Distinguish office, gift, and what the text says from what we infer.",
    issue: "Apostles: foundation laid. Prophets: not that revelatory office. Gift of prophecy: still given, and it is judged.",
    letter:
      "Our vision of apostles, prophets, and prophecy\n\nWe distinguish the ministry of apostle, the ministry of prophet, and the gift of prophecy. They are not interchangeable terms.\n\nThe apostles fulfilled a foundational function. The church is built on the foundation of the apostles and prophets; the chief cornerstone is Jesus Christ (Ephesians 2:20). A foundation is laid to establish the building; it is not laid again and again. Revelation 21:14 gives a singular place to the twelve apostles of the Lamb. So the foundational apostolic ministry has served its purpose. We do not recognize today persons with the position and authority of Peter, John, Paul, and the New Testament apostles.\n\nGod spoke of old by the prophets; in these last days He has spoken by the Son (Hebrews 1:1-2). In Christ the culminating revelation arrives. The veil was torn (Matthew 27:51). By the blood of Jesus we have boldness to enter the Holiest (Hebrews 10:19-20). The Christian does not need a prophet as intermediary between him and God. The prophet’s ministry as revelatory authority comparable to the biblical prophets does not continue in that way.\n\nA precision: the torn veil shows direct access to God through Christ. The New Testament does not say explicitly: “because the veil was torn, the office of prophet ceased.” That is our doctrinal inference, not a textual statement.\n\nThe gift of prophecy continues. Desire spiritual gifts, but rather that you may prophesy (1 Corinthians 14:1). He who prophesies speaks to men for edification, exhortation, and comfort (1 Corinthians 14:3). The Spirit may still give that gift. To prophesy does not automatically make someone a prophet. You may all prophesy one by one (1 Corinthians 14:31); that does not make all of them prophets by office. One may teach without being “the teacher,” and one may prophesy without being “the prophet” of the congregation.\n\nAll prophecy must be judged. Let the prophets speak two or three, and let the others judge (1 Corinthians 14:29). Despise not prophesyings. Prove all things; hold fast that which is good (1 Thessalonians 5:20-21). Try the spirits (1 John 4:1). No prophecy sits above the Word. It does not establish another gospel.\n\nChrist is enough. Access to God is through Him. We do not need new apostles to lay the foundation again, nor prophets as necessary intermediaries. We also do not quench the Spirit or despise prophesyings. What someone claims to have received from God is examined. To prophesy does not make a prophet, and no contemporary prophecy corrects, replaces, or sits above Scripture.",
    sides: [
      {
        name: "Our vision",
        mine: true,
        line: "Apostolic office: foundational, fulfilled. Prophet as revelatory authority: no. Gift of prophecy: yes, judged by the Word.",
        why: "Apostle, prophet, and prophecy are not the same. Text and inference are marked apart.",
        sections: [
          {
            title: "The apostles",
            body: "Foundation of the church. The twelve of the Lamb. It is not laid again. We do not recognize that authority today.",
          },
          {
            title: "The ministry of prophet",
            body: "God has spoken by the Son. Direct access through Christ. A prophet as intermediary is not needed. That revelatory office does not continue that way.",
          },
          {
            title: "The gift of prophecy",
            body: "It remains. It edifies, exhorts, comforts. To prophesy is not to be a prophet. All prophecy is judged by Scripture.",
          },
        ],
        biblical: [
          "Built on the foundation of the apostles and prophets; the stone is Christ (Ephesians 2:20).",
          "The twelve apostles of the Lamb (Revelation 21:14).",
          "In these last days spoken by the Son (Hebrews 1:1-2).",
          "The veil was torn; entrance into the Holiest by the blood of Jesus (Matthew 27:51; Hebrews 10:19-20).",
          "Desire that you may prophesy; it is for edification, exhortation, and comfort (1 Corinthians 14:1, 3).",
          "You may all prophesy one by one (1 Corinthians 14:31).",
          "Let two or three speak, and let the others judge (1 Corinthians 14:29).",
          "Despise not prophesyings. Prove all things (1 Thessalonians 5:20-21).",
          "Try the spirits (1 John 4:1).",
        ],
        notBiblical: [
          "“Because the veil was torn, the office of prophet ceased”: the NT does not say that. It is our inference, not a textual statement.",
          "“God never speaks to anyone”: that quenches what Paul tells us to desire.",
          "“God told me” as authority over the church, without examination.",
          "That prophesying automatically makes you the prophet of the congregation.",
        ],
      },
      {
        name: "Fivefold offices still standing",
        line: "There are apostles and prophets as an office, with authority over the church today.",
        biblical: [
          "He gave apostles, prophets, evangelists, pastors and teachers (Ephesians 4:11).",
        ],
        notBiblical: [
          "Equating that text with the authority of the Twelve or of prophets who wrote Scripture.",
          "A necessary intermediary again, when Hebrews opens the Holiest through Christ.",
        ],
      },
    ],
  },
  "mujer-ministerio": {
    title: "Women and pastoral ministry",
    who: "Equal dignity. Distinct functions. Not inferiority.",
    issue: "Equality in Christ → diversity of functions → pastoral government reserved to the qualified man → Christ the head of all.",
    letter:
      "Our vision of women and pastoral ministry\n\nMen and women have equal dignity and worth before God, share salvation in Jesus Christ, and may be used by the Holy Spirit. There is neither male nor female; you are all one in Christ Jesus (Galatians 3:28). Equal worth does not necessarily mean identical functions in the government of the congregation.\n\nGod uses women. Priscilla, with Aquila, expounded to Apollos the way of God more perfectly (Acts 18:26). Phoebe is a diakonos of the church at Cenchrea (Romans 16:1). Philip’s daughters prophesied (Acts 21:9). Women prayed and prophesied in the congregation (1 Corinthians 11:5). Titus 2: older women teach what is good and train other women. We do not read Scripture as if God forbade women to speak, teach in every setting, prophesy, evangelize, disciple, or serve.\n\nOur distinction is in pastoral government. Scripture reserves to the qualified man the responsibility of elder or bishop who exercises doctrinal and pastoral government. A bishop, husband of one wife (1 Timothy 3:1-2). Elders: blameless, husband of one wife (Titus 1:5-6). 1 Timothy 2:11-12: I do not permit a woman to teach, nor to exercise authority over the man. We read this as a restriction on authoritative teaching and congregational government, not a ban on every form of teaching. That harmonizes with Priscilla, Titus 2, and women who prophesied.\n\nIt is not male superiority. Peter: feed the flock, not as lords, but as examples (1 Peter 5:2-3). Pastoral authority is responsibility, service, teaching, care, and accountability; not abusive rule. Jesus Christ is the head of the church.\n\nThere is another reading: 1 Timothy 2 and 1 Corinthians 14 as circumstances of those churches, and therefore female pastorate. We do not adopt it. Paul’s argument in 1 Timothy 2:13 goes back to Adam and Eve, not only to Ephesus. There is a principle of church order that outruns that congregation. That difference does not authorize us to despise women or deny the gifts God has given them.\n\nGod calls women to serve, disciple, teach within biblical order, evangelize, prophesy, serve in diaconal functions, and build up the body. The office of pastor, elder, or bishop with doctrinal and governing authority belongs to the man who meets the biblical qualifications. Therefore we do not ordain women to the pastoral ministry. Not because a woman is less able, less spiritual, or less valuable, but because of our reading of ministerial order. Man and woman obey Christ and use their gifts under His authority.",
    sides: [
      {
        name: "Our vision",
        mine: true,
        line: "Equal worth. Women serve, teach, and prophesy. Pastoral eldership: the qualified man. Christ is the head.",
        why: "Not inferiority. An order of ministerial authority in certain New Testament texts.",
        sections: [
          {
            title: "Equality and service",
            body: "One in Christ. Priscilla instructs. Phoebe serves. Philip’s daughters prophesy. Older women teach others. No general ban on voice or ministry.",
          },
          {
            title: "Pastoral government",
            body: "Bishop and elder: husband of one wife. 1 Timothy 2: authoritative teaching and government, not every form of teaching.",
          },
          {
            title: "Not lordship",
            body: "Elders feed as examples, not as owners. The head is Christ.",
          },
        ],
        biblical: [
          "You are all one in Christ Jesus (Galatians 3:28).",
          "Priscilla and Aquila expounded the way more perfectly (Acts 18:26).",
          "Phoebe, a servant of the church at Cenchrea (Romans 16:1).",
          "Philip’s daughters prophesied (Acts 21:9).",
          "The woman who prays or prophesies (1 Corinthians 11:5).",
          "Older women, teachers of good things (Titus 2:3-5).",
          "A bishop, husband of one wife (1 Timothy 3:1-2; Titus 1:5-6).",
          "I suffer not a woman to teach, nor to usurp authority over the man; Adam first, then Eve (1 Timothy 2:11-13).",
          "Feed the flock, not as lords, but as examples (1 Peter 5:2-3).",
        ],
        notBiblical: [
          "That a woman is worth less, is less spiritual, or cannot be used by God.",
          "Forbidding all teaching, prophecy, evangelism, or service by women.",
          "Turning the pastorate into abusive male rule.",
          "Despising those who read these texts another way.",
        ],
      },
      {
        name: "Women as pastors",
        line: "1 Timothy 2 and 1 Corinthians 14 as circumstances of those churches; a woman may pastor.",
        biblical: [
          "One in Christ, neither male nor female (Galatians 3:28).",
          "Women who prophesy and teach in the NT.",
        ],
        notBiblical: [
          "Passing over that 1 Timothy 2:13 appeals to Adam and Eve, not only to Ephesus.",
          "Making female pastorate a test of who loves women.",
        ],
      },
    ],
  },
  arrebatamiento: {
    title: "The rapture",
    who: "What is clear first. Then the schools about when.",
    issue: "Christ will return → the dead in Christ will rise → believers will be gathered to Him.",
    letter:
      "Our vision of the rapture\n\nScripture clearly teaches that Jesus Christ will return and that believers will be gathered to Him. The Lord Himself will descend; the dead in Christ will rise, and we will be caught up to meet the Lord in the air (1 Thessalonians 4:16-17). We shall not all sleep, but we shall all be changed, at the last trump (1 Corinthians 15:51-52).\n\nOur basic hope does not hang on one eschatological school: Christ will return, the dead in Christ will rise, and believers will be gathered to Him.\n\nThe difference is when the rapture occurs in relation to the great tribulation. Three schools:\n\nPre-tribulation: Christ catches up His church before the great tribulation. Texts: 1 Thessalonians 1:10; 4:13-18; 5:9; Revelation 3:10.\n\nMid-tribulation: the rapture during the tribulation, often near the midpoint, with attention to the trumpets.\n\nPost-tribulation: the church goes through the great tribulation, and the rapture is bound to the visible coming of Christ. Matthew 24:29-31: immediately after the tribulation of those days He will gather His elect.\n\nWhat all three can affirm: Christ will return, the dead in Christ will rise, believers will be gathered to Him, and we will be with the Lord. The exact chronology should not divide those who confess Jesus Christ.\n\nWe recognize the three schools and urge each believer to study the Scriptures. Our readiness must not depend on getting the calendar right. If Christ gathers His church before the tribulation, we must be ready. If the church must face persecution, we must remain faithful. If she remains until after, we must endure to the end.\n\nOur faith rests in Jesus Christ. Wait for Christ as if He could come at any moment, and stand firm as if we had to pass through the hardest trial. Be ready: the Son of Man comes at an hour you do not think (Matthew 24:44).",
    sides: [
      {
        name: "Our vision",
        mine: true,
        line: "Wait for Christ as if He could come now, and stand firm as if the hardest trial were still ahead.",
        why: "What is clear is the coming, the resurrection, and the gathering. When it falls relative to the tribulation must not divide us or hold our faith.",
        sections: [
          {
            title: "What is clear",
            body: "Christ will return. The dead in Christ will rise. Believers will be gathered to Him. 1 Thessalonians 4 and 1 Corinthians 15.",
          },
          {
            title: "The three schools",
            body: "Pre-tribulation: before the judgment. Mid-tribulation: at the midpoint. Post-tribulation: after, with the visible coming. Each cites Scripture. None is the gospel.",
          },
          {
            title: "What they share",
            body: "Christ will return → the dead will rise → believers will be gathered to Him → we will be with the Lord.",
          },
        ],
        biblical: [
          "The Lord will descend; we will be caught up to meet Him in the air (1 Thessalonians 4:16-17).",
          "We shall all be changed at the last trump (1 Corinthians 15:51-52).",
          "Be ready; He comes at an hour you do not think (Matthew 24:44).",
        ],
        notBiblical: [
          "Making chronology a cause of division.",
          "Resting assurance on getting the calendar right, not on Christ.",
          "Saying that only one school is Christian.",
        ],
      },
      {
        name: "Pre-tribulation",
        line: "The church is caught up before the great tribulation.",
        biblical: [
          "Jesus delivers us from the wrath to come (1 Thessalonians 1:10).",
          "God has not appointed us to wrath (1 Thessalonians 5:9).",
          "I will keep you from the hour of trial (Revelation 3:10).",
        ],
        notBiblical: [
          "A verse that says: “seven years prior, the whole church goes.” That is a system.",
        ],
      },
      {
        name: "Mid-tribulation",
        line: "The rapture at the midpoint of the tribulation, often with the trumpets.",
        biblical: [
          "The last trump of 1 Corinthians 15:52, read with the course of Revelation.",
        ],
        notBiblical: [
          "A verse that fixes the midpoint as law. There are variants inside this school.",
        ],
      },
      {
        name: "Post-tribulation",
        line: "The church goes through the tribulation; the rapture is bound to the visible coming.",
        biblical: [
          "After the tribulation of those days He will gather His elect (Matthew 24:29-31).",
          "Our gathering to Him, and first the falling away (2 Thessalonians 2:1-4).",
        ],
        notBiblical: [
          "Identifying the “elect” of Matthew 24 with the whole church as if there were no debate.",
        ],
      },
    ],
  },
  salvacion: {
    title: "Can you lose salvation?",
    who: "When they give license to sin, or take away all assurance.",
    issue: "Jesus gives eternal life. Sin is disciplined. Falling is not permission.",
    letter:
      "If you were born of God, you are a child. Jesus gives eternal life and no one snatches them from His hand. That is not license. If we sin willfully, there is judgment. Confess and return. Whoever never returns shows he was not born again.",
    sides: [
      {
        name: "A child, and no license",
        mine: true,
        line: "Eternal life in Christ’s hand. Sin is not celebrated.",
        why: "John 10 and Romans 8 give assurance. Hebrews 10 and 1 John 1 remove the party.",
        biblical: [
          "I give them eternal life; they shall never perish (John 10:28).",
          "Nothing separates us from the love of God (Romans 8:38-39).",
          "If we sin willfully, judgment remains (Hebrews 10:26).",
        ],
        notBiblical: [
          "“Sin, you’re saved anyway.”",
          "“One stumble and you are no longer a child.”",
        ],
      },
    ],
  },
  "fe-obras": {
    title: "Faith or works",
    who: "When they say being good is enough, or that faith asks for nothing.",
    issue: "Faith saves, not works. A living faith is seen.",
    letter:
      "By grace you are saved through faith, not by works. Faith without works is dead. Works do not buy; they show there is life. Believe on the Lord Jesus.",
    sides: [
      {
        name: "Grace that is seen",
        mine: true,
        line: "Faith to enter. Works as fruit, not as payment.",
        why: "Ephesians 2 closes payment. James 2 closes empty faith.",
        biblical: [
          "By grace, through faith, not of works (Ephesians 2:8-9).",
          "Justified by the faith of Christ, not by the law (Galatians 2:16).",
          "Faith without works is dead (James 2:17).",
        ],
        notBiblical: [
          "Earning heaven by conduct.",
          "A faith that never touches the life and is still called faith.",
        ],
      },
    ],
  },
  espiritu: {
    title: "The Holy Spirit",
    who: "Presence, filling, and gifts: related, not identical.",
    issue: "The Spirit in us → communion → continual filling → fruit → gifts as He wills.",
    letter:
      "Our vision of the Holy Spirit, His filling, and His gifts\n\nThree related things must be distinguished: the Spirit’s presence in the believer, the filling of the Spirit, and spiritual gifts. Confusing them turns an experience or a gift into a measure of salvation or spirituality.\n\nThe Spirit in the believer. Jesus: He dwells with you, and shall be in you (John 14:17). If any man have not the Spirit of Christ, he is none of His (Romans 8:9). You are the temple of God (1 Corinthians 3:16). God with man → God among men in Christ → God in man by His Spirit. The purpose is not only the supernatural: until Christ be formed in you (Galatians 4:19).\n\nTo be filled is a life of communion. One thing is that the Spirit dwells; another is to live filled and governed by Him. Be filled with the Spirit (Ephesians 5:18). Not percentages of God: more and more of the life is yielded to His direction. Abide in me (John 15:4). Prayer, the Word, obedience, and worship are that relation. In Acts 2 they were filled; in Acts 4:31 they were filled again. We seek a filled life, not only one experience. The fruit: love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, temperance (Galatians 5:22-23).\n\nThe gifts continue. Wisdom, knowledge, faith, healings, miracles, prophecy, discerning of spirits, tongues, interpretation (1 Corinthians 12). Romans 12 adds service. The same Spirit divides to every man as He will (1 Corinthians 12:11). Not all have the same gift. Do all speak with tongues? Do all interpret? (1 Corinthians 12:30).\n\nA gift does not automatically confirm salvation. Many will say: have we not prophesied in thy name, and done many wonderful works? And the Lord: I never knew you (Matthew 7:22-23). Nor is one gift the universal proof of Spirit baptism: He divides as He will.\n\nGifts and fruit are not the same. Corinth came behind in no gift, and Paul still calls them carnal. The gift shows how God may use us. The fruit, how He is changing us. We need both; we must not confuse them.\n\nEvery manifestation is examined. Quench not the Spirit. Despise not prophesyings. Prove all things; hold fast that which is good (1 Thessalonians 5:19-21). The Word remains the rule.\n\nGod dwells in the believer. We seek to be filled through a yielded life. Gifts remain, sovereign, for the body. We do not make a particular gift a test of salvation, a universal confirmation of Spirit baptism, or a measure of spiritual rank. The goal is not only to manifest gifts: to know God, abide in Christ, and let the Spirit form the character of Jesus. We do not merely seek to have more of God; we seek that God would have more of us.",
    sides: [
      {
        name: "Our vision",
        mine: true,
        line: "The Spirit dwells. Filling is continual communion. Gifts remain, as He wills. Neither a ticket nor a shutdown.",
        why: "Presence, filling, and gifts are not the same. Confusing them measures people by an experience.",
        sections: [
          {
            title: "The Spirit in the believer",
            body: "He shall be in you. If any have not the Spirit of Christ, he is none of His. Temple of God. Until Christ be formed in you.",
          },
          {
            title: "Filling as communion",
            body: "Be filled. Abide in me. Not once only: Acts 2 and Acts 4. Fruit is the character of Christ.",
          },
          {
            title: "Gifts as He wills",
            body: "They continue. Not all the same. A gift does not prove salvation. Gifts and fruit are not confused. Prove all things; do not quench the Spirit.",
          },
        ],
        biblical: [
          "He dwells with you, and shall be in you (John 14:17).",
          "If any have not the Spirit of Christ, he is none of His (Romans 8:9).",
          "You are the temple of God (1 Corinthians 3:16).",
          "Until Christ be formed in you (Galatians 4:19).",
          "Be filled with the Spirit (Ephesians 5:18).",
          "Abide in me (John 15:4).",
          "They were all filled… and spoke the word with boldness (Acts 4:31).",
          "The fruit of the Spirit (Galatians 5:22-23).",
          "Dividing to every man as He will (1 Corinthians 12:11).",
          "Do all speak with tongues? (1 Corinthians 12:30).",
          "Have we not prophesied…? I never knew you (Matthew 7:22-23).",
          "Despise not prophesyings. Prove all things (1 Thessalonians 5:20-21).",
        ],
        notBiblical: [
          "That a gift, especially tongues, is proof of salvation or of Spirit baptism.",
          "That all must manifest the same gift.",
          "Measuring spirituality by a show, and not by fruit.",
          "Quenching the Spirit, or accepting without examination everything someone attributes to God.",
        ],
      },
      {
        name: "Tongues as evidence",
        line: "Everyone baptized in the Spirit speaks in tongues.",
        biblical: ["In Acts 2 they spoke with other tongues."],
        notBiblical: [
          "Paul asks: do all speak with tongues? The expected answer is no (1 Corinthians 12:30).",
          "Making a gift the measure of who belongs to Christ (Matthew 7:22-23).",
        ],
      },
      {
        name: "The gifts ceased",
        line: "Miraculous gifts ended with the apostles.",
        biblical: ["Scripture is sufficient for doctrine and life."],
        notBiblical: [
          "A verse that says: “after the apostles, no gift.” Paul says quench not the Spirit.",
        ],
      },
    ],
  },
  infierno: {
    title: "Hell",
    who: "When they deny judgment, or use it as a stick.",
    issue: "Hell is real. It is preached so they flee to Christ.",
    letter:
      "Hell is not a tale. Everlasting punishment and life eternal use the same word: eternal. Whoever is not in the book of life is cast into the lake of fire. That is why Christ came: that you should not perish, but have everlasting life.",
    sides: [
      {
        name: "Real judgment",
        mine: true,
        line: "There is a lake of fire. There is eternal life. The center is still Christ, not fear.",
        why: "Jesus said it. The same “eternal” goes to punishment and to life.",
        biblical: [
          "Everlasting punishment and life eternal (Matthew 25:46).",
          "The rich man in torments (Luke 16:23-24).",
          "Lake of fire (Revelation 20:15).",
        ],
        notBiblical: [
          "“In the end everyone is saved.”",
          "Using hell as a show, without calling to Christ.",
        ],
      },
    ],
  },
};

export function localizedDoctrine(entry: DoctrineTopic, locale: Locale): DoctrineTopic {
  if (locale !== "en") return entry;
  const en = DOCTRINE_EN[entry.id];
  if (!en) return entry;
  return { ...entry, ...en };
}

export function doctrineVerses(entry: DoctrineTopic, locale: Locale = "es") {
  return entry.verseIds
    .map((id) => getVerseById(id))
    .filter((verse): verse is Verse => Boolean(verse))
    .map((verse) => localizeVerse(verse, locale));
}

export async function doctrineMessageVerse(
  entry: DoctrineTopic,
  locale: Locale = "es",
): Promise<Verse> {
  const localized = localizedDoctrine(entry, locale);
  const hydrated = await hydrateVerses(doctrineVerses(entry, locale), locale);
  const lines = [localized.letter, ""];
  for (const verse of hydrated) {
    lines.push(`«${verse.text}»`);
    lines.push(`— ${verse.ref}`);
    lines.push("");
  }
  return {
    id: `doctrina-${entry.id}`,
    ref: localized.title,
    book: t(locale, "doctrine"),
    text: lines.join("\n").trim(),
    themes: ["evangelio"],
    source: recobroSource(locale),
  };
}
