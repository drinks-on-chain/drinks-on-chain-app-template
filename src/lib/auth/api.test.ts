import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAccessToken, resetSessionForTests, setSession } from "@/lib/api/session";
import { login, switchOrganization, updateMe } from "./api";

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, statusCode: 200, timestamp: "", path: "/x", data }), { status: 200 });

const user = {
  id: "u1",
  email: "enologa@cintiviejo.test",
  fullName: "Lucía Rojas",
  phoneNumber: null,
  preferredLocale: "es",
  audience: "STAFF",
};
const membership = {
  id: "m1",
  organizationId: "w1",
  organizationType: "WINERY",
  organizationName: "Destilería Cinti Viejo",
  organizationStatus: "ACTIVE",
  role: "ENOLOGIST",
  status: "ACTIVE",
};
/** Respuesta de sesión tal como queda en H1: sin `refreshToken` ni `userRole/wineryId/memberRole`. */
const session = (accessToken: string) => ({
  user,
  memberships: [membership],
  activeOrganizationId: "w1",
  tokens: { accessToken, tokenType: "Bearer", expiresIn: 900 },
});

describe("auth/api (H1)", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const lastBody = () => JSON.parse(String(fetchMock.mock.calls.at(-1)![1]!.body));

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    resetSessionForTests();
  });
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("el login vale sin refreshToken ni campos de 0.1, y los ignora si aún llegan", async () => {
    fetchMock.mockResolvedValueOnce(ok(session("a1")));
    await expect(login({ email: user.email, password: "x" })).resolves.toMatchObject({ activeOrganizationId: "w1" });
    expect(getAccessToken()).toBe("a1");

    const legacy = session("a2");
    fetchMock.mockResolvedValueOnce(
      ok({
        ...legacy,
        user: { ...user, userRole: "WINERY_ADMIN", wineryId: "w1", memberRole: "OWNER" },
        tokens: { ...legacy.tokens, refreshToken: "sid.1.secreto" },
      }),
    );
    const res = await login({ email: user.email, password: "x" });
    expect(res.user).not.toHaveProperty("userRole");
    expect(res.user).not.toHaveProperty("wineryId");
    expect(res.tokens).not.toHaveProperty("refreshToken");
  });

  it("cambiar de organización envía solo { organizationId } (el refresco va en la cookie)", async () => {
    setSession({ accessToken: "a1", expiresIn: 900 });
    fetchMock.mockResolvedValueOnce(ok(session("a2")));
    await switchOrganization("w1");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("/api/v1/auth/switch-organization");
    expect(init!.credentials).toBe("include");
    expect(lastBody()).toEqual({ organizationId: "w1" });
    expect(getAccessToken()).toBe("a2");
  });

  it("PATCH /users/me devuelve { user, memberships, activeOrganizationId }", async () => {
    setSession({ accessToken: "a1", expiresIn: 900 });
    fetchMock.mockResolvedValueOnce(
      ok({
        user: { ...user, isActive: true, createdAt: "2026-09-01T00:00:00.000Z", wineryMemberships: [] },
        memberships: [membership],
        activeOrganizationId: "w1",
      }),
    );
    const me = await updateMe({ fullName: "Lucía R." });
    expect(me.memberships).toHaveLength(1);
    expect(lastBody()).toEqual({ fullName: "Lucía R." });
  });
});
