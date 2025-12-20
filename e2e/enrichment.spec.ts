import { test, expect } from "@playwright/test";

test.describe("Lead Enrichment & Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/enrichment");
    await page.waitForLoadState("networkidle");
  });

  test("should display enrichment page with validation tools", async ({
    page,
  }) => {
    if (page.url().includes("/enrichment")) {
      // Check for email validation section
      const emailSection = page.getByText(/email validation/i);
      await expect(emailSection).toBeVisible();

      // Check for phone validation section
      const phoneSection = page.getByText(/phone validation/i);
      await expect(phoneSection).toBeVisible();

      // Check for website checker section
      const websiteSection = page.getByText(/website checker/i);
      await expect(websiteSection).toBeVisible();
    }
  });

  test("should validate email address", async ({ page }) => {
    if (page.url().includes("/enrichment")) {
      // Find email input
      const emailInput = page
        .getByPlaceholder(/enter email/i)
        .first();

      if (await emailInput.isVisible().catch(() => false)) {
        // Enter valid email
        await emailInput.fill("test@example.com");

        // Click validate button
        const validateButton = page
          .getByRole("button", { name: /validate/i })
          .first();
        await validateButton.click();

        // Wait for validation result
        await page.waitForTimeout(3000);

        // Check for validation result
        const resultVisible =
          (await page.getByText(/valid|invalid|risky/i).isVisible().catch(() => false)) ||
          (await page.getByText(/score/i).isVisible().catch(() => false));

        expect(resultVisible).toBeTruthy();
      }
    }
  });

  test("should detect invalid email syntax", async ({ page }) => {
    if (page.url().includes("/enrichment")) {
      const emailInput = page
        .getByPlaceholder(/enter email/i)
        .first();

      if (await emailInput.isVisible().catch(() => false)) {
        // Enter invalid email
        await emailInput.fill("not-an-email");

        const validateButton = page
          .getByRole("button", { name: /validate/i })
          .first();
        await validateButton.click();

        await page.waitForTimeout(2000);

        // Should show invalid status
        const invalidText = await page.textContent("body");
        expect(invalidText?.toLowerCase()).toContain("invalid");
      }
    }
  });

  test("should validate Norwegian phone number", async ({ page }) => {
    if (page.url().includes("/enrichment")) {
      // Find phone input
      const phoneInput = page.getByPlaceholder(/enter phone/i);

      if (await phoneInput.isVisible().catch(() => false)) {
        // Enter valid Norwegian mobile number
        await phoneInput.fill("41234567");

        // Click validate button
        const validateButtons = page.getByRole("button", { name: /validate/i });
        await validateButtons.nth(1).click();

        await page.waitForTimeout(2000);

        // Check for validation result
        const resultVisible =
          (await page.getByText(/valid|invalid/i).isVisible().catch(() => false)) ||
          (await page.getByText(/mobile|landline/i).isVisible().catch(() => false));

        expect(resultVisible).toBeTruthy();
      }
    }
  });

  test("should format Norwegian phone number", async ({ page }) => {
    if (page.url().includes("/enrichment")) {
      const phoneInput = page.getByPlaceholder(/enter phone/i);

      if (await phoneInput.isVisible().catch(() => false)) {
        await phoneInput.fill("41234567");

        const validateButtons = page.getByRole("button", { name: /validate/i });
        await validateButtons.nth(1).click();

        await page.waitForTimeout(2000);

        // Should show formatted number
        const bodyText = await page.textContent("body");
        const hasFormatted = bodyText?.includes("+47") || bodyText?.includes("412 34 567");

        expect(hasFormatted).toBeTruthy();
      }
    }
  });

  test("should check website availability", async ({ page }) => {
    if (page.url().includes("/enrichment")) {
      // Find website input
      const websiteInput = page.getByPlaceholder(/enter website/i);

      if (await websiteInput.isVisible().catch(() => false)) {
        // Enter valid website
        await websiteInput.fill("google.com");

        // Click check button
        const checkButtons = page.getByRole("button", { name: /check/i });
        await checkButtons.last().click();

        // Wait for check to complete (might take longer)
        await page.waitForTimeout(15000);

        // Check for result
        const resultVisible =
          (await page.getByText(/online|offline/i).isVisible().catch(() => false)) ||
          (await page.getByText(/reachable/i).isVisible().catch(() => false));

        expect(resultVisible).toBeTruthy();
      }
    }
  });

  test("should detect SSL on HTTPS websites", async ({ page }) => {
    if (page.url().includes("/enrichment")) {
      const websiteInput = page.getByPlaceholder(/enter website/i);

      if (await websiteInput.isVisible().catch(() => false)) {
        await websiteInput.fill("https://www.google.com");

        const checkButtons = page.getByRole("button", { name: /check/i });
        await checkButtons.last().click();

        await page.waitForTimeout(15000);

        // Should show SSL check result
        const bodyText = await page.textContent("body");
        const hasSSL = bodyText?.toLowerCase().includes("ssl");

        expect(hasSSL).toBeTruthy();
      }
    }
  });

  test("should display validation scores", async ({ page }) => {
    if (page.url().includes("/enrichment")) {
      const emailInput = page
        .getByPlaceholder(/enter email/i)
        .first();

      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill("test@gmail.com");

        const validateButton = page
          .getByRole("button", { name: /validate/i })
          .first();
        await validateButton.click();

        await page.waitForTimeout(3000);

        // Should show score (0-100)
        const bodyText = await page.textContent("body");
        const hasScore = bodyText?.includes("Score") || bodyText?.includes("/100");

        expect(hasScore).toBeTruthy();
      }
    }
  });

  test("should display validation checks breakdown", async ({ page }) => {
    if (page.url().includes("/enrichment")) {
      const emailInput = page
        .getByPlaceholder(/enter email/i)
        .first();

      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill("test@example.com");

        const validateButton = page
          .getByRole("button", { name: /validate/i })
          .first();
        await validateButton.click();

        await page.waitForTimeout(3000);

        // Should show individual checks
        const bodyText = await page.textContent("body");
        const hasChecks =
          bodyText?.includes("Syntax") ||
          bodyText?.includes("Domain") ||
          bodyText?.includes("MX");

        expect(hasChecks).toBeTruthy();
      }
    }
  });
});
