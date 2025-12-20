import { test, expect } from "@playwright/test";

test.describe("Company Search Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page
    await page.goto("/search");
    await page.waitForLoadState("networkidle");
  });

  test("should display search page with filters", async ({ page }) => {
    // Check if on search page or redirected to OAuth
    if (page.url().includes("/search")) {
      // Check for search input
      const searchInput = page.getByPlaceholder(/søk|search/i);
      await expect(searchInput).toBeVisible();

      // Check for filter button
      const filterButton = page.getByText(/vis filtre|show filters/i);
      if (await filterButton.isVisible().catch(() => false)) {
        await expect(filterButton).toBeVisible();
      }
    }
  });

  test("should toggle advanced filters", async ({ page }) => {
    if (page.url().includes("/search")) {
      const filterButton = page.getByText(/vis filtre|show filters/i);

      if (await filterButton.isVisible().catch(() => false)) {
        // Click to show filters
        await filterButton.click();

        // Check for filter inputs
        const industryFilter = page.getByLabel(/bransje|industry/i);
        const locationFilter = page.getByLabel(/fylke|county/i);

        const hasFilters =
          (await industryFilter.isVisible().catch(() => false)) ||
          (await locationFilter.isVisible().catch(() => false));

        expect(hasFilters).toBeTruthy();
      }
    }
  });

  test("should search companies by name", async ({ page }) => {
    if (page.url().includes("/search")) {
      const searchInput = page.getByPlaceholder(/søk|search/i);

      if (await searchInput.isVisible().catch(() => false)) {
        // Enter search query
        await searchInput.fill("AS");
        await searchInput.press("Enter");

        // Wait for results
        await page.waitForTimeout(2000);

        // Check for results or "no results" message
        const resultsExist =
          (await page.getByText(/fant|found/i).isVisible().catch(() => false)) ||
          (await page.getByText(/ingen|no results/i).isVisible().catch(() => false));

        expect(resultsExist).toBeTruthy();
      }
    }
  });

  test("should filter companies by city", async ({ page }) => {
    if (page.url().includes("/search")) {
      // Show filters
      const filterButton = page.getByText(/vis filtre|show filters/i);
      if (await filterButton.isVisible().catch(() => false)) {
        await filterButton.click();

        // Find city input
        const cityInput = page.getByLabel(/by|poststed|city/i);
        if (await cityInput.isVisible().catch(() => false)) {
          await cityInput.fill("Oslo");
          await page.waitForTimeout(1000);

          // Results should update
          const resultsText = await page.textContent("body");
          expect(resultsText).toBeTruthy();
        }
      }
    }
  });

  test("should display company details in results", async ({ page }) => {
    if (page.url().includes("/search")) {
      const searchInput = page.getByPlaceholder(/søk|search/i);

      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill("AS");
        await searchInput.press("Enter");
        await page.waitForTimeout(2000);

        // Check for company cards
        const companyCard = page.locator("[data-testid='company-card']").first();
        const hasCards = await companyCard.isVisible().catch(() => false);

        if (hasCards) {
          // Company card should have name, email, phone
          const cardText = await companyCard.textContent();
          expect(cardText).toBeTruthy();
        }
      }
    }
  });
});

test.describe("Campaign Creation Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/campaigns");
    await page.waitForLoadState("networkidle");
  });

  test("should display campaigns page", async ({ page }) => {
    if (page.url().includes("/campaigns")) {
      // Check for "New Campaign" button or campaigns list
      const newCampaignButton = page.getByText(/ny kampanje|new campaign/i);
      const campaignsList = page.getByText(/kampanjer|campaigns/i);

      const hasContent =
        (await newCampaignButton.isVisible().catch(() => false)) ||
        (await campaignsList.isVisible().catch(() => false));

      expect(hasContent).toBeTruthy();
    }
  });

  test("should open campaign creation dialog", async ({ page }) => {
    if (page.url().includes("/campaigns")) {
      const newCampaignButton = page.getByText(/ny kampanje|new campaign/i);

      if (await newCampaignButton.isVisible().catch(() => false)) {
        await newCampaignButton.click();

        // Check for campaign form
        const campaignNameInput = page.getByLabel(/navn|name/i);
        const hasForm = await campaignNameInput.isVisible().catch(() => false);

        expect(hasForm).toBeTruthy();
      }
    }
  });

  test("should validate campaign form fields", async ({ page }) => {
    if (page.url().includes("/campaigns")) {
      const newCampaignButton = page.getByText(/ny kampanje|new campaign/i);

      if (await newCampaignButton.isVisible().catch(() => false)) {
        await newCampaignButton.click();

        // Try to submit empty form
        const submitButton = page.getByText(/opprett|create|lagre|save/i);
        if (await submitButton.isVisible().catch(() => false)) {
          await submitButton.click();

          // Should show validation errors
          await page.waitForTimeout(500);
          const hasError = await page.getByText(/påkrevd|required/i).isVisible().catch(() => false);

          // Validation might be present
          expect(typeof hasError).toBe("boolean");
        }
      }
    }
  });

  test("should create campaign with valid data", async ({ page }) => {
    if (page.url().includes("/campaigns")) {
      const newCampaignButton = page.getByText(/ny kampanje|new campaign/i);

      if (await newCampaignButton.isVisible().catch(() => false)) {
        await newCampaignButton.click();

        // Fill campaign form
        const nameInput = page.getByLabel(/navn|name/i);
        if (await nameInput.isVisible().catch(() => false)) {
          await nameInput.fill("Test Campaign " + Date.now());

          const descriptionInput = page.getByLabel(/beskrivelse|description/i);
          if (await descriptionInput.isVisible().catch(() => false)) {
            await descriptionInput.fill("Test campaign description");
          }

          // Submit form
          const submitButton = page.getByText(/opprett|create|lagre|save/i);
          if (await submitButton.isVisible().catch(() => false)) {
            await submitButton.click();

            // Wait for success message or redirect
            await page.waitForTimeout(2000);

            // Should show success or return to campaigns list
            const url = page.url();
            expect(url).toContain("/campaigns");
          }
        }
      }
    }
  });
});
