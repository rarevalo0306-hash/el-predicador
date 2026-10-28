# The Preacher — estado para App Store

Revisado 23–24 de octubre de 2026. Los cambios están en la rama local `codex/ios-app-store`; no se han enviado a Apple ni promovido a producción.

## Preparado en código

Proyecto SwiftUI/WebKit para iPhone, mínimo iOS 17, versión 1.0 (1), identificador propuesto `app.thepreacher.ios`. Lector LBLA online, favoritos por referencia y biblioteca nativa de notas personales; no captura ni descarga la Biblia. Navegación, errores recuperables, fuentes dinámicas y compartir notas mediante iOS.

Autenticación Google/Apple mediante ASWebAuthenticationSession, devolución de sesión con PKCE y código de un solo uso. Configuración de Sign in with Apple en servidor; botón condicionado a su configuración real. Eliminación autenticada de cuenta y datos relacionados, cancelación de mensajes pendientes y revocación Apple antes de borrar la cuenta. Privacidad y soporte bilingües. Las pruebas Apple del backend simulan el proveedor externo; falta OAuth real.

Integración LBLA y controles editoriales/consumo detallados en [api-bible-release.md](api-bible-release.md). IA y uso offline de su texto bloqueados. Edición gratuita sin monetización.

## Hallazgos añadidos en la revisión de arquitectura

Se bloqueó `prepareVerseNotes` antes de consultar o escribir contenido bíblico y se retiró la precarga de capítulos vecinos. También se corrigió la recuperación de selecciones no contiguas y el aviso inglés de mensajes de lectura. Sigue pendiente revisar cualquier caché histórica remota. Véanse [hallazgos](revision-y-rediseno.md) y [contexto técnico](contexto-tecnico.md).

## Falta antes de enviar

1. **Despliegue verificado:** configurar un entorno de prueba con base persistente y clave API.Bible. Migrar y probar la lectura real, copyright completo y FUMS. La clave existe en Vercel; no se ha exportado al repositorio o al binario. No conectar pruebas a datos productivos por conveniencia.
2. **Apple:** entrar con la cuenta aprobada, confirmar titular/equipo y Bundle ID. Registrar app, configurar perfiles/certificados y Sign in with Apple (Service ID, dominio, callback, Key ID y secreto privado solo backend). No se encontraron identidades válidas de firma en la preparación inicial. No se han aceptado acuerdos ni registrado identificadores.
3. **Prueba real:** Google y Apple con retorno a la app, correo/contraseña, eliminación/revocación y aislamiento entre cuentas; iPhone físico con red débil, accesibilidad y notas. Después TestFlight. El simulador y los mocks no reemplazan estas pruebas.
4. **Derechos:** conservar la autorización/entitlement LBLA de esta app en Starter y su aviso oficial. Mantener uso no comercial. Descargas, offline, IA y monetización requieren revisión específica previa.
5. **App Privacy:** declarar datos reales del servicio: nombre/correo/identificador de cuenta, contactos/teléfonos, contenido aportado, posible información religiosa sensible, uso del producto e identificadores anónimos FUMS. Revisar cada proveedor. El manifiesto nativo no reemplaza el cuestionario App Privacy.
6. **Ficha:** nombre disponible, capturas del binario final, categoría, cuestionario de edad, export compliance, contacto de revisión y cuenta de demostración si Apple la necesita. Precio Gratis. Sustituir el icono reescalado por original de alta resolución si está disponible.

## Ficha propuesta

Nombre: The Preacher. Subtítulo: Lectura bíblica para cada día. Categoría: Referencia. Precio: Gratis. Soporte `https://www.thepreacher.app/support`; privacidad `https://www.thepreacher.app/privacy`. Descripción guardada en `ios/app-store/es-ES/description.txt`. No anunciar lectura LBLA offline o IA.

## Secuencia de publicación

Validar backend y licencia → entrar con Apple/configurar equipo → iPhone físico → Archive firmado → TestFlight → ficha/privacidad → App Review → publicación tras aprobación. La aprobación de la cuenta Developer no equivale a aprobación de la app. Apple decide la aceptación del producto, incluida suficiencia de funcionalidad bajo 4.2.

[Reglas de revisión Apple](https://developer.apple.com/app-store/review/guidelines/) · [Privacidad](https://developer.apple.com/app-store/app-privacy-details/) · [Eliminar cuenta](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion)

## Comprobación de infraestructura y preparación local — 23 de octubre

Vercel tiene API_BIBLE_KEY y DEEPSEEK_API_KEY para Preview, pero DATABASE_URL y la configuración de autenticación solo están en producción. Supabase confirma un proyecto el-predicador activo, sin ramas de prueba. No se han copiado datos ni credenciales productivos a Preview. La creación de una rama está pendiente de autorización: cotización del proveedor US$0.01344/hora, aproximadamente US$0.32/día más consumos aplicables.

TypeScript, compilación web, pruebas locales de autenticación/eliminación y pruebas de integración bíblica pasaron. La integración bíblica usa respuestas sintéticas e incluye referencias no contiguas; no acredita conectividad del backend desplegado. La biblioteca nativa dispone de traducciones ES/EN y explica que sus notas pertenecen al dispositivo y no se eliminan al borrar la cuenta web. Se añadió descripción inglesa de la ficha. No hay identidades válidas de firma instaladas.

## Cambio a staging local

El usuario eligió usar su Supabase de la Mac. La base independiente `preacher_staging` ya está preparada y conectada a la app local; alta, sesión y persistencia comprobadas. Se eliminó la rama cloud creada durante la interrupción. La aprobación de costo anterior queda sustituida por esta opción local. Véase [local-staging.md](local-staging.md). Vercel Preview sigue sin conexión a una base de pruebas.

## Inicio con Apple: `invalid_client` en producción — 27–28 de octubre de 2026

**Síntoma.** Al volver de Apple, `GET /api/auth/callback/apple` fallaba con `invalid_client` (400): Apple rechazaba el `client_secret` en el intercambio del código.

**Causa encontrada en el código.** `appleClientSecret()` firma un JWT ES256 correcto (`kid` = Key ID, `iss` = Team ID, `sub` = client ID, `aud` = `https://appleid.apple.com`), pero caduca a los 5 minutos. Better Auth resuelve la configuración de proveedores **una sola vez** por instancia del servidor y reutiliza ese texto en cada intercambio. Con la instancia de Vercel ya caliente, cualquier inicio de sesión hecho más de 5 minutos después del arranque enviaba un JWT vencido, y Apple responde `invalid_client`.

**Cambio.** `currentAppleClientSecret()` firma el JWT de forma síncrona (`node:crypto`), con validez de 1 hora y renovación 5 minutos antes de vencer. La configuración de Apple en `server.ts` lo expone como *getter*, así que cada intercambio de código y cada renovación de token leen un secreto vigente. El flujo web e iOS (ASWebAuthenticationSession) usa el Services ID como `client_id`; no hay inicio nativo por `id_token` (`disableIdTokenSignIn`), así que no hace falta aceptar el audience `app.thepreacher.ios`. La revocación sigue generando su propio secreto de 5 minutos en cada llamada.

**Comprobación local.** Prueba nueva: JWT verificable con ES256, `exp − iat` = 3600, reutilizado dentro de la ventana y renovado antes de vencer, también con la clave guardada con `\n` escapados. Comprobado contra el proveedor Apple de Better Auth 1.6.30 que cada intercambio lee un secreto nuevo. `typecheck`, `test:ios-auth` (7 pruebas e integración) y `vite build` pasan.

**Variables de Vercel.** `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID` y `APPLE_PRIVATE_KEY` (Production) se crearon el 24-oct-2026 a las 04:39 UTC (23-oct, hora del Este). Son sensibles y no se pueden leer, así que no se confirmó si apuntan a la llave `P7YAFNCVQG`. No se cambiaron en esta sesión: el archivo `.p8` no está disponible en el entorno de trabajo en la nube.

**Pendiente.** Desplegar el cambio en producción. Probar desde el iPhone y desde Safari. Revisar los logs del callback. Si sigue saliendo `invalid_client` con el secreto ya vigente, cargar en Vercel las cuatro variables de la llave `P7YAFNCVQG` desde un equipo que tenga el `.p8`.
