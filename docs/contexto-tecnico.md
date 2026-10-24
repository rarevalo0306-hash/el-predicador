# The Preacher: contexto técnico para el rediseño

Revisión del árbol local: 23 de octubre de 2026. Rama `codex/ios-app-store`, base Git `1d476ed0b66fb8dda9d5d8d487dd45e0490a364e`, con cambios sin commit de la preparación iOS/LBLA. Este documento describe ese árbol, no certifica el despliegue público.

## Cómo leer esta documentación

| Documento | Contenido |
| --- | --- |
| [Arquitectura](arquitectura.md) | Capas, módulos, dependencias, autenticación y operación |
| [Producto y reglas](logica-negocio.md) | Pantallas, actores, capacidades y límites |
| [Datos y contratos](datos-y-contratos.md) | Persistencia, tablas, relaciones, endpoints y server functions |
| [Flujos](flujos-ejecucion.md) | Secuencias normales, fallos, recuperación y efectos secundarios |
| [Hallazgos y contrato de rediseño](revision-y-rediseno.md) | Diferencias entre intención y código, riesgos y aceptación |
| [Inventario](inventario-codigo.md) | Archivos propios, tamaño, huella y nivel de revisión |
| [Publicación](app-store-release.md) | Pendientes de App Store |
| [API.Bible](api-bible-release.md) | Controles LBLA y evidencia anterior de integración |

## Resumen del sistema

The Preacher combina lectura bíblica, contenido doctrinal y acompañamiento personal: elegir referencias por tema, guardarlas, organizar personas e iglesia y compartir mensajes. No es un sistema multiiglesia: cada cuenta guarda su propia configuración de iglesia; no existen organizaciones, membresías o roles por congregación en el modelo actual.

El producto web canónico está en `src/`, con React 19, TanStack Start/Router, Vite y backend Nitro. Usa PostgreSQL mediante `pg`, Better Auth y estado cliente Zustand. La etiqueta interna `neon` en `db.ts` significa conexión PostgreSQL configurada; no prueba que el proveedor real sea Neon. La documentación de operación contempla Supabase.

El iPhone es una aplicación SwiftUI con WKWebView que abre el sitio remoto y añade autenticación de sistema y una biblioteca local de notas. No es una reconstrucción nativa de todas las pantallas. El proyecto `spa/` es una versión anterior y no debe recibir el rediseño.

LBLA se consulta a API.Bible desde el servidor. Se mantienen identificadores históricos `rcv-` y nombres como `recobro.ts` para compatibilidad. Los nombres de archivos, comentarios antiguos y presencia de botones no bastan para determinar qué está habilitado: los guardas del backend y los caminos de ejecución son la autoridad.

## Alcance y grado de certeza

- **Revisión estática actual:** inventario transversal del código propio, rutas, configuraciones, migraciones, pruebas y aplicación nativa; lectura dirigida de los módulos que gobiernan los flujos. El inventario distingue lectura dirigida e inspección estructural. No equivale a una auditoría línea por línea de bibliotecas externas ni a demostrar todos los comportamientos en ejecución.
- **Validación anterior:** existen pruebas documentadas de compilación, suites locales, simulador y una llamada en la consola oficial API.Bible. Véase [validación iOS](ios-validation.md). Esta revisión documental no vuelve a ejecutar esos ensayos ni convierte mocks en pruebas de producción.
- **Pendiente externo:** estado actual de Vercel, base desplegada, migraciones aplicadas, funcionamiento real de OAuth Apple/Google, FUMS, entrega Twilio y dispositivo físico. No se inspeccionaron cuentas ni secretos para este trabajo.
- **Cambios de este trabajo:** documentación e índice; no modificación de comportamiento, migraciones, cuentas, envíos o despliegues.

## Vocabulario que debe conservar el rediseño

- **Referencia:** libro, capítulo y versículo(s); puede persistirse sin guardar el cuerpo de las Escrituras.
- **Lectura LBLA:** texto licenciado obtenido del backend, con copyright y vencimiento.
- **Guía:** contenido editorial propio más referencias; no es una traducción de la Biblia.
- **Gente:** destinatarios personales dentro del estado de una cuenta o del invitado.
- **Registro público:** solicitud “Quiero recibir la palabra” almacenada en `contacts`; no es automáticamente una cuenta ni un destinatario personal.
- **Recordatorio:** aviso que ayuda a la persona a actuar; no envía por sí mismo un WhatsApp/SMS.
- **Programación automática:** registro servidor independiente con consentimiento, canal, horario, zona y activación explícita.
- **Aceptado:** el proveedor recibió un envío; no significa entregado o leído.
- **Mis lecturas (iOS):** notas locales del dispositivo, separadas de Guardados de la cuenta web.

## Mantenimiento

Antes de modificar un módulo, leer su regla de negocio y su flujo. Una nueva función debe actualizar capacidades, datos, permisos, estados vacíos/error y aceptación. Si cambia un contrato, actualizar estos documentos en el mismo cambio. Regenerar el inventario al cambiar archivos; las huellas corresponden al contenido revisado, no al commit base por sí solo.

## Verificación de esta entrega

Inventario de 312 archivos propios (45.159 líneas): 74 con lectura dirigida y el resto con inspección estructural. Se comprobaron enlaces locales y bloques Markdown de 13 documentos, sin enlaces rotos ni bloques sin cerrar; `git diff --check` pasó. Se conservaron los cambios funcionales anteriores. No se ejecutaron nuevamente pruebas de aplicación ni se desplegó: esta entrega modifica documentación únicamente.
