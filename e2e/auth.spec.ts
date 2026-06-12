import { test, expect } from "@playwright/test";
import { loginAsNewUser, registerViaApi, uniqueEmail, TEST_PASSWORD } from "./helpers/auth";

test.describe("Authentication Flow", () => {
  test("landing page renders with register CTA", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/NorskLeads|Bedriftskontakter|Lead/i);
    // Primary CTA in the navbar links to /register
    await expect(
      page.getByRole("link", { name: /Kom i gang gratis/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Logg inn/i }).first(),
    ).toBeVisible();
  });

  test("registering via the UI form creates an account and reaches dashboard", async ({
    page,
  }) => {
    const email = uniqueEmail("ui-register");

    await page.goto("/register");
    await expect(page.getByText("Opprett konto").first()).toBeVisible();

    await page.locator("#name").fill("UI Testbruker");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(TEST_PASSWORD);
    await page.locator("#confirmPassword").fill(TEST_PASSWORD);
    await page.locator("#terms").click();

    await page.getByRole("button", { name: /Opprett konto/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /Velkommen tilbake/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("login with wrong password shows an error", async ({ page, request }) => {
    // Create the account with an isolated request context so the browser
    // context stays logged out.
    const account = await registerViaApi(request);

    await page.goto("/login");
    await page.locator("#email").fill(account.email);
    await page.locator("#password").fill("FeilPassord123!");
    await page.getByRole("button", { name: /Logg inn/i }).click();

    // Server responds 401 with a generic error which is rendered in an alert.
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("login with correct credentials reaches dashboard", async ({
    page,
    request,
  }) => {
    const account = await registerViaApi(request);

    await page.goto("/login");
    await page.locator("#email").fill(account.email);
    await page.locator("#password").fill(account.password);
    await page.getByRole("button", { name: /Logg inn/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /Velkommen tilbake/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("protected pages ask unauthenticated users to log in", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: /Logg inn for å fortsette/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("logout returns user to the public landing page", async ({ page }) => {
    const account = await loginAsNewUser(page, { name: "Logout Testbruker" });

    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /Velkommen tilbake/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Open the user menu in the sidebar footer (button shows name + email).
    await page.getByRole("button", { name: new RegExp(account.name) }).click();
    await page.getByRole("menuitem", { name: /Logg ut/i }).click();

    // Logout redirects to "/" and the session is gone.
    await page.waitForURL(/\/$/, { timeout: 15_000 });
    await expect(
      page.getByRole("link", { name: /Kom i gang gratis/i }).first(),
    ).toBeVisible({ timeout: 15_000 });

    // Session cookies are cleared — protected page now asks for login.
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /Logg inn for å fortsette/i }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
