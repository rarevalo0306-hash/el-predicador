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
| `VITE_AUTH_ENABLED` | `true` en deploy para cuentas |

Para Google en [Google Cloud Console](https://console.cloud.google.com/apis/credentials): crea un cliente OAuth web y añade como URI de redirección:

`https://www.thepreacher.app/api/auth/callback/google`

## Repo

https://github.com/rarevalo0306-hash/el-predicador
