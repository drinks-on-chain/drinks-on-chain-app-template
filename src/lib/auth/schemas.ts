import {
  AuthTokensSchema,
  AuthUserSchema,
  MeResponseSchema as MocksMeResponseSchema,
  MeUserSchema as MocksMeUserSchema,
  SessionResponseSchema as MocksSessionResponseSchema,
} from "@drinks-on-chain/mocks";
import type { z } from "zod";

// Respuestas de sesión y de `me` tal como quedan al cerrar la Ola 1 (H1, contrato de la Ola 1
// §11): sin `tokens.refreshToken` (la renovación viaja solo en la cookie `doc_rt`) ni
// `user.userRole`, `user.wineryId` y `user.memberRole` (los permisos salen de la membresía
// activa). Se omiten del esquema para que la app no los exija si el backend ya no los envía ni
// pueda leerlos si aún llegan (zod descarta las claves desconocidas). Cuando los esquemas de
// `@drinks-on-chain/mocks` los quiten, este archivo se reduce a reexportarlos.

/** Tokens de login, refresh y switch-organization: solo el acceso (15 min). */
export const SessionTokensSchema = AuthTokensSchema.omit({ refreshToken: true });
export type SessionTokensResponse = z.infer<typeof SessionTokensSchema>;

/** Persona en la respuesta de sesión. */
export const SessionUserSchema = AuthUserSchema.omit({ userRole: true, wineryId: true, memberRole: true });
export type SessionUser = z.infer<typeof SessionUserSchema>;

/** Respuesta de login, refresh, switch-organization y aceptar invitación. */
export const SessionResponseSchema = MocksSessionResponseSchema.extend({
  user: SessionUserSchema,
  tokens: SessionTokensSchema,
});
export type SessionResponse = z.infer<typeof SessionResponseSchema>;

/** Persona de `GET/PATCH /v1/users/me`. */
export const MeUserSchema = MocksMeUserSchema.omit({ userRole: true });
export type MeUser = z.infer<typeof MeUserSchema>;

/** `GET/PATCH /v1/users/me`: `{ user, memberships, activeOrganizationId }`. */
export const MeResponseSchema = MocksMeResponseSchema.extend({ user: MeUserSchema });
export type MeResponse = z.infer<typeof MeResponseSchema>;
