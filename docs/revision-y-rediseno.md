# Hallazgos y contrato para el rediseño

Revisión estática del árbol local, 23 de octubre de 2026. No se modificó comportamiento ni se ejecutaron llamadas a proveedores. Estos hallazgos refinan el estado de preparación anterior; no deben borrarse por considerarlos solo problemas de aspecto.

## Hallazgos confirmados en código

| ID | Prioridad | Evidencia y efecto | Trabajo necesario |
| --- | --- | --- | --- |
| H1 | Alta, antes de publicar | `admin-notes.ts:prepareVerseNotes` autentica propietario pero hidrata y escribe `verse_texts` antes de llamar a `generateVerseNotes`, donde recién se deniega IA. La tabla no tiene expiración de 28 días. El botón normal está deshabilitado por `configured=false`, pero el handler sigue existiendo. | Bloquear el handler antes de cualquier lectura/efecto; revisar y purgar caché residual de forma controlada. Probar que la llamada directa no consulta API.Bible ni escribe. No se confirmó ejecución real de este camino. |
| H2 | Media, consumo | `bible-view.tsx` carga capítulos anterior/siguiente tras abrir uno. `prefetchVerses` vacío no impide estas dos solicitudes. | Retirar o presupuestar explícitamente esa precarga; probar una apertura fría y contar intentos. |
| H3 | Media, producto | `AppShell` mantiene Pregunta; Biblia ofrece acciones relacionadas y Doctrina contiene redacción, pero endpoints/consentimiento bloquean IA. La entrada de concordancia también permanece con backend indisponible. | Diseñar estados de función no disponible o retirar accesos; no mostrar promesas activas. |
| H4 | Media, datos | `saveMyState` hace upsert de snapshot sin versión; `cloud-saver` solo ordena escrituras de una visita. | Definir conflicto entre dispositivos y probarlo antes de prometer sincronización sin pérdida. |
| H5 | Media, privacidad/UX | Notas Swift en `readings.json` no tienen propietario ni reciben notificación de logout/borrado web. | Definir si son notas del dispositivo; informar, separar por cuenta o implementar borrado/exportación explícita. |
| H6 | Media, recordatorios | `notify.ts`/`preacher-sw.js` dependen de mensajes de página y temporizadores; no hay push/alarma persistente. | No prometer recordatorios garantizados con app cerrada; decidir si se necesita implementación nativa/push. |
| H7 | Media, recuperación | `combineVerses` crea referencias no contiguas como `16, 18`; `parseVerseRef` admite un verso o rango continuo. `referenceMemory` elimina texto y luego la hidratación depende de ese parser. | Probar guardar/reabrir selección no contigua y representar sus segmentos explícitamente; no perderla en el rediseño. |
| H8 | Media, seguridad operativa | Cupos de 20 horarios, formulario y 300 envíos se consultan antes de insertar/enviar, sin una reserva atómica de cupo equivalente a API.Bible. | No presentar esos límites como garantía bajo concurrencia; añadir pruebas/reserva si deben ser estrictos. |
| H9 | Media, mensajería | Teléfono/nombre del horario son copia, no FK a Gente; `recordProviderStatus` ignora SID desconocido y no reconcilia después. | Explicar independencia del horario y validar callback temprano/desordenado; definir reconciliación. |
| H10 | Media, cuota compartida | Endpoint de capítulo público con presupuesto global, sin cuota por visitante identificada. | El corte protege el gasto, pero una persona puede consumir disponibilidad del resto. Evaluar protección contra abuso sin impedir lectura legítima. |
| H11 | Baja, estado visible | `getThemeExtras` oculta fallos como `[]`; una nube fallida bloquea guardado pero deja el producto utilizable con aviso. | Diseñar estados que distingan catálogo base, sincronización pendiente y trabajo sin guardar. |
| H12 | Media, idioma/editorial | Ruta productiva de tema automático devuelve copy fijo en español incluso con `message_locale=en`; quedan comentarios/objetos de traducciones antiguas. | No prometer traducción inglesa de LBLA; revisar idioma de copy y procedencia de citas editoriales que aún se renderizan. |

H1 corrige una conclusión demasiado amplia del informe anterior: el bloqueo de llamadas al modelo existe, pero no bloquea todos los efectos previos de la preparación administrativa. H2 corrige la afirmación de ausencia total de precarga. Actualización posterior: el handler H1 ya se bloquea antes de sus efectos y H2 ya no precarga vecinos; falta revisar los datos históricos remotos de H1.

## Diferencias documentales corregidas

El documento antiguo de mensajes decía que no existía webhook: sí existe `/api/twilio/status`, firma y persistencia de estado. También describía cambio de idioma como traducción bíblica y envíos temáticos con texto/frases IA; la edición LBLA actual usa referencias/enlace. Se actualizó ese documento y se añadió una advertencia en el informe LBLA y en la preparación App Store.

No se deben inferir capacidades por comentarios antiguos: `dbSource="neon"` no identifica hosting, `sheet.ts` no escribe a Sheets, `recobro.ts` ya carga LBLA, límites IA históricos no habilitan el servicio y “Mis lecturas” no equivale a una Biblia descargada.

## Contrato funcional para diseñar

1. Preservar lectura, referencias, atribución y selección; separar texto bíblico de explicación y nota personal.
2. Conservar IDs históricos o aportar una migración explícita; no perder favoritos al renombrar módulos/proveedor.
3. Distinguir invitado/cuenta, guardado local/nube, sincronizando/error y nota nativa.
4. Distinguir compartir manual, recordatorio y programación automática; conservar consentimiento y activación separada.
5. Conservar privacidad de teléfonos, enmascaramiento por rol y controles destructivos con confirmación/deshacer donde existen.
6. Mantener acceso a perfil, eliminación, soporte, privacidad, idiomas y escalado de texto.
7. Diseñar estados vacíos, carga lenta, sin red, cuota agotada, sesión vencida, operación ocupada y proveedor desconectado.
8. Mantener foco, teclado, lectores de pantalla, safe areas y contraste; comprobar tamaño grande en iPhone y tablet/navegador.
9. No incluir IA, búsqueda global, Biblia offline, imágenes de texto licenciado o monetización como funciones disponibles hasta resolver sus permisos/implementación.
10. Alinear navegación web y toolbar nativa: hoy hay dos niveles de navegación y el botón Atrás nativo sigue historial web, mientras las pestañas internas usan estado React.

## Decisiones que el diseño no debe tomar implícitamente

| Decisión | Estado actual | Recomendación para la fase de diseño |
| --- | --- | --- |
| Organización principal | Hoy/Biblia/Temas/Gente/Más | Prototipar preservando descubribilidad de todas las funciones activas |
| Formato iPhone | WebView con extras nativos | Rediseñar primero el producto existente; una reescritura nativa sería otro alcance |
| Notas | Biblioteca local separada | Aclarar nombre y pertenencia antes de mezclarla con Guardados |
| Idioma bíblico | LBLA español | Mostrarlo explícito al cambiar idioma de interfaz |
| Doctrina | Posición editorial propia y otras enseñanzas | Preservar significado; revisión editorial independiente del diseño |
| IA/concordancia | Backend no disponible, accesos históricos | Mostrar indisponibilidad o retirar entrada, sin fingir respuesta |
| Mensajería automática | Depende de cuenta/rol y configuración | Mostrar requisitos y estados reales, no un interruptor ambiguo |

## Matriz de aceptación para la implementación posterior

| Recorrido | Comprobación mínima | Pruebas existentes relacionadas |
| --- | --- | --- |
| Invitado → cuenta | Adoptar solo nube vacía; no mezclar cuentas; conservar error de guardado | `cloud-state.test.ts`, `cloud-saver.test.ts`, pruebas auth |
| Lectura | Texto/copyright exactos, caducidad, dedupe, cuota y error recuperable | `api-bible-content.test.ts`, `scripts/api-bible-integration.mjs` |
| Guardados | ID estable; recuperar normal/rango/no contiguo; quitar/deshacer | `bible.test.ts`, revisión específica H7 pendiente |
| Personas | Normalizar, evitar duplicado, editar temas/canal/idioma, privacidad | `phone.test.ts`, `people-filter.test.ts`, `recipient-themes.test.ts` |
| Horarios | Pausa por edición, consentimiento, DST, aislamiento, no reenvío incierto | `message-schedule.test.ts`, `messaging/worker.test.ts` |
| Entrega | Diferenciar aceptado/entregado/fallido; firma y orden de callback | `twilio-signature.test.ts`, `provider-status.test.ts`; carrera temprana pendiente |
| Roles | Gestor enmascarado, solo propietario concede, usuario normal rechazado | `admin-access.test.ts`, `roles.test.ts`, `privacy.test.ts` |
| Cuenta iOS | OAuth real de ambos proveedores, cancelación, logout y eliminación | `test:ios-auth` usa proveedor externo simulado; prueba real pendiente |
| Nota nativa | Guardar/reabrir/compartir/borrar, archivo fallido, pertenencia | `ReadingLibraryTests.swift`, `PreacherUITests.swift` |
| Visual | Teléfono/tablet/escritorio, texto grande, foco y teclado, errores | Smoke existente más QA interactivo de los recorridos afectados |

Las suites son evidencia de contratos concretos, no certificación general de seguridad o licencia. En este trabajo solo se verificaron integridad documental, enlaces y concordancia con el código; no se repitieron compilaciones porque no se cambió código ejecutable.

## Pendientes externos

La preparación anterior registró que faltan base persistente de prueba, validación de LBLA/FUMS por el backend desplegado, configuración/firma Apple, OAuth real, dispositivo físico, TestFlight, capturas y declaraciones de privacidad. Esas observaciones no se revalidaron en las cuentas durante esta revisión. Véase [App Store](app-store-release.md).

## Correcciones locales posteriores — 23 de octubre

- H1: `prepareVerseNotes` exige permiso antes de consultar o guardar Escrituras; no conserva el flujo previo de hidratación. Caché remota histórica pendiente de inspección.
- H2: eliminada la precarga de capítulos adyacentes al abrir una lectura.
- H5: biblioteca nativa aclara la propiedad local de notas personales, su eliminación manual y su independencia de la cuenta web.
- H7: parser admite selecciones separadas y rangos combinados, exige todos los versos pedidos y excluye los intermedios no seleccionados. Tres pruebas unitarias y comprobación en integración API.Bible aprobadas.
- H12: el mensaje de lectura respeta ES/EN y explica en inglés que el pasaje es español. La revisión editorial completa sigue pendiente.

Estas correcciones están en el árbol local; no se han desplegado. Las filas originales conservan el diagnóstico inicial.
