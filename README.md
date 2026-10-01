# El Predicador

Sitio público: [thepreacher.app](https://www.thepreacher.app/)

App funcional (PWA): mensajes de la Biblia (Recobro), doctrina, temas, guardados y contacto. Español e inglés. Se puede instalar en la pantalla de inicio del teléfono.

## Código canónico

- **`src/`** — la app completa (TanStack Start + React). Es lo que construye y despliega este repo.
- `spa/` — versión antigua liviana; se mantiene solo por compatibilidad. No añadir features nuevas ahí.

## Variables de entorno (producción)

Configúralas en el hosting (nunca en el código):

| Variable | Uso |
| --- | --- |
| `BETTER_AUTH_URL` | URL pública, ej. `https://www.thepreacher.app` |
| `BETTER_AUTH_SECRET` | Secreto largo para sesiones |
| `DATABASE_URL` | Postgres (auth + estado + contactos) |
| `GOOGLE_CLIENT_ID` | OAuth de Google (Crear / Entrar con Google) |
| `GOOGLE_CLIENT_SECRET` | Secreto OAuth de Google |
| `CONTACTS_ADMIN_PIN` | Clave para ver la lista de contactos |
| `CONTACTS_ADMIN_USER_IDS` | Opcional: IDs de usuario permitidos, separados por coma |
| `CONTACTS_EMAIL` | Correo FormSubmit para avisos de nuevos registros |
| `API_BIBLE_KEY` | Clave privada de API.Bible para LBLA y NASB 2020 |
| `API_BIBLE_LBLA_ID` | Opcional: fija la edición LBLA si la cuenta devuelve varias |
| `API_BIBLE_NASB20_ID` | Opcional: fija la edición NASB 2020 si la cuenta devuelve varias |
| `VITE_AUTH_ENABLED` | `true` en deploy para cuentas |

La clave de API.Bible se usa únicamente en funciones del servidor. Nunca debe
llevar el prefijo `VITE_`, guardarse en Git ni enviarse al navegador. La app
descubre automáticamente entre las licencias activas las ediciones LBLA y
NASB 2020; los IDs opcionales solo son necesarios si la cuenta ofrece varias
ediciones con nombres similares.

Para Google en [Google Cloud Console](https://console.cloud.google.com/apis/credentials): crea un cliente OAuth web y añade como URI de redirección:

`https://www.thepreacher.app/api/auth/callback/google`

## Repo

https://github.com/rarevalo0306-hash/el-predicador
