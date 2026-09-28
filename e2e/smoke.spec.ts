import { expect, test, type Page } from "@playwright/test";

// Humo de la plantilla contra los mocks (sesión del contrato de la Ola 0: acceso en memoria,
// renovación con cookie, organización activa y errores por campo).

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    // Un 401/422 esperado aparece como "Failed to load resource": no es un error del código.
    if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) errors.push(m.text());
  });
  return errors;
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill("demo1234");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();
}

/** Valor de una fila de la lista de datos del perfil. */
const valueOf = (page: Page, term: string) =>
  page.locator("dt", { hasText: term }).locator("xpath=following-sibling::dd[1]");

test("sin sesión, la portada lleva al login", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("login con un usuario de demo y lectura del perfil", async ({ page }) => {
  const errors = trackErrors(page);
  await login(page, "enologa@cintiviejo.test");
  await expect(page.getByText("Lic. Lucía Rojas").first()).toBeVisible();
  await expect(valueOf(page, "Organización activa")).toHaveText("Destilería Cinti Viejo");
  // Una sola membresía: no hay selector de organización.
  await expect(page.getByRole("combobox", { name: "Organización activa" })).toHaveCount(0);
  // El acceso no se guarda en el almacenamiento del navegador.
  expect(await page.evaluate(() => sessionStorage.getItem("doc.session"))).toBeNull();
  expect(errors).toEqual([]);
});

test("credenciales incorrectas muestran el error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("enologa@cintiviejo.test");
  await page.getByLabel("Contraseña").fill("incorrecta");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
});

test("la recarga mantiene la sesión (renovación con la cookie al arrancar)", async ({ page }) => {
  await login(page, "enologa@cintiviejo.test");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByText("Lic. Lucía Rojas").first()).toBeVisible();
});

test("cambio de organización con varias membresías (sofia)", async ({ page }) => {
  const errors = trackErrors(page);
  await login(page, "sofia@aramayo.test");
  await expect(valueOf(page, "Organización activa")).toHaveText("Bodega Altos de Calamuchita");
  await expect(valueOf(page, "Rol")).toHaveText("Enología");

  const selector = page.getByRole("combobox", { name: "Organización activa" });
  await expect(selector).toBeVisible();
  await selector.click();
  await page.getByRole("option", { name: /Casa Uriondo/ }).click();

  await expect(page.getByText("Ahora trabajas en Casa Uriondo.", { exact: true })).toBeVisible();
  await expect(valueOf(page, "Organización activa")).toHaveText("Casa Uriondo");
  await expect(valueOf(page, "Rol")).toHaveText("Dirección");

  // La organización elegida sobrevive a la recarga.
  await page.reload();
  await expect(valueOf(page, "Organización activa")).toHaveText("Casa Uriondo");
  expect(errors).toEqual([]);
});

test("una sesión revocada avisa en el login, también al recargar", async ({ page }) => {
  await login(page, "enologa@cintiviejo.test");
  // Revoca en los mocks las sesiones abiertas (como un bloqueo desde el Backoffice).
  await page.evaluate(() => {
    const key = "doc-mocks:sessions";
    const state = JSON.parse(localStorage.getItem(key) ?? "{}") as { sessions?: Record<string, { revoked: boolean }> };
    for (const session of Object.values(state.sessions ?? {})) session.revoked = true;
    localStorage.setItem(key, JSON.stringify(state));
  });
  const notice = page.getByText("Tu sesión se cerró por seguridad. Vuelve a entrar.");
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await expect(notice).toBeVisible();
  // En el propio login, otra recarga sigue avisando (la cookie es de la sesión revocada).
  await page.reload();
  await expect(notice).toBeVisible();
  // Entrar de nuevo lo quita.
  await login(page, "enologa@cintiviejo.test");
  await expect(notice).toHaveCount(0);
});

test("un 422 marca el campo exacto con details[].field", async ({ page }) => {
  await login(page, "enologa@cintiviejo.test");
  const name = page.getByLabel("Nombre completo");
  await name.fill("");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(name).toHaveAttribute("aria-invalid", "true");
});

test("cerrar sesión revoca la sesión: la recarga ya no entra", async ({ page }) => {
  await login(page, "enologa@cintiviejo.test");
  await page.getByRole("button", { name: /Menú de usuario/ }).click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
