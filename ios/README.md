# The Preacher para iPhone

Proyecto SwiftUI + WebKit, sin dependencias externas. Reutiliza el servicio existente de `https://www.thepreacher.app` (React/TanStack Start y APIs del mismo origen). No intenta empaquetar un servidor Node dentro del teléfono.

## Abrir y probar

Abrir `ios/Preacher.xcodeproj`, esquema **Preacher**, iPhone con iOS 17 o posterior. El identificador propuesto es `app.thepreacher.ios`; confirmar su disponibilidad y propiedad en la cuenta Apple antes del primer registro. La versión inicial es 1.0 (1). El destino de distribución es iPhone; no se anuncia soporte nativo de iPad.

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
- No se incluyen SDKs de publicidad, analítica nativa, permisos de contactos ni notificaciones push. Las notificaciones web de la PWA no equivalen a push nativo.
- Icono derivado del icono existente (512 → 1024); conviene sustituirlo por el original de mayor resolución antes de publicar.

## Estado de publicación

Esta es una base iOS funcional para validar; **no está enviada ni lista para someter a revisión hasta cerrar los bloqueos de `docs/app-store-release.md`**. La interfaz web se carga desde el servicio existente y puede cambiar independientemente del binario: cada cambio desplegado debe seguir siendo compatible con la versión publicada y las reglas de revisión.

Para firmar: Xcode → target Preacher → Signing & Capabilities → seleccionar el equipo aprobado. No guardar claves o certificados en Git. El Archive debe ser para un dispositivo iOS, configuración Release. Tras validar identidad y bloqueos, subir a App Store Connect y probar por TestFlight antes del envío.

Ver [validación local](../docs/ios-validation.md) para las pruebas realizadas y sus límites.
