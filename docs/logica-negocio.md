# Producto y lógica de negocio

Base de evidencia: código local descrito en [contexto técnico](contexto-tecnico.md). “Implementado” significa presente en código; no confirma configuración o validación externa.

## Propósito y actores

La app facilita lectura diaria, consulta de pasajes, organización de referencias y comunicación de contenido cristiano. El contenido doctrinal incluye posiciones editoriales y comparación de enseñanzas. El rediseño debe distinguir Escrituras licenciadas, explicación editorial y notas del usuario; no reinterpretar ni reemplazar la doctrina como una decisión visual.

| Actor | Capacidades | Restricción |
| --- | --- | --- |
| Invitado | Lectura pública, temas, guías, estado personal local, compartir manualmente, registro público | Sin sincronización de cuenta ni autorización automática Twilio |
| Miembro | Lo anterior más estado en nube, perfil y eliminación | Solo datos propios |
| Gestor | Admin con nombres reducidos, conteos de cuentas y acceso de mensajería añadido por servidor | No recibe correos/teléfonos/direcciones completos en overview; no concede roles |
| Propietario | Overview completo, nombrar/quitar gestores, herramientas editoriales | Propiedad definida por configuración servidor; IA sigue bloqueada |
| Emisor autorizado | Programaciones si proveedor, canal, consentimiento y scheduler están listos | Allowlist o gestor; no es equivalente a cualquier cuenta registrada |

El propietario no se agrega automáticamente a `MESSAGING_ALLOWED_USER_IDS` por `messagingConfig`: su identidad de propietario lo exime del contador mensual, pero la disponibilidad del canal sigue comprobando la lista efectiva de emisores.

## Mapa funcional

| Pantalla | Objetivo y acciones | Datos y estados que conservar |
| --- | --- | --- |
| Hoy | Saludo, referencia diaria, Otro, temas de ánimo, registro de interés | Fecha local, offset, carga bíblica/error, reflexión opcional y bendición preparada |
| Biblia | Testamento/libro/capítulo, búsqueda por referencia, anterior/siguiente, selección, favorito, marcador, resaltado, compartir | Posición, selección, copyright, vencimiento, carga, fallo, cuota y reintento |
| Temas | Explorar 16 temas y referencias del catálogo | Filtro/búsqueda, extras publicados, tarjetas con carga propia |
| Gente → Personas | Añadir/editar/importar si el dispositivo lo permite; buscar/filtrar; varios temas, idioma, canal, notas; quitar/deshacer | Teléfono normalizado, privacidad visual, límite, duplicados y pendientes manuales |
| Gente → Iglesia | Nombre, dirección, ciudad, días/hora de culto y ventana de recordatorio | Configuración personal, no entidad multiusuario |
| Gente → Programar | Crear/editar/pausar/activar/eliminar horarios; ver último resultado | Consentimiento, zona IANA, proveedor, estado de entrega, ocupado/error |
| Más → Doctrina | Enseñanzas, casos, evangelio y guías por referencia | Separar posición propia/otras posiciones y texto bíblico hidratado |
| Más → Guardados | Favoritos y mensajes personales clasificados | Referencias, notas, formato/idioma, quitar, vacío y fallo al recuperar lectura |
| Más → Admin | Registros, cuentas, gestores, frases y temas | Rol servidor, enmascaramiento, estados de herramientas bloqueadas |
| Perfil | Entrar/crear, proveedores configurados, sesión, invitación, salir/eliminar | Confirmaciones y errores; no borrar estado al fallar cierre/eliminación |
| Ajustes | Idioma, tema de color, tamaño, recordatorio, compartir app y enlaces | Preferencias del dispositivo/cuenta y soporte de capacidades |
| Pregunta / redacción | Interfaz histórica de conversación/redacción | IA denegada; no prometer respuestas activas |
| iOS → Nueva nota / Mis lecturas | Crear, buscar, leer, compartir y borrar notas locales | Guardado fallido/corrupto, Dynamic Type y funcionamiento sin red |

## Selección y contenido bíblico

`getDailyPick` usa hash de la fecha local: distribuye la selección entre nueve temas diarios y después entre sus referencias. “Otro” incrementa el offset; el día nuevo lo reinicia. No hay personalización mediante IA en esa selección. Elegir un ánimo usa la lista de ese tema.

El catálogo principal contiene referencias con texto vacío. El texto visible se obtiene mediante hidratación LBLA; no debe renderizarse el catálogo como si incluyera una Biblia completa. Los extras de temas se incorporan una vez por visita; se validan referencias y se ignoran IDs del catálogo ya existentes.

La interfaz y el idioma del mensaje pueden ser español o inglés. **LBLA continúa en español**; localizar el nombre de un libro o una etiqueta no traduce las Escrituras. La búsqueda de catálogo no equivale a una concordancia de toda la Biblia. El endpoint de concordancia global devuelve indisponibilidad.

La consulta por capítulo mantiene texto/copyright del proveedor, ID fijo `e3f420b9665abaeb-01`, cache de 28 días, presupuesto compartido de 4.900 intentos en 31 días y bloqueo conservador de 31 días tras 429. La cuenta contratada tiene el límite declarado de 5.000 al mes; el contador local no conoce consumos de otras apps/consolas.

La lectura fresca del servidor puede servirse con la cuota agotada. Contenido vencido no se sirve como fallback. Hay deduplicación por proceso y lease en base; un lease ocupado produce error recuperable, no espera ilimitada. Existe todavía precarga de vecinos en `BibleView`, documentada en los hallazgos.

Las guías (`evangelio-*`, `caso-*`, `doctrina-*`) son contenidos compuestos con referencias. Los nombres `nvi-*`/`nwt-*` y fuentes comparativas permanecen como legado; no deben reactivarse por reutilizar componentes antiguos. Las listas doctrinales editoriales requieren revisión de procedencia cuando contienen citas; retirar el proveedor de lectura no certifica todo el contenido editorial.

## Guardado y límites

| Regla | Implementación |
| --- | --- |
| Referencias sin texto bíblico permanente | `referenceOnly`/`referenceMemory` al recordar, hidratar estado y guardar |
| Destinatarios personales | 80; actualiza coincidencia por ID o teléfono normalizado; inserta al principio |
| Mensajes guardados | 80; detecta duplicado por referencia, nota e idioma; agrega favorito |
| Historial manual `sent` | Últimos 30; registra acción de la app, no entrega confirmada |
| Marcadores | 20; identidad libro/capítulo/versículo |
| Resaltados | 200 IDs |
| Estado nube | `JSON.stringify(...).length <= 200000`; el nombre interno dice bytes, pero la comprobación es longitud de cadena JavaScript |
| Programaciones | Intención de máximo 20 por cuenta; comprobación count+insert no atómica |
| Mensaje fijo | 1–1.000 caracteres; tema permite mensaje vacío y composición al enviar |
| Gestor/emisor sujeto a cupo | 300 aceptados desde inicio del mes UTC; implementación cuenta ambos canales aunque constante diga SMS |
| Nota nativa | Título 1–200, texto 1–50.000 caracteres después de trim; sin cupo global explícito |

Los límites de listas se aplican en las acciones cliente; no todos se revalidan íntegramente al recibir un documento de estado. El servidor sí limita tamaño y normaliza campos. No tratar estas cotas de interfaz como invariantes de base.

## Tres formas de comunicar

1. **Compartir manualmente:** abre WhatsApp/SMS/correo/hoja de compartir o copia. El usuario confirma en la aplicación externa. Un click o cancelar la hoja no prueba entrega. LBLA con copyright se formatea como referencia, fuente y enlace, con nota/firma opcional.
2. **Recordatorios personales:** calcula destinatarios pendientes según hora local o próximo culto. Marca acciones manuales y evita volver a sugerirlas ese día. Los avisos dependen de permisos y ejecución de la página.
3. **Envío automático:** programación independiente en servidor. Guardar/editar deja en pausa; activar exige consentimiento y canal listo. No se activa por añadir una persona ni por activar recordatorios.

Las programaciones copian nombre/teléfono/contenido: no tienen FK al destinatario del documento personal. Editar o quitar una persona no implica editar/eliminar sus horarios existentes. El rediseño debe explicarlo o implementar explícitamente una nueva relación.

Un tema automático rota referencias según número de intentos registrados, no solo éxitos. En la ruta actual de producción compone referencia+enlace, sin texto LBLA ni llamada de IA; no utiliza la firma/nota de la antigua composición. Los mensajes fijos propios mantienen su contenido validado. La migración LBLA pausa todos los fijos históricos para revisión.

## Registro público y privacidad

`submitContact` exige consentimiento, nombre, email, teléfono normalizable y dirección; usa honeypot y límites nominales de 5 por dirección/hora y 3 por email/día. Email repetido no sobrescribe datos y responde igual para evitar enumeración. Si sesión y email coinciden, enlaza el registro con la cuenta. Solo nuevos registros se copian opcionalmente a FormSubmit. El nombre `sheet.ts` y un enlace de Sheets no implican escritura a Google Sheets.

Eliminar la cuenta borra los datos asociados en la base y revoca Apple primero. Registros antiguos sin vínculo se eliminan por email solo si su propiedad está verificada. Las notas nativas y copias ya enviadas a servicios externos no se borran por esa cascada; el producto debe explicarlo y definir su manejo.

## Edición gratuita y funciones restringidas

No se identificaron cobros, anuncios, suscripciones, patrocinios ni funciones premium en el flujo activo. Las condiciones solicitadas son mantener uso no comercial, copyright e integridad; revisión específica antes de monetización, offline, descargas completas o IA con las Escrituras.

Las llamadas generativas están bloqueadas por backend aun con credenciales y consentimiento. Bendiciones/reflexiones históricas o preparadas todavía pueden mostrarse desde base; eso no significa que se esté generando texto nuevo. La UI heredada de IA y los datos históricos deben revisarse antes del rediseño, según [hallazgos](revision-y-rediseno.md).
