import {
  MeResponseSchema,
  SessionResponseSchema,
  UserProfileResponseSchema,
  type LoginDto,
  type UpdateUserDto,
} from "@drinks-on-chain/mocks";
import { api, logoutSession } from "@/lib/api/client";
import { getLegacyRefreshToken, setSession } from "@/lib/api/session";

// Sesión y perfil (contrato de la Ola 0 §5). Las pantallas usan los hooks de hooks.ts.

/** `POST /v1/auth/login`: guarda el acceso en memoria; la renovación llega en la cookie. */
export async function login(credentials: LoginDto) {
  const res = await api("/v1/auth/login", {
    method: "POST",
    body: credentials,
    schema: SessionResponseSchema,
    auth: false,
  });
  setSession(res.tokens);
  return res;
}

/** `POST /v1/auth/logout`: revoca la sesión en el backend y la cierra aquí. */
export function logout() {
  return logoutSession();
}

/**
 * `POST /v1/auth/switch-organization`: tokens nuevos de la misma sesión con otra organización
 * activa. El backend exige el refresco de esa sesión (O0-BE-4) y lo rota: viaja en la cookie
 * `doc_rt` (`credentials: 'include'`) y, hasta H1, también en el cuerpo si llegó así en el login.
 */
export async function switchOrganization(organizationId: string) {
  const refreshToken = getLegacyRefreshToken();
  const res = await api("/v1/auth/switch-organization", {
    method: "POST",
    body: refreshToken ? { organizationId, refreshToken } : { organizationId },
    schema: SessionResponseSchema,
  });
  setSession(res.tokens);
  return res;
}

/** `GET /v1/users/me`: `{ user, memberships, activeOrganizationId }`. */
export function fetchMe(signal?: AbortSignal) {
  return api("/v1/users/me", { schema: MeResponseSchema, signal });
}

/** `PATCH /v1/users/me`: devuelve el perfil suelto (sin membresías). */
export function updateMe(body: UpdateUserDto) {
  return api("/v1/users/me", { method: "PATCH", body, schema: UserProfileResponseSchema });
}
