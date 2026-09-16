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
| `CONTACTS_ADMIN_PIN` | Clave para ver la lista de contactos (obligatoria; sin ella la lista no abre) |
| `CONTACTS_ADMIN_USER_IDS` | Opcional: IDs de usuario permitidos, separados por coma |
| `CONTACTS_EMAIL` | Correo FormSubmit para avisos de nuevos registros |
| `DATABASE_URL` | Postgres (auth + estado + contactos) |
| `VITE_AUTH_ENABLED` | `true` en deploy para cuentas |

## Repo

https://github.com/rarevalo0306-hash/el-predicador
