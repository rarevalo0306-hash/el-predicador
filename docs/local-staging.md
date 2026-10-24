# Staging local — The Preacher

Configurado el 23 de octubre de 2026. Usa PostgreSQL del Supabase local existente (`supabase_db_supabase-laboratorio`), con base independiente `preacher_staging` y rol propietario `preacher_local` sin superusuario, creación de bases ni roles. No se copiaron datos de producción ni se modificaron las tablas del laboratorio u otras apps. La API REST/Studio del laboratorio sigue apuntando a su base original; The Preacher usa su backend Better Auth y conexión PostgreSQL directa.

## Inicio

Desde el repositorio: `node scripts/local-staging.mjs dev`. Aplica cambios de estructura con `node scripts/local-staging.mjs db:migrate`.

Configuración privada en `~/.config/the-preacher/local-staging.json`, fuera del repositorio, permisos 0600. El lanzador comprueba que la base sea la exclusiva de pruebas en 127.0.0.1. No imprimir ni copiar sus valores a documentación o navegador. Docker y el laboratorio deben estar encendidos. La conexión PostgreSQL está publicada solo en loopback, puerto 54322.

## Comprobaciones

- 16 migraciones aplicadas correctamente.
- Alta por HTTP y sesión de Better Auth comprobadas contra la app local.
- Cuenta verificada en PostgreSQL, guardado de estado y lectura tras cerrar y abrir conexión correctos.
- Cuenta y estado de prueba eliminados al terminar.
- Esta comprobación no demuestra todavía sincronización de interfaz entre dos dispositivos.

## Límites y próximos pasos

No se han configurado aquí las credenciales de API.Bible, Google, Apple ni proveedores de mensajes. La mensajería está desactivada. Las comprobaciones reales de esos servicios siguen pendientes. Esta base no es accesible desde Vercel Preview; no se creó túnel público. El staging depende de la Mac y no reemplaza una prueba de TestFlight o iPhone físico.

La rama Supabase `app-store-preview` alcanzó a crearse durante una llamada interrumpida con autorización anterior. Se eliminó al optar por staging local; la lista posterior confirma solo `main`. Podría facturarse el breve intervalo de existencia. No queda una rama de prueba facturable creada por esta tarea.
