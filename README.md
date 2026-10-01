# drinks-on-chain-app-template

Plantilla de aplicación del ecosistema **Drinks on Chain** (Etapa 0.3 del roadmap). De ella nacen el ERP, el Marketplace, el POS y el Backoffice. Planificación en [drinks-on-chain-docsfront](https://github.com/BrianKGR01/drinks-on-chain-docsfront).

## Qué trae

| Pieza                                                                                                                                                                                                                        | Dónde                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Next.js 16 (App Router, Turbopack), React 19, TypeScript estricto, Tailwind 4                                                                                                                                                | —                                                           |
| Sistema de diseño `@drinks-on-chain/ui` (tokens, componentes, shells)                                                                                                                                                        | `src/app/globals.css`, `src/components/app-frame.tsx`       |
| Datos de prueba `@drinks-on-chain/mocks` con MSW en el navegador                                                                                                                                                             | `src/app/providers.tsx` (`MocksGate`)                       |
| Cliente de API tipado contra `/api/v1/*` del propio origen (P-1): envoltorio `{ success, data \| error }`, Bearer, renovación silenciosa con una sola petición en vuelo, errores tipados, listas paginadas y `fetchAllPages` | `src/lib/api/`                                              |
| Sesión del contrato de la Ola 0: acceso de 15 min solo en memoria, renovación rotativa en la cookie `doc_rt`, recuperación al recargar, cierre con aviso si se revoca                                                        | `src/lib/api/session.ts`, `src/lib/api/client.ts`           |
| Organización activa: `useMe()` con membresías, selector en la cabecera, guardia por audiencia                                                                                                                                | `src/lib/auth/`, `src/components/organization-switcher.tsx` |
| Errores de validación por campo (`details[].field`)                                                                                                                                                                          | `src/lib/api/field-errors.ts`                               |
| Cifras y fechas es-BO con el único `parseDecimal` (`12.100` = 12100)                                                                                                                                                         | `src/lib/format.ts`                                         |
| TanStack Query con reintentos solo en red y 5xx                                                                                                                                                                              | `src/lib/query-client.ts`                                   |
| Diccionario en español                                                                                                                                                                                                       | `src/lib/i18n/es.ts`                                        |
| Login, zona privada con AppShell y página de ejemplo con estados cargando / error                                                                                                                                            | `src/app/(auth)`, `src/app/(app)`                           |
| Panel `/__mocks`: escenario, restablecer datos, entrar como cualquier usuario de demo                                                                                                                                        | `src/app/%5F%5Fmocks`                                       |
| Vitest + Testing Library, Playwright (escritorio y tablet), ESLint, Prettier                                                                                                                                                 | `vitest.config.mts`, `playwright.config.ts`                 |
| CI: lint, tipos, pruebas, build y E2E                                                                                                                                                                                        | `.github/workflows/ci.yml`                                  |

## Empezar

Requisitos: Node 22 (`.nvmrc`) y pnpm 10 (`corepack enable`).

```bash
pnpm install
cp .env.example .env.local
pnpm dev:mocks        # http://localhost:3009 con datos de prueba
```

Usuarios de demo en `/__mocks` (contraseña `demo1234`), p. ej. `enologa@cintiviejo.test`.

| Script                                     | Qué hace                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------- |
| `pnpm dev` / `pnpm dev:mocks`              | Servidor de desarrollo sin / con MSW                                                  |
| `pnpm lint`, `pnpm typecheck`, `pnpm test` | Calidad (el typecheck genera antes los tipos de rutas de Next)                        |
| `pnpm e2e`                                 | Playwright contra un build de producción con mocks (en local usa el Chrome instalado) |
| `pnpm format`                              | Prettier                                                                              |

## Variables de entorno

| Variable                                                                    | Uso                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API_ORIGIN`                                                                | **Solo servidor.** Origen del backend: `src/proxy.ts` reescribe `/api/v1/*` a `${API_ORIGIN}/v1/*`. Obligatoria sin mocks, también **en el build** (se valida al construir). Desarrollo: `https://136.243.223.39.sslip.io`                               |
| `PROXY_SHARED_SECRET`                                                       | **Solo servidor, nunca `NEXT_PUBLIC_`.** Firma la IP del cliente para el backend (O1-OPS-1): mismo valor que en el backend del entorno (si hay varios separados por comas, firma con el primero). Vacía = sin firma: el backend usa la IP de la conexión |
| `NEXT_PUBLIC_MOCKS`                                                         | `1` arranca MSW (intercepta `/api/v1/*` en el navegador) y habilita `/__mocks` en producción (demos). Con `1` no hace falta `API_ORIGIN`                                                                                                                 |
| `NEXT_PUBLIC_URL_LANDING`, `NEXT_PUBLIC_URL_BODEGAS`, `NEXT_PUBLIC_URL_APP` | Enlaces a los otros sitios; nunca se escriben hosts en componentes                                                                                                                                                                                       |

Cambiar de mocks a backend real: `NEXT_PUBLIC_MOCKS=0` y `API_ORIGIN` al servidor. Las pantallas no cambian. `NEXT_PUBLIC_API_URL` ya no existe: el navegador nunca llama al backend directamente.

## Sesión (contrato de la Ola 0 §5 y §7)

- **P-1**: la app llama a `/api/v1/*` de su propio origen; la cookie de renovación `doc_rt` (`HttpOnly`, `SameSite=Lax`) queda de primera parte aunque la API esté en otro dominio.
- **IP real del cliente** (O1-OPS-1): `src/proxy.ts` (`src/lib/api-proxy.ts`) reescribe `/api/v1/*` al backend sin tocar método, cuerpo (en streaming, sin límite de tamaño de función), cookies ni respuesta (`Set-Cookie`, `Retry-After`, `Content-Disposition`), y con `PROXY_SHARED_SECRET` añade `X-DOC-Client-IP`, `X-DOC-Proxy-Timestamp` y `X-DOC-Proxy-Signature` (HMAC-SHA256 de `MÉTODO|RUTA_CON_QUERY|IP|TIMESTAMP`, query canónica). La IP sale de `x-real-ip`/`x-forwarded-for`, que en Vercel pone la plataforma; fuera de Vercel hace falta un proxy delante que los reescriba. Las `X-DOC-*` del cliente se descartan.
- El acceso (15 min) vive **solo en memoria**. Al arrancar, `bootstrapSession()` llama a `POST /api/v1/auth/refresh` con la cookie: así una recarga no cierra la sesión. Nada de la sesión se guarda en `sessionStorage` ni `localStorage` (el valor `doc.session` de la plantilla 0.1 se borra al arrancar).
- Renovación silenciosa 30 s antes de caducar o ante un 401, con **una sola** petición de renovación en vuelo; las peticiones que fallaron a la vez se reintentan con el acceso nuevo.
- `AUTH_REFRESH_REUSED` o `AUTH_SESSION_REVOKED` → la sesión se cierra y el login muestra el aviso "Tu sesión se cerró por seguridad" (`useSessionEndReason()`). Si la revocación se descubre al recargar (la renovación del arranque responde con esos códigos), el aviso aparece igual al llegar al login, sin sacar de su página a quien está en una ruta pública. `useLogout()` llama a `POST /v1/auth/logout` y después cierra la sesión local sin aviso.
- `useSwitchOrganization()` (`POST /v1/auth/switch-organization`) vacía la caché de TanStack Query: descarta las consultas inactivas y reinicia las activas con el token nuevo; `me` se actualiza con la respuesta para que el shell no se desmonte.
- **Desde el cierre de la Ola 1 (H1)** el refresco viaja solo en la cookie: `refresh` y `switch-organization` no llevan `refreshToken` en el cuerpo, y un `tokens.refreshToken` que aún llegue en la respuesta se ignora. Los esquemas de `src/lib/auth/schemas.ts` omiten `tokens.refreshToken` y `user.userRole/wineryId/memberRole` (los permisos salen de la membresía activa); `PATCH /v1/users/me` devuelve `{ user, memberships, activeOrganizationId }` como `GET`, y los `details` solo se leen como `{ field, message }`.

## Listas

`limit` por defecto 20 y **máximo 100** (más → 422). Las pantallas que necesitan la colección entera usan `fetchAllPages()` de `src/lib/api/pagination.ts`, que recorre páginas de 100.

## Errores por campo

`fieldErrorsFrom(error, ["email", "password"])` reparte los `details: [{ field, message }]` de un 422 entre los campos del formulario (nombre exacto o prefijo: `items.0.quantity` → `items`) y deja el resto en `formErrors`. Ejemplos: el login y "Editar el nombre" en la página de inicio.

## Crear una app nueva desde la plantilla

1. `gh repo create drinks-on-chain/drinks-on-chain-<sistema> --public --template drinks-on-chain/drinks-on-chain-app-template --clone`.
2. En `package.json`: `name` y el puerto de `dev`, `dev:mocks` y `start` (ERP 3002; ver el `CLAUDE.md` de la carpeta paraguas).
3. `CLIENT_APP` en `src/lib/client-app.ts` (`ERP`, `BACKOFFICE`, `MARKETPLACE` o `POS`): el cliente de API la envía en la cabecera `X-Client-App` de todas las peticiones y el backend la guarda en la bitácora (contrato de la Ola 1 §7).
4. Metadatos en `src/app/layout.tsx`, tema (`data-theme="cava"` en el POS) y navegación en `src/components/app-frame.tsx` (o el shell que toque: `AdminShell`, `StoreShell`, `KioskShell`).
5. Crear la rama `dev`, conectar el repo en Vercel (producción desde `main`, previews desde `dev`) con `NEXT_PUBLIC_MOCKS=1` mientras no haya backend.

## Convenciones

Trabajo en `dev`, PR `dev → main` por hito, Conventional Commits. Detalle en `CLAUDE.md`.

## Actualizar los paquetes compartidos

`@drinks-on-chain/ui` y `@drinks-on-chain/mocks` se instalan desde el tarball de su GitHub Release:

```bash
pnpm add https://github.com/drinks-on-chain/drinks-on-chain-design-system/releases/download/vX.Y.Z/drinks-on-chain-ui-X.Y.Z.tgz
pnpm add https://github.com/drinks-on-chain/drinks-on-chain-mocks/releases/download/vX.Y.Z/drinks-on-chain-mocks-X.Y.Z.tgz
pnpm exec msw init public --save   # si cambió msw
```
