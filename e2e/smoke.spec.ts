import { test, expect } from "@playwright/test";
import { loginAsNewUser } from "./helpers/auth";

/** Console errors that are expected/benign in a dev environment. */
function isBenignConsoleError(text: string): boolean {
  return (
    text.includes("favicon") ||
    text.includes("manifest") ||
    text.includes("service worker") ||
    text.includes("ServiceWorker") ||
    text.includes("sw.js") ||
    text.includes("workbox") ||
    text.includes("sentry") ||
    text.includes("Sentry") ||
    text.includes("analytics") ||
    text.includes("DevTools") ||
    text.includes("CORS") ||
    text.includes("sourcemap") ||
    text.includes("source map") ||
    // Failed network fetches for optional 3rd-party services (404/blocked)
    text.includes("Failed to load resource") ||
    text.includes("net::ERR_")
  );
}

test.describe("Smoke Tests", () => {
  test("landing page loads successfully", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/NorskLeads|Bedriftskontakter|Lead/i);

    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(100);
  });

  test("landing page has no critical console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      errors.push(`pageerror: ${err.message}`);
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const criticalErrors = errors.filter((e) => !isBenignConsoleError(e));
    expect(criticalErrors).toEqual([]);
  });

  test("public marketing pages render", async ({ page }) => {
    for (const path of ["/pricing", "/features", "/contact"]) {
      await page.goto(path);
      const heading = page.locator("h1, h2").first();
      await expect(heading).toBeVisible({ timeout: 15_000 });
    }
  });

  test("authenticated user can navigate via the sidebar", async ({ page }) => {
    await loginAsNewUser(page);

    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /Velkommen tilbake/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Sidebar navigation
    await page.getByRole("button", { name: "Søk bedrifter" }).click();
    await expect(page).toHaveURL(/\/search/);
    await expect(
      page.getByRole("heading", { name: /Søk bedrifter i Norge/i }),
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Kampanjer" }).click();
    await expect(page).toHaveURL(/\/campaigns/);
    await expect(
      page.getByRole("heading", { name: /^Kampanjer$/ }),
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("dashboard has no critical console errors for authenticated user", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      errors.push(`pageerror: ${err.message}`);
    });

    await loginAsNewUser(page);
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /Velkommen tilbake/i }),
    ).toBeVisible({ timeout: 15_000 });

    const criticalErrors = errors.filter((e) => !isBenignConsoleError(e));
    expect(criticalErrors).toEqual([]);
  });

  test("app is responsive across viewports", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page).toHaveTitle(/NorskLeads|Bedriftskontakter|Lead/i);

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await expect(page).toHaveTitle(/NorskLeads|Bedriftskontakter|Lead/i);
  });
});
