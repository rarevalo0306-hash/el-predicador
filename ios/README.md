# The Preacher para iPhone

Proyecto SwiftUI + WebKit, sin dependencias externas. Reutiliza el servicio existente de `https://www.thepreacher.app` (React/TanStack Start y APIs del mismo origen). No intenta empaquetar un servidor Node dentro del teléfono.

## Abrir y probar

Abrir `ios/Preacher.xcodeproj`, esquema **Preacher**, iPhone con iOS 17 o posterior. El identificador propuesto es `app.thepreacher.ios`; confirmar su disponibilidad y propiedad en la cuenta Apple antes del primer registro. La versión vive en `ios/config/Version.xcconfig` (app y widget comparten versión); ahora 1.1 (3). El destino de distribución es iPhone; no se anuncia soporte nativo de iPad.

```sh
xcodebuild -project ios/Preacher.xcodeproj -scheme Preacher \
  -destination 'platform=iOS Simulator,name=iPhone 18 Pro' \
  -derivedDataPath ios/DerivedData test CODE_SIGNING_ALLOWED=NO
```

Si el simulador tiene otro nombre, elegir uno disponible en Xcode. Para regenerar el proyecto tras añadir archivos Swift: `python3 scripts/create-ios-project.py`. El generador no requiere CocoaPods, XcodeGen ni Ruby gems.

## Funciones nativas

- Contenedor WebKit con cookies persistentes, gesto de volver, progreso, errores recuperables y navegación externa confirmada.
- Biblioteca de lecturas en el dispositivo: notas personales por alta manual, búsqueda, lectura con Dynamic Type, compartir mediante el sistema y eliminación con confirmación.
- Guardado atómico en Documents con protección de archivos. No se captura ni descarga texto LBLA ni se sincroniza la biblioteca con el servidor.
- **Recordatorio diario por push (1.1).** El interruptor de Ajustes de la web, dentro de la app, llama a `preacherPush`. La app pide el permiso, registra el token en `POST /api/push/devices` (hora, idioma y zona horaria; sin cuenta ni datos personales) y el cron horario `/api/cron/push` lo envía por APNs. Al tocar la notificación se abre el pasaje. Solo lleva la cita, nunca texto LBLA.
- **Enlaces universales (1.1).** Los enlaces compartidos `https://www.thepreacher.app/?leer=…` abren la app en ese pasaje. Archivo: `/.well-known/apple-app-site-association`. Entitlement: `applinks:www.thepreacher.app` y `applinks:thepreacher.app`.
- **Widget (1.1).** Extensión `PreacherWidget` (`app.thepreacher.ios.widget`), en tamaños pequeño y mediano. Muestra la cita, el tema y la foto del día desde `/api/widget/today`; al tocarlo abre el pasaje. Sin texto bíblico.
- **Accesos rápidos (1.1).** Al mantener presionado el ícono: Versículo de hoy, Biblia (`?abrir=biblia`) y Mis lecturas.
- No se incluyen SDKs de publicidad, analítica nativa ni permisos de contactos.
- Icono derivado del icono existente (512 → 1024); conviene sustituirlo por el original de mayor resolución antes de publicar.

## Estado de publicación

Esta es una base iOS funcional para validar; **no está enviada ni lista para someter a revisión hasta cerrar los bloqueos de `docs/app-store-release.md`**. La interfaz web se carga desde el servicio existente y puede cambiar independientemente del binario: cada cambio desplegado debe seguir siendo compatible con la versión publicada y las reglas de revisión.

Para firmar: Xcode → target Preacher → Signing & Capabilities → seleccionar el equipo aprobado. No guardar claves o certificados en Git. El Archive debe ser para un dispositivo iOS, configuración Release. Tras validar identidad y bloqueos, subir a App Store Connect y probar por TestFlight antes del envío.

Ver [validación local](../docs/ios-validation.md) para las pruebas realizadas y sus límites.
