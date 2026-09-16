# The Preacher

App para enviar mensajes de la Biblia (versión Recobro). Español e inglés.

## Vercel

`npm run build` genera la salida de Vercel (Nitro). En el proyecto:

- Framework: Other / Vite
- Build command: `npm run build`
- Install: `npm install`

Variables (Ajustes → Environment Variables):

- `BETTER_AUTH_SECRET` — una clave larga al azar
- `BETTER_AUTH_URL` — la URL de Vercel, por ejemplo `https://the-preacher.vercel.app`
- `DATABASE_URL` — Postgres (Neon u otro), para que las cuentas se queden

Sin `DATABASE_URL` el inicio de sesión no persiste. Google y X son del broker de Grok; en tu Vercel entra con correo.

## Local

```
npm install
npm run dev
```
