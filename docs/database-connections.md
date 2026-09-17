# Conexiones a Supabase en Vercel

`scripts/postgres-options.mjs` es compartido por el migrador, los datos de la app y Better Auth. En Vercel (`VERCEL=1`), cambia el puerto 5432 del host compartido de Supabase a 6543, para usar el pooler en modo transacción. Conserva host, usuario, contraseña y verificación del certificado TLS. Cada pool de la app usa como máximo una conexión y libera las conexiones inactivas después de cinco segundos.

Esto evita que las instancias de Vercel reserven todas las sesiones disponibles y provoquen `EMAXCONNSESSION` durante un despliegue. No cambia endpoints directos ni hosts de otros proveedores. El modo local conserva el puerto configurado.

Las consultas de `pg` y Kysely no usan sentencias preparadas con nombre ni estado de sesión persistente. Las migraciones mantienen cada archivo dentro de una transacción con el mismo cliente. Cualquier futura función que use `LISTEN`, bloqueos de sesión o sentencias preparadas con nombre necesitará revisar esta compatibilidad.

Referencia: [Conexiones a Postgres de Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).
