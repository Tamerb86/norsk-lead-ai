import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("should load landing page successfully", async ({ page }) => {
    await page.goto("/");
    
    // Page should load without errors
    await expect(page).toHaveTitle(/AI Lead Generator|Lead|CRM/i);
    
    // Page should have content
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test("should have working navigation", async ({ page }) => {
    await page.goto("/");
    
    // Check for navigation links
    const links = page.locator("a");
    const linkCount = await links.count();
    
    expect(linkCount).toBeGreaterThan(0);
  });

  test("should load static assets", async ({ page }) => {
    const responses: string[] = [];
    
    page.on("response", (response) => {
      responses.push(response.url());
    });
    
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Should have loaded some assets
    expect(responses.length).toBeGreaterThan(0);
  });

  test("should not have console errors on landing page", async ({ page }) => {
    const errors: string[] = [];
    
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes("CORS") &&
        !error.includes("favicon") &&
        !error.includes("DevTools")
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test("should be responsive", async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page).toHaveTitle(/AI Lead Generator|Lead|CRM/i);
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await expect(page).toHaveTitle(/AI Lead Generator|Lead|CRM/i);
  });
});
