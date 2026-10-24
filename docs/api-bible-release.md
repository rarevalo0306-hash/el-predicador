# LBLA / API.Bible — preparación de publicación

Fecha de revisión: 23–24 de octubre de 2026. Bible ID fijado: `e3f420b9665abaeb-01`. Texto en español también cuando la interfaz está en inglés; no se traduce ni parafrasea.

## Implementado

- El lector, las tarjetas y las referencias consultan exclusivamente API.Bible desde el backend. Recobro/LSM ya no son proveedores ni fallbacks. Se conservan nombres internos y los IDs `rcv-` por compatibilidad con favoritos históricos; no identifican la traducción actual.
- Variable secreta `API_BIBLE_KEY`, nunca `VITE_*` ni `NEXT_PUBLIC_*`. Confirmada en Vercel para Production y Preview sin revelar su valor. Production exige una base persistente; no usa la base efímera PGLite para contabilizar consumo.
- Caché compartida PostgreSQL por capítulo, con caducidad de **28 días**. No se sirve contenido caducado, incluso si el proveedor falla o se agota la cuota. La siguiente lectura lo renueva; el cron existente elimina entradas vencidas. No descarga ni precarga la Biblia completa. La revisión posterior encontró precarga de capítulos vecinos en BibleView; ver H2.
- Cada intento HTTP, incluso fallido, reserva una llamada de forma atómica en una ventana móvil de 31 días. Corte en **4.900**, dejando 100 de margen respecto de 5.000. El límite es compartido entre instancias y entre idiomas. La app no puede contabilizar llamadas que otras aplicaciones hagan con la misma cuenta; dedicarle esta clave y comprobar el panel del proveedor.
- Las consultas simultáneas se agrupan en el proceso y una concesión temporal en la base impide duplicarlas entre procesos. Sin reintentos automáticos. Un 429 del proveedor detiene nuevas llamadas de forma conservadora durante 31 días; requiere revisión del contador antes de reducir el bloqueo. Los capítulos aún vigentes siguen disponibles desde la caché del servidor.
- JSON estructurado del proveedor, con fragmentos de texto conservados exactamente. El backend rechaza respuestas sin copyright o de otra Biblia/capítulo. React escapa el texto; no ejecuta HTML/scripts recibidos del proveedor.
- Copyright oficial de la respuesta al lado de cada tarjeta, pasaje y capítulo, más enlace visible a API.Bible. No se inventa ni sustituye el aviso del titular.
- Informes FUMS conforme a los formatos documentados del proveedor (token actual y `fumsId` heredado); nunca se envían correo, cuenta o contactos a FUMS. Política de privacidad actualizada para el uso anónimo de lectura. Su funcionamiento con una respuesta real queda por validar.
- Favoritos y estado sincronizado guardan referencias, sin copias permanentes de las Escrituras. La migración retira el antiguo caché generado y conserva los metadatos. Las lecturas históricas de versiones retiradas deben buscarse por referencia si ya no se pueden resolver.
- Retiradas las comparaciones activas de NVI/Recobro y TNM. Las guías usan referencias; los textos de LBLA se abren en el lector licenciado.
- IA bloqueada en los endpoints y en todas las funciones que podrían llamar a DeepSeek, incluso con clave y consentimiento. El proveedor prohíbe usar texto protegido como contexto de LLM, además del entrenamiento y conversión por IA a audio.
- Sin captura nativa de selección bíblica para uso offline: biblioteca de notas personales solamente. Compartir y programar desde una lectura LBLA entrega referencias/enlace; imágenes e impresión de su texto no están habilitadas. No se atribuyen a LBLA las notas del usuario.
- Sin anuncios, suscripciones, patrocinios, compras o funciones premium. Monetizar requiere cambiar el plan y revisar primero la licencia comercial; no basta habilitar pagos en la tienda.

## Hallazgos de la revisión arquitectónica posterior

La denegación de IA no garantiza que no haya efectos previos: `prepareVerseNotes` puede hidratar y escribir `verse_texts` antes de llegar al bloqueo de generación. Es un pendiente prioritario, no un camino validado como seguro. También permanece la precarga de capítulos vecinos en el lector. Véanse H1 y H2 en [hallazgos para el rediseño](revision-y-rediseno.md). Estos puntos refinan las afirmaciones de preparación anteriores y deben resolverse antes de publicar.

## Validación y pendientes reales

`npm run test:bible` prueba con respuestas sintéticas el agrupamiento de 20 consultas, conservación literal de texto/copyright, caducidad, caché compartida, concurrencia al reservar la última llamada, bloqueo 429 y denegación de IA. No usa la clave real ni consume llamadas de la cuenta.

Antes de promover: desplegar esta rama en un entorno con `DATABASE_URL` persistente y `API_BIBLE_KEY`, ejecutar las migraciones y abrir un capítulo LBLA real. Se confirmó visualmente en API.Bible que The Preacher APP tiene Starter y La Biblia de las Américas añadida por $0. El panel mostraba 0/5K llamadas y renovación el 4 de noviembre de 2026. Una consulta real en la consola oficial devolvió Génesis 1, Bible ID correcto, JSON estructurado, 31 versículos y el aviso: «La Biblia de las Américas Copyright © 1986, 1995, 1997 by The Lockman Foundation Derechos Reservados All Rights Reserved». Se consumió una consulta de validación fuera del contador local. Falta verificar el recorrido mediante el backend desplegado y FUMS. Preview actualmente muestra clave pero no una variable DATABASE_URL; no conectar Preview a datos de producción solo para probar.

No están habilitadas la búsqueda global de palabras, las descargas completas, la lectura LBLA offline ni las funciones de IA con su texto. La búsqueda por libro/capítulo/referencia está implementada. Las funciones retiradas requieren una implementación/licencia específica antes de reintroducirse. Los envíos fijos históricos se pausan de forma reversible para evitar enviar una traducción retirada; el titular debe revisarlos.

Conservar evidencia del plan/entitlement, revisar privacidad de API.Bible/FUMS para App Privacy y confirmar que la licencia cubre la distribución móvil antes de enviar a Apple. Las pruebas locales no son una autorización editorial ni una aprobación de App Review.

## Fuentes oficiales consultadas

- [Caché y plazo máximo](https://care.api.bible/article/401-caching-content)
- [Licencia Express: atribución, integridad e IA](https://care.api.bible/article/405-express-licensing-faqs)
- [Límites mensuales](https://docs.api.bible/quick-start/rate-limiting/)
- [JSON y copyright por capítulo](https://docs.api.bible/guides/chapters/)
- [Formatos de contenido](https://docs.api.bible/resources/content-output-formats/)
- [Informes FUMS](https://docs.api.bible/resources/fair-use/)
- [Condiciones y uso no comercial](https://api.bible/terms-and-conditions)
