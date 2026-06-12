import { test, expect } from "@playwright/test";
import { loginAsNewUser } from "./helpers/auth";

test.describe("Company Search", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsNewUser(page);
    await page.goto("/search");
    await expect(
      page.getByRole("heading", { name: /Søk bedrifter i Norge/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("search page renders search input and basic filters", async ({
    page,
  }) => {
    await expect(page.locator("#query")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Søk$/ })).toBeVisible();

    // Basic checkbox filters
    await expect(page.locator("#hasEmail")).toBeVisible();
    await expect(page.locator("#hasPhone")).toBeVisible();
    await expect(page.locator("#hasWebsite")).toBeVisible();

    // Advanced filter toggle
    await expect(
      page.getByRole("button", { name: /Vis avanserte filtre/i }),
    ).toBeVisible();
  });

  test("advanced filters can be toggled", async ({ page }) => {
    const toggle = page.getByRole("button", { name: /Vis avanserte filtre/i });
    await toggle.click();

    // Toggling flips the button label
    await expect(
      page.getByRole("button", { name: /Skjul avanserte filtre/i }),
    ).toBeVisible();
  });

  test("searching with no matching companies shows an empty state", async ({
    page,
  }) => {
    // Test DB has no companies seeded — empty result is the expected state.
    await page.locator("#query").fill("Helt Ukjent Testbedrift AS");
    await page.getByRole("button", { name: /^Søk$/ }).click();

    // Either the explicit empty state or a (possibly zero) result count —
    // the UI must handle the empty DB without crashing.
    const emptyState = page.getByText(/Ingen resultater/i);
    const resultCount = page.getByText(/Viser \d+ av \d+ bedrifter/i);
    await expect(emptyState.or(resultCount).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe("Campaigns", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsNewUser(page);
    await page.goto("/campaigns");
    await expect(
      page.getByRole("heading", { name: /^Kampanjer$/ }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("campaigns page renders with create button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Ny kampanje/i }),
    ).toBeVisible();
  });

  test("create campaign form opens and requires a name", async ({ page }) => {
    await page.getByRole("button", { name: /Ny kampanje/i }).click();

    await expect(page.getByText("Create New Campaign")).toBeVisible();
    await expect(page.locator("#name")).toBeVisible();

    // Submitting without a name shows a validation toast
    await page.getByRole("button", { name: /Save as Draft/i }).click();
    await expect(page.getByText(/Kampanjenavn er påkrevd/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("creating a campaign adds it to the list", async ({ page }) => {
    const campaignName = `E2E Kampanje ${Date.now()}`;

    await page.getByRole("button", { name: /Ny kampanje/i }).click();
    await expect(page.locator("#name")).toBeVisible();

    await page.locator("#name").fill(campaignName);
    await page.locator("#subject").fill("E2E testemne");
    await page.locator("#body").fill("Hei {{company_name}}, dette er en test.");

    await page.getByRole("button", { name: /Save as Draft/i }).click();

    // Success toast + the campaign shows up in the list after refetch
    await expect(page.getByText(/Kampanje opprettet/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(campaignName)).toBeVisible({
      timeout: 15_000,
    });
  });
});
