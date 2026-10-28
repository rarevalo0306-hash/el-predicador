# Continuidad — The Preacher

Guardado el 23 de octubre de 2026, a petición del usuario: «deja todo en nota vamos a continuar despues».

## Punto de partida

Repositorio: `el-predicador`, rama local `codex/ios-app-store`. Hay cambios locales anteriores de preparación iOS/LBLA sin publicar. No resetear, descartar ni sobrescribir esos cambios. La fase de diseño produjo imágenes únicamente: el nuevo estilo todavía NO está implementado. No se hizo despliegue ni envío a App Store.

El usuario quiere continuar después. Esta nota no autoriza iniciar trabajo en segundo plano ni crear recordatorios.

## Diseño aprobado

El usuario rechazó la primera propuesta vino/marfil/dorado por demasiado clásica y la segunda blanco/azul tipo ajustes iOS por demasiado simple. Aprobó la tercera dirección: moderna, limpia y con personalidad, verde profundo, acento lima, tipografía sans serif, fotografía grande y controles claros de iPhone.

Referencia final aprobada con «Perfecto»: [Hoy con logo verde](diseno-aprobado/hoy-logo-verde.png).

- Conservar la figura original del predicador, libro abierto, mano levantada y forma circular. NO usar el monograma TP.
- El usuario autorizó cambiar el color del logo: verde profundo y borde verde suave, fondo claro. El archivo original `public/logo.png` sigue intacto. La variante aprobada aparece en la maqueta, todavía no es un recurso de producción independiente.
- Paleta de dirección: verde `#103F38`, lima `#D8F57B`, fondo claro `#F6F6F1`, tinta oscura. Confirmar contraste al implementar.
- Hoy: encabezado con logo/nombre/perfil, fotografía costera grande, referencia del día, LBLA en español y botón «Abrir lectura»; continuar lectura; acceso visual a temas; barra Hoy/Biblia/Temas/Gente/Más.
- El usuario preguntó por mostrar el texto en Hoy; se produjo una alternativa con fotografía pequeña y área de lectura, pero después pidió dejar la primera propuesta verde. Mantener la fotografía grande y «Abrir lectura». No quedó aprobada la alternativa con texto en portada. El capítulo debe abrirse dentro de la app; el detalle de interacción se debe concretar al retomar.
- [Temas](diseno-aprobado/temas-direccion-visual.png) y [Biblia](diseno-aprobado/biblia-direccion-visual.png) ilustran la misma dirección. Estas dos imágenes aún contienen TP: reemplazarlo por el logo del predicador verde; son referencias complementarias, no aprobaciones independientes de cada detalle.
- No convertir nombres/fechas/referencias de ejemplo de las maquetas en valores fijos del producto. El contenido diario debe seguir la lógica existente.

## Alcance y tiempo conversado

Se estimó, sin garantía, 6–10 horas para adaptar toda la app y probar: Hoy/navegación/colores/logo, pantallas restantes y ajustes iPhone. Los rangos parciales comunicados eran aproximados; recalcular al retomar. Firma, TestFlight, publicación y solución de pendientes técnicos van aparte.

Se propuso comenzar por Hoy y navegación, mostrar resultado funcionando y después extenderlo. El usuario no pidió todavía ejecutar la implementación; pidió guardar y continuar después. Confirmar el alcance de su siguiente instrucción antes de asumir publicación.

## Documentación a leer antes de implementar

1. [Contexto técnico](contexto-tecnico.md).
2. [Arquitectura](arquitectura.md), [reglas de negocio](logica-negocio.md), [datos y contratos](datos-y-contratos.md).
3. [Flujos de ejecución](flujos-ejecucion.md).
4. [Hallazgos y contrato de rediseño](revision-y-rediseno.md).
5. [Estado App Store](app-store-release.md), [API.Bible](api-bible-release.md), [validación iOS](ios-validation.md).

La revisión inventarió 312 archivos, con lectura dirigida de módulos principales e inspección estructural del resto. No afirmar auditoría exhaustiva línea por línea o validación de producción.

## Restricciones funcionales

- Canon de implementación: `src/`, no la versión antigua `spa/`.
- iPhone usa SwiftUI/WKWebView y carga el sitio remoto; no es una reescritura completamente nativa.
- LBLA mediante API.Bible, Bible ID `e3f420b9665abaeb-01`. El usuario informó que API key está en Vercel. Mantener secreto exclusivamente en backend.
- Edición gratuita no comercial: sin anuncios, suscripciones, patrocinio ni premium.
- Texto íntegro y copyright oficial junto al contenido; no introducir Escrituras generadas por IA.
- Cuenta de 5.000 llamadas mensuales; implementación local tiene corte conservador en 4.900 intentos/31 días, caché 28 días y manejo de 429.
- IA, Biblia offline/descargas completas y monetización requieren permisos específicos antes de habilitarse. No reactivar funciones históricas porque aparezcan en pantallas antiguas.
- Guardados conserva referencias; compartir LBLA usa referencia/enlace.
- Separar personas, recordatorios manuales y horarios automáticos; conservar consentimiento, permisos, privacidad y errores.
- Notas nativas locales son distintas de Guardados en nube.

## Pendientes importantes descubiertos

- H1: `prepareVerseNotes` puede hidratar y escribir texto en `verse_texts` antes del bloqueo IA. No marcarlo resuelto. Bloquear antes de efectos y revisar datos residuales antes de publicación.
- H2: `BibleView` todavía precarga capítulos vecinos, aunque `prefetchVerses` sea no-op.
- UI de IA/concordancia sigue visible pese a indisponibilidad; rediseñar estados/accesos.
- Snapshot nube sin control de conflictos entre dispositivos; notas nativas sin pertenencia a cuenta; notificaciones no garantizadas con app cerrada; recuperación de selecciones no contiguas pendiente. Ver H1–H12 en el informe.
- Validación real de backend LBLA/FUMS y base persistente de prueba pendiente según preparación anterior. No conectar preview a producción por conveniencia.
- Apple: configuración, firma, OAuth real, dispositivo físico, TestFlight y ficha/privacidad pendientes. Pedir entrada del usuario cuando haga falta; nunca contraseña en chat.

## Próximo paso al retomar

Verificar estado actual del repo, leer instrucciones aplicables y partir de la maqueta final aprobada. Preparar recursos fieles (incluido logo recoloreado), adaptar primero Hoy/navegación al código existente sin perder flujos, y verificar visualmente móvil/escritorio y pruebas pertinentes. No desplegar ni afirmar listo para App Store por tener terminado el diseño.

## Avance al retomar — 23 octubre 2026
Implementados localmente Hoy y navegación: paleta verde/lima con modo oscuro, logo original recoloreado, fotografía costera, referencia diaria real, Abrir lectura conectado a BibleJump, continuación desde readingPlace, Paz/Fortaleza enlazados a Temas. Guardar/compartir permanece en sección expandible del versículo; se conservan formulario y selección de estados/temas. Idioma disponible en Ajustes; retirado acceso superior a Pregunta (IA deshabilitada).

PRODUCT.md y DESIGN.md consolidan las decisiones ya aprobadas. Nuevas imágenes en public/images, generadas con herramienta integrada; originales anteriores conservados. Fotografías codificadas en JPEG para reducir peso, sin cambiar composición. No se cambió API.Bible, claves ni despliegues.

Validación: typecheck y build correctos; scripts/redesign-smoke.mjs comprueba Hoy→Biblia→Hoy→continuar→Temas en 320, 390 y 1280px, sin errores JavaScript ni desbordamiento. Capturas en screenshots/redesign. La lectura LBLA real requiere validar backend con configuración de Vercel: estas pruebas locales validan navegación, no acceso a proveedor.

Pendiente: extender el rediseño detallado a Biblia, Temas, Gente y paneles; revisar en dispositivo físico; completar bloqueos documentados de App Store, firma/TestFlight y revisión de publicación. No se ha publicado esta versión.

## Extensión completada — Biblia, Temas, Gente y paneles
Petición explícita: seguir con las demás pantallas y conservar español/inglés. Implementada en la misma rama local, preservando cambios anteriores.
- Biblia: títulos sans, selección de libros en lista con número de capítulos, pestañas limpias, continuación verde y capítulos/lector adaptados. Retirado acceso promocional a concordancia deshabilitada; no se modificó backend ni permisos.
- Temas: cuatro tarjetas fotográficas, acceso expandible al resto del catálogo, búsqueda y detalle existentes.
- Gente: cabecera, accesos, formularios, estado vacío y listas con nueva presentación. Guardados, doctrina y paneles usan la misma tipografía/superficies; texto de Escrituras conserva su presentación y controles.
- Nuevos textos ES/EN centralizados en src/lib/design-copy.ts; errores LBLA localizados en bible-error-copy.ts. Color de barra del navegador sincronizado con nueva paleta.
- Validación: typecheck/build pasan; 17 pruebas de libros, filtros, temas de color y Más pasan. Smoke en desarrollo ES/EN a 320/390/1280px valida Biblia→capítulo, Temas→catálogo extendido→detalle, Gente→formulario, Más→Guardados→Ajustes y cambio real de idioma. Revisión adicional del modo oscuro y error de proveedor en inglés. Script: scripts/redesign-surfaces-smoke.mjs. Capturas: screenshots/redesign/.
- No publicación. Falta validación en iPhone físico y servicios reales (lectura con clave, autenticación/sync/envío), y completar checklist App Store. El cambio visual no certifica esos servicios.
- Confirmación final: mismo smoke de superficies también pasó sobre build compilado (puerto QA 8081) en ambos idiomas y los tres anchos, sin errores JavaScript ni desbordamiento horizontal.

## Azul/dorado y cristal
Usuario aprobó reemplazar verde/lima por azul/dorado con modo oscuro y acabado cristal. Cambios en estilos, color de navegador, logo recoloreado y espacio inferior de contenido. Sin cambios a texto, idiomas, servicios o cuenta Apple. Imagen diaria sigue como propuesta pendiente de proveedor y presupuesto; no se activó generación recurrente ni cobro.
