# Comparación con la versión anterior — 24 de octubre de 2026

Comparación de código entre `backup/diseno-anterior-20261024` (1d476ed) y la versión publicada `f2a7bbb`. Auditoría de solo lectura: no se cambiaron funciones ni se desplegaron correcciones durante esta revisión. El respaldo precede tanto al rediseño como a la migración bíblica y a la app nativa; por ello no todos los cambios provienen del diseño. La presencia de una función en el código anterior no prueba que su proveedor funcionara entonces.

## Cambios de funcionamiento confirmados

| Área | Antes | Ahora | Evaluación |
|---|---|---|---|
| Agente IA | Existían consultas, composición de mensajes y generación de reflexiones/notas mediante DeepSeek. | Las rutas y generadores bloquean las solicitudes. Se retiró el botón superior de Pregunta, pero quedan controles de IA en otras pantallas. | Cambio funcional importante, no visual. El bloqueo aplicado a toda la IA es más amplio que impedir enviar LBLA al modelo. Falta diseñar una separación autorizada de contenido. |
| Búsqueda de palabras | Concordancia consultaba el servicio anterior. | Devuelve `unavailable`; buscar por referencia sigue disponible. | Función interrumpida durante la migración, no reemplazada. |
| Mensajes automáticos por tema | Resolvían texto bíblico y notas. | La ruta de producción compone referencia LBLA y enlaces; incluso en inglés indica lectura en español. | La incorporación de BSB al envío manual NO llegó a este recorrido. |
| Cambiar idioma al programar | Formateaba el versículo recuperado. | Construye referencia y enlaces LBLA de forma fija. | Inconsistente con el envío manual actual en BSB. No se comprobó ni se ejecutó un envío real durante esta auditoría. |
| Imagen, PDF y compartir nativo | Había acciones para exportar el verso. | Los tres botones se deshabilitan al existir `copyright`, campo presente también en BSB y KJV. El generador de imagen también bloquea. | Restricción general aplicada al migrar LBLA; requiere revisión por traducción antes de restituir. |
| Favoritos y guardados | La memoria podía conservar texto completo. | Se conservan referencias/metadatos; el texto se recupera de nuevo y caduca. | Cambia disponibilidad sin conexión y elimina de esa memoria la identificación de traducción. No significa que se hayan borrado cuentas o referencias. |
| Notificaciones diarias | Incluían un fragmento del versículo. | Solo referencia y etiqueta fija LBLA, también con interfaz inglesa. | Cambio funcional y desajuste de idioma pendiente. |
| Comparaciones | Existían comparaciones de traducciones en Biblia y Doctrina. | Se retiraron las pantallas de comparación y aparecen avisos. | Cambio ligado a la retirada de textos sin permiso. Hay un aviso en Doctrina escrito solo en español. |
| Idioma de interfaz | Selector visible en cabecera. | Se accede desde Más → Ajustes. | Función conservada, acceso menos directo. |
| Compartir manual | Formato con comillas, texto bíblico y nota opcional. | BSB permite texto limpio, referencia, traducción y nota. LBLA/KJV se comparten por referencia/enlace. | BSB fue comprobado hasta la página de recepción de WhatsApp y el usuario confirmó que ya se ve bien. No equivale a probar todos los canales ni todos los envíos automáticos. |

## Funciones que ya existían

La nota personal, las notas prediseñadas, el idioma independiente del mensaje, WhatsApp, SMS, correo, favoritos, marcadores, resaltados, contactos y programación ya estaban implementados. No debieron presentarse como funciones nuevas. En esta última solicitud se añadieron únicamente tres sugerencias de saludo por idioma y una vista previa del mensaje completo; se quitó el formato de comillas.

Evidencia: `git show backup/diseno-anterior-20261024:src/components/send-drawer.tsx` contiene `MessageLanguageSelect`, `messageTemplates` y el campo `personalNote`.

## Cambios visuales y de navegación

- Paleta azul marino/dorado, logo original recoloreado, tipografía, tarjetas y barra inferior con efecto cristal.
- Fotografías de los 16 temas; son imágenes fijas. No se implementó generación automática de una nueva foto diaria.
- Inicio prioriza una tarjeta de lectura y continuar leyendo. El versículo completo se revela con un botón, en lugar de aparecer directamente como antes.
- Diseño actualizado en Biblia, Temas, Gente, Guardados y Doctrina; mismos destinos principales.

## Migración y funciones añadidas para iPhone

- Recobro fue sustituida por API.Bible a petición del usuario; LBLA español, BSB inglés principal y KJV alternativa de lectura.
- Clave en backend, caché de 28 días separada por traducción y presupuesto compartido conservador de 4.900 llamadas por 31 días.
- Nuevo contenedor iPhone con notas personales locales, inicio con Apple y flujo nativo de autenticación.
- Eliminación de cuenta y limpieza asociada; protección frente a iniciar envíos de una programación que acaba de borrarse.
- No se identifica en esta comparación una migración que sustituya todas las cuentas existentes. Esta auditoría no volvió a contar registros ni inspeccionó datos de producción.

## Evidencias principales

- IA: `src/routes/api/ask.ts`, `src/routes/api/compose.ts`, `src/lib/bible-policy.ts`, `src/lib/ai/ask.ts`, `src/lib/ai/compose.ts`, `src/lib/ai/daily.server.ts`, `src/lib/admin-notes.ts`.
- Concordancia: `src/lib/concordance-fn.ts:21`.
- Automatización: `src/lib/messaging/theme-delivery.server.ts:97`, `src/components/message-schedule-panel.tsx:193`.
- Exportaciones: `src/components/send-drawer.tsx:611`, `src/lib/verse-card.ts:84`.
- Persistencia: `src/lib/store.ts`, `src/lib/bible-policy.ts`.
- Notificaciones: `src/components/app-shell.tsx:178`, `src/components/settings-drawer.tsx:97`.
- Idioma y navegación: `src/components/app-shell.tsx`, `src/components/settings-drawer.tsx:185`.

## Orden propuesto para una futura corrección

1. Alinear programación, mensajes automáticos y avisos diarios con el idioma/traducción seleccionados, respetando permisos de mensajería.
2. Recuperar la concordancia con control del consumo.
3. Separar la IA y exportaciones por contenido autorizado, en lugar de bloquear indiscriminadamente todas las traducciones.
4. Resolver identificación de traducción en guardados y textos de interfaz pendientes.
5. Revisar territorios permitidos para KJV antes de elegir países del App Store.

No se ejecutó ninguna de estas correcciones en esta auditoría. Los términos actuales de API.Bible excluyen KJV de correspondencia electrónica por sus restricciones territoriales; no debe reactivarse su texto en mensajes simplemente para reproducir la versión anterior. Fuente: https://api.bible/terms-and-conditions (secciones 7, 9.8 y 9.9), consultada en esta sesión.

## Restauración ejecutada el 24 de octubre

Se mantuvo el diseño nuevo. Publicados: selector ES/EN en cabecera, Pregunta y composición por referencias, concordancia API.Bible, exportación BSB, notificaciones en inglés y mensajes automáticos con traducción correspondiente. Recuperadas notas preparadas, firma del remitente, bendiciones, reflexión diaria, frases administrativas y propuestas/publicación de referencias por tema. Las funciones de IA no adjuntan automáticamente textos bíblicos: utilizan referencias. La publicación de temas conserva referencias y consulta el texto mediante la caché temporal del proveedor, sin persistirlo en verse_texts.

El fallo real de Pregunta devolvía contenido vacío: DeepSeek activa thinking por defecto y el límite corto se agotaba. Se explicitó thinking disabled. Prueba real en producción: respuesta española y respuesta inglesa recibidas; se corrigió además una mezcla de idioma en las citas de la respuesta inglesa. Esa última corrección de idioma aún requiere repetir la comprobación en el teléfono.

Verificación: typecheck y compilación correctos, 14 pruebas de pregunta/composición/consentimiento, 16 de contenido diario, 44 de programación/mensajería y 5 de temas. Concordancia española comprobada con texto real. No se enviaron mensajes de prueba a contactos reales. La entrega final de una programación al proveedor y el recorrido completo en el iPhone no se volvieron a probar en esta sesión.

Límites que permanecen: no se recuperó Recobro ni comparaciones sin autorización, ni almacenamiento bíblico offline permanente. El envío/exportación de texto LBLA y KJV mantiene las restricciones de licencia; BSB permite texto. No equivale a afirmar que todas las funciones son idénticas a la versión anterior o que ya está aprobada para App Store.
