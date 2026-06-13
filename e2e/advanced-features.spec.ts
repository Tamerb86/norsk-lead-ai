import { test, expect } from "@playwright/test";
import { loginAsNewUser } from "./helpers/auth";

test.describe("Dashboard Widgets", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsNewUser(page);
    await page.goto("/dashboard");
  });

  test("dashboard renders welcome heading and stats widgets", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: /Velkommen tilbake/i }),
    ).toBeVisible({ timeout: 20_000 });

    // Widget grid renders cards once stats load (empty data is fine)
    const cards = page.locator('[class*="card"], [class*="Card"]');
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
  });

  test("date range selector is available", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Velkommen tilbake/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Siste 30 dager/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe("Feature pages render without crashing", () => {
  // Each page must mount inside the dashboard layout and show its heading,
  // even with a brand-new account and an empty database.
  const pages: Array<{ path: string; heading: RegExp }> = [
    { path: "/webhooks", heading: /^Webhooks$/ },
    { path: "/referral", heading: /Henvisning/i },
    { path: "/ab-testing", heading: /A\/B-testing/i },
    { path: "/lead-scoring", heading: /Lead Scoring/i },
    { path: "/activity", heading: /Aktivitetslogg/i },
    { path: "/inbox", heading: /^Innboks$/ },
    { path: "/calendar", heading: /Kalender/i },
    // A brand-new user has no team yet, so /team renders its "No Team"
    // empty state instead of the full settings view.
    { path: "/team", heading: /Team Settings|No Team/i },
  ];

  for (const { path, heading } of pages) {
    test(`${path} renders its heading`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (err) => pageErrors.push(err.message));

      await loginAsNewUser(page);
      await page.goto(path);

      await expect(
        page.getByRole("heading", { name: heading }).first(),
      ).toBeVisible({ timeout: 20_000 });
      expect(pageErrors).toEqual([]);
    });
  }
});

test.describe("Reply Inbox", () => {
  test("/inbox shows the empty state for a fresh user", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await loginAsNewUser(page);
    await page.goto("/inbox");

    await expect(
      page.getByRole("heading", { name: /^Innboks$/ }).first(),
    ).toBeVisible({ timeout: 20_000 });

    // A brand-new account has no inbound messages, so the empty state shows.
    await expect(page.getByText(/Ingen svar ennå/i)).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByText(/Når leads svarer på e-postene dine, dukker de opp her/i),
    ).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});

test.describe("Notifications", () => {
  // The NotificationCenter component exists in the codebase
  // (client/src/components/NotificationCenter.tsx) but is not mounted
  // anywhere in the current UI (no imports outside its own file), so there
  // is no notification bell to assert on.
  test.skip("notification bell is visible", async () => {
    /* skipped: NotificationCenter is not mounted in DashboardLayout */
  });
});

test.describe("Responsive Design", () => {
  test("dashboard works on mobile viewport", async ({ page }) => {
    await loginAsNewUser(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: /Velkommen tilbake/i }),
    ).toBeVisible({ timeout: 20_000 });

    // Mobile header shows the sidebar trigger
    await expect(
      page.getByRole("button", { name: /Toggle Sidebar/i }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("dashboard works on desktop viewport with sidebar", async ({
    page,
  }) => {
    await loginAsNewUser(page);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: /Velkommen tilbake/i }),
    ).toBeVisible({ timeout: 20_000 });

    // Sidebar with app name is visible on desktop
    await expect(page.getByText("NorskLeads").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Søk bedrifter" }),
    ).toBeVisible();
  });
});
