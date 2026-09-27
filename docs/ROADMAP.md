# Roadmap de la plantilla (Etapa 0.3)

Paso 0.3 de `docs/03-roadmap-frontend.md`: "Crear el ERP desde la plantilla lleva menos de una hora".

- [x] Next.js 16, TypeScript estricto, Tailwind 4, ESLint, Prettier, LF · 2026-09-25
- [x] Cliente de API tipado con envoltorio, renovación de token y listas en las dos formas · 2026-09-25
- [x] Sesión y hooks de autenticación (`useLogin`, `useMe`, `useLogout`) · 2026-09-25
- [x] `@drinks-on-chain/ui` 0.1.0 y `@drinks-on-chain/mocks` 0.1.0 desde GitHub Releases · 2026-09-25
- [x] MSW en el navegador con `NEXT_PUBLIC_MOCKS=1` y panel `/__mocks` · 2026-09-25
- [x] Login, zona privada con AppShell y página de ejemplo con estados · 2026-09-25
- [x] Vitest, Playwright (escritorio y tablet) y CI · 2026-09-25
- [x] README con los pasos para crear una app · 2026-09-25
- [ ] Marcar el repo como plantilla de GitHub
- [ ] Proyecto en Vercel con preview de `dev`

## Ola 0 · Sesiones y estándares (O0-PK-1, O0-ERP-1)

Contrato: `plan/contratos/o0-sesiones-y-estandares.md` del plan maestro.

- [x] `@drinks-on-chain/ui` 0.2.0 y `@drinks-on-chain/mocks` 0.2.0-rc.1 · 2026-09-27
- [x] `src/lib/format.ts` con el único `parseDecimal` (es-BO), `fmtNumber`, `fmtDate` y sus pruebas · 2026-09-27
- [x] Cliente contra `/api/v1/*` del propio origen con `rewrites` a `${API_ORIGIN}/v1/*` (P-1) y `API_ORIGIN` validada en `env.ts` · 2026-09-27
- [x] Acceso solo en memoria, renovación con cookie (`credentials: 'include'`), recuperación al arrancar, una sola renovación en vuelo, cierre con aviso ante `AUTH_REFRESH_REUSED`/`AUTH_SESSION_REVOKED`, `logout` contra el endpoint · 2026-09-27
- [x] Tolerancia transitoria al `refreshToken` en el cuerpo (se retira en H1) · 2026-09-27
- [x] Organización activa: `useMe()` con membresías, selector en la cabecera, caché vaciada al cambiar, guardia por audiencia · 2026-09-27
- [x] `fieldErrorsFrom()` para marcar el campo exacto con `details[].field` (login y página de ejemplo) · 2026-09-27
- [x] `fetchAllPages()` para colecciones completas con `limit` ≤ 100 · 2026-09-27
- [x] Pruebas unitarias del cliente y E2E de humo (login, cambio de organización con `sofia`, recarga, cierre de sesión, error por campo) · 2026-09-27
- [ ] Probar contra el backend de desarrollo cuando publique O0-BE-4 (cookie `doc_rt`, `switch-organization`)

## Ola 1 · Back office y bodegas (O1-ERP-1)

- [x] Cabecera `X-Client-App` en todas las peticiones del cliente de API (`CLIENT_APP` en `src/lib/client-app.ts`; la plantilla se identifica como `API`) · 2026-09-27
- [x] `switch-organization` con el refresco de la misma sesión (cookie y, hasta H1, `refreshToken` en el cuerpo) y espera de `Retry-After` en los 429 (`ApiError.retryAfter`, `errorMessage`), como el backend O0-BE-4 · 2026-09-27
- [x] IP real del cliente detrás del proxy (O1-OPS-1): `rewrites` sustituidos por `src/proxy.ts`, que reescribe `/api/v1/*` a `${API_ORIGIN}/v1/*` con `X-DOC-Client-IP` firmada (HMAC con `PROXY_SHARED_SECRET`, variable de servidor) · 2026-09-27
