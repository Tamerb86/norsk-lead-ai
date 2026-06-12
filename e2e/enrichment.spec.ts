import { test, expect } from "@playwright/test";
import { loginAsNewUser } from "./helpers/auth";

test.describe("Auto Enrichment", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsNewUser(page);
  });

  test("auto-enrichment page renders", async ({ page }) => {
    await page.goto("/auto-enrichment");

    await expect(
      page.getByRole("heading", { name: "Automatisk berikelse", exact: true }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole("button", { name: /Start berikelse/i }),
    ).toBeVisible();
  });
});

test.describe("Lead Enrichment & Validation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsNewUser(page);
    await page.goto("/enrichment");
    await expect(
      page.getByRole("heading", { name: /Lead Enrichment & Validation/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("renders all three validation tools", async ({ page }) => {
    await expect(page.getByText("Email Validation")).toBeVisible();
    await expect(page.getByText("Phone Validation")).toBeVisible();
    await expect(page.getByText("Website Checker")).toBeVisible();
  });

  test("validates an email address and shows a score", async ({ page }) => {
    await page.getByPlaceholder(/Enter email address/i).fill("test@gmail.com");
    await page.getByRole("button", { name: /^Validate$/ }).first().click();

    // Result panel shows score and the per-check breakdown
    await expect(page.getByText(/\/100/).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("Syntax").first()).toBeVisible();
    await expect(page.getByText("MX Records", { exact: true })).toBeVisible();
  });

  test("flags invalid email syntax", async ({ page }) => {
    await page.getByPlaceholder(/Enter email address/i).fill("not-an-email");
    await page.getByRole("button", { name: /^Validate$/ }).first().click();

    await expect(page.getByText(/\/100/).first()).toBeVisible({
      timeout: 30_000,
    });
    const bodyText = (await page.textContent("body")) ?? "";
    expect(bodyText.toLowerCase()).toContain("invalid");
  });

  test("validates a Norwegian phone number", async ({ page }) => {
    await page
      .getByPlaceholder(/Enter phone number/i)
      .fill("41234567");
    await page.getByRole("button", { name: /^Validate$/ }).nth(1).click();

    await expect(page.getByText(/\/100/).first()).toBeVisible({
      timeout: 30_000,
    });
    // Norwegian numbers are formatted with the +47 country code
    await expect(page.getByText(/\+47/).first()).toBeVisible();
  });
});
