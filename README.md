# kit-to-drive-api

Compuerta entre el front de Kit-to-Drive y Supabase. Habla el mismo protocolo que
Supabase (`/auth/v1`, `/rest/v1`, `/storage/v1`, `/functions/v1`), así el front sigue
usando `supabase-js` y solo cambia su URL (`VITE_API_URL`). Ya no necesita la URL
ni la llave de Supabase.

## Qué hace cada llamada
1. **Lista blanca** (`src/allowlist.ts`): solo tablas, RPC, buckets y funciones que el front usa.
   Todo lo demás → 403 sin llegar a Supabase.
2. **Sesión**: datos, archivos y funciones exigen un JWT de usuario (rol `authenticated`).
3. **Reenvío con el JWT del usuario**: RLS sigue decidiendo qué ve cada quien. El API solo
   guarda la llave `anon` (nunca `service_role`).
4. **Módulos apagados**: rechaza ESCRITURAS en tablas exclusivas de un módulo apagado
   (`MODULO_APAGADO`). La lectura sigue abierta hasta revisar módulo por módulo.
5. **CORS** solo para `ALLOWED_ORIGINS`, límite por minuto, sin caché, cabeceras de perfil de esquema descartadas.

## No incluye
- Tiempo real (websockets): el front usa consulta periódica.
- Registro público ni rutas admin de Auth.
- Archivos de más de ~4 MB (límite de Vercel); hay que subirlos por URL firmada o partir el archivo.

## Variables
Ver `.env.example`. `npm test` corre las pruebas; `npm run typecheck` los tipos.

## Para abrir una tabla nueva
Agregarla a `src/allowlist.ts` en un cambio revisado.

## Guía del equipo

Qué comando corre cada protección y qué hacer al agregar una tabla, función o bucket: [`kit-to-drive-web/docs/guia-del-equipo.md`](https://github.com/Lbassoco95/kit-to-drive-web/blob/main/docs/guia-del-equipo.md).
