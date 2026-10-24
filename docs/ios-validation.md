# Validación local de iPhone

Preparación y nueva validación LBLA realizadas el 23 de octubre de 2026 en macOS con Xcode 27.1. Proyecto `ios/Preacher.xcodeproj`, esquema Preacher, iOS mínimo 17.0, destino iPhone.

## Comprobaciones

- Compilación del simulador: correcta.
- XCTest final: 6 pruebas aprobadas entre las ejecuciones finales (4 de almacenamiento, 1 recorrido de interfaz y 1 de accesibilidad).
- Archive Release para iOS físico arm64: correcto, **sin firma**. Archivo local: `ios/build/Preacher-unsigned.xcarchive`. `SigningIdentity` y `Team` vacíos, por lo que no es un paquete instalable para clientes ni subible a App Store Connect.
- Pruebas de almacenamiento: guardado y recarga desde disco, eliminación, recuperación tras entradas inválidas, conservación de archivos corruptos y conservación de datos ante fallos de escritura.
- Prueba de interfaz: añadir una lectura, cerrar y reabrir la app, leerla, abrir la hoja de compartir, eliminarla y comprobar tras un nuevo inicio que no aparece.
- Compilación web y TypeScript: correctas.
- Integración API.Bible: pruebas con proveedor simulado aprobadas (concurrencia, caducidad, copyright, cuota compartida y rechazo de IA). Una consulta real en la consola oficial confirmó LBLA/JSON/copyright, pero no reemplaza la prueba pendiente del backend desplegado.
- Acceso nativo Google/Apple con PKCE y eliminación de cuenta: pruebas locales de backend aprobadas; proveedor Apple simulado.
- Biblioteca nativa ajustada a notas personales, sin captura de selección ni descarga de LBLA. Se repitieron las 6 pruebas nativas con resultado correcto.
- Smoke web en desarrollo y compilación de producción (esperando la pantalla lista; la primera carga local con PGLite mostró temporalmente el esqueleto): desktop 1280×800 y móvil 390×844, HTTP 200, sin desbordamiento horizontal ni errores de consola/runtime. Sin divergencia respecto de la base de desarrollo.
- La herramienta web emite una nota de branding de su plantilla heredada; no se modificó el branding de la web durante esta preparación de iOS.
- Modo oscuro, contraste alto y tamaño accessibility-large: biblioteca revisada visualmente y botones de añadir/cerrar accesibles en la prueba de interfaz.
- Plists y formato del diff: válidos.

## Evidencia local

Capturas bajo `screenshots/ios/` (ignoradas en Git). Resultados de XCTest bajo `ios/DerivedData/Logs/Test/` (ignorados en Git). La biblioteca no hace peticiones de red; su persistencia se valida sin depender de la cuenta web.

## Pendientes de validación

Las pruebas se ejecutaron en un simulador iPhone 18 Pro con iOS 27.0. No se ha probado en un iPhone físico ni se ha distribuido por TestFlight. Tampoco se han probado con una cuenta real el login, los contactos, la mensajería automática o las credenciales del titular. Las comprobaciones de compilación no resuelven los bloqueos de publicación de `app-store-release.md`.

## Nueva ejecución tras traducción nativa ES/EN

El 23 de octubre se ejecutó de nuevo el esquema completo: **7 pruebas aprobadas** (4 de almacenamiento y 3 de interfaz), resultado `TEST SUCCEEDED`. Las pruebas fijan explícitamente el idioma: recorrido de guardado/reinicio/compartir/eliminar y accesibilidad en español, biblioteca y controles principales en inglés. Resultado local: `ios/DerivedData/Logs/Test/Test-Preacher-2026.10.23_23-29-46--0400.xcresult`. No sustituye prueba física ni acceso OAuth real.

## Intento de instalación física

El iPhone 15 Pro Max conectado por cable aparece emparejado y con Developer Mode Enabled. La compilación para dispositivo se detiene antes de instalar: `Signing for "Preacher" requires a development team`. Cuenta Ricardo Arevalo visible en Xcode, pero equipo aún no asignado al proyecto y sin identidad local de firma. No se ha instalado la app.

## Instalación física completada — 24 de octubre de 2026

Equipo Ricardo Arevalo seleccionado en el proyecto. Xcode creó una identidad Apple Development y un perfil de desarrollo. Compilación Debug firmada correcta tras retirar metadatos extendidos del producto generado que impedían codesign. `devicectl` confirmó instalación y lanzamiento de `app.thepreacher.ios` en el iPhone 15 Pro Max conectado. No es distribución TestFlight ni App Store.

El contenedor instalado sigue cargando https://www.thepreacher.app: permite probar el contenedor nativo y las notas, pero no acredita el rediseño local ni el backend local en el dispositivo. Faltan recorridos visuales, OAuth real y validación funcional completa.
