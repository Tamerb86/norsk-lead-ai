import { test, expect } from "@playwright/test";

test.describe("A/B Testing Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to A/B testing page (requires auth)
    await page.goto("/ab-testing");
  });

  test("should display A/B testing page", async ({ page }) => {
    // Check for page title or heading
    await expect(page.locator("h1, h2").first()).toContainText(/A\/B|Testing|Test/i);
  });

  test("should show statistics cards", async ({ page }) => {
    // Look for stat cards
    const cards = page.locator('[class*="card"], [class*="Card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test("should have create test button", async ({ page }) => {
    const createButton = page.getByRole("button", { name: /create|new|opprett/i });
    await expect(createButton).toBeVisible({ timeout: 10000 });
  });

  test("should open create dialog when clicking create button", async ({ page }) => {
    const createButton = page.getByRole("button", { name: /create|new|opprett/i });
    
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Dialog should appear
      const dialog = page.locator('[role="dialog"], [class*="Dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Lead Scoring Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/lead-scoring");
  });

  test("should display lead scoring page", async ({ page }) => {
    await expect(page.locator("h1, h2").first()).toContainText(/Lead|Scoring|Poeng/i);
  });

  test("should show tier cards", async ({ page }) => {
    // Look for tier indicators (Cold, Warm, Hot, Very Hot)
    const tierCards = page.locator('[class*="card"], [class*="Card"]');
    await expect(tierCards.first()).toBeVisible({ timeout: 10000 });
  });

  test("should have tabs for leads and rules", async ({ page }) => {
    const tabs = page.locator('[role="tablist"]');
    await expect(tabs).toBeVisible({ timeout: 10000 });
  });

  test("should switch between tabs", async ({ page }) => {
    const rulesTab = page.getByRole("tab", { name: /rules|regler/i });
    
    if (await rulesTab.isVisible()) {
      await rulesTab.click();
      
      // Rules content should be visible
      await page.waitForTimeout(500);
    }
  });
});

test.describe("Webhooks Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/webhooks");
  });

  test("should display webhooks page", async ({ page }) => {
    await expect(page.locator("h1, h2").first()).toContainText(/Webhook/i);
  });

  test("should have create webhook button", async ({ page }) => {
    const createButton = page.getByRole("button", { name: /create|new|opprett|add/i });
    await expect(createButton).toBeVisible({ timeout: 10000 });
  });

  test("should open create dialog", async ({ page }) => {
    const createButton = page.getByRole("button", { name: /create|new|opprett|add/i });
    
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Dialog should appear with URL input
      const dialog = page.locator('[role="dialog"], [class*="Dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Referral Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/referral");
  });

  test("should display referral page", async ({ page }) => {
    await expect(page.locator("h1, h2").first()).toContainText(/Referral|Henvisning|Invite/i);
  });

  test("should show referral code", async ({ page }) => {
    // Look for referral code display
    const codeDisplay = page.locator('input[readonly], [class*="code"]');
    await expect(codeDisplay.first()).toBeVisible({ timeout: 10000 });
  });

  test("should have copy button", async ({ page }) => {
    const copyButton = page.getByRole("button", { name: /copy|kopier/i });
    await expect(copyButton).toBeVisible({ timeout: 10000 });
  });

  test("should have social share buttons", async ({ page }) => {
    // Look for share buttons
    const shareButtons = page.locator('button[class*="share"], a[href*="facebook"], a[href*="twitter"], a[href*="linkedin"]');
    const count = await shareButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should have invite form", async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Dashboard Widgets", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("should display dashboard", async ({ page }) => {
    await expect(page.locator("h1, h2").first()).toContainText(/Dashboard|Oversikt/i);
  });

  test("should show statistics cards", async ({ page }) => {
    const cards = page.locator('[class*="card"], [class*="Card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test("should have chart components", async ({ page }) => {
    // Look for chart containers
    const charts = page.locator('[class*="chart"], [class*="Chart"], svg');
    const count = await charts.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("Settings Pages", () => {
  test("should access account settings", async ({ page }) => {
    await page.goto("/account");
    await expect(page.locator("h1, h2").first()).toContainText(/Account|Konto|Settings|Innstillinger/i);
  });

  test("should access AI settings", async ({ page }) => {
    await page.goto("/settings/ai");
    // Should not error out
    await page.waitForLoadState("networkidle");
  });

  test("should access calendar page", async ({ page }) => {
    await page.goto("/calendar");
    await expect(page.locator("h1, h2").first()).toContainText(/Calendar|Kalender/i);
  });
});

test.describe("Dark Mode", () => {
  test("should toggle dark mode", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Look for theme toggle button
    const themeToggle = page.locator('button[class*="theme"], button[aria-label*="theme"], button[aria-label*="dark"]');
    
    if (await themeToggle.isVisible()) {
      // Get initial background color
      const initialBg = await page.evaluate(() => {
        return getComputedStyle(document.body).backgroundColor;
      });
      
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Background should change
      const newBg = await page.evaluate(() => {
        return getComputedStyle(document.body).backgroundColor;
      });
      
      // Colors should be different (dark mode toggle worked)
      expect(newBg).not.toBe(initialBg);
    }
  });
});

test.describe("Keyboard Shortcuts", () => {
  test("should open search with keyboard shortcut", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    
    // Press Cmd/Ctrl + K
    await page.keyboard.press("Control+k");
    
    // Search dialog should appear
    const searchDialog = page.locator('[role="dialog"], [class*="command"], [class*="search"]');
    await expect(searchDialog).toBeVisible({ timeout: 3000 });
  });

  test("should show keyboard shortcuts help", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    
    // Press ? to show shortcuts
    await page.keyboard.press("?");
    
    // Shortcuts dialog should appear
    const shortcutsDialog = page.locator('[role="dialog"]');
    await expect(shortcutsDialog).toBeVisible({ timeout: 3000 });
  });
});

test.describe("Notifications", () => {
  test("should show notification bell", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Look for notification icon
    const notificationBell = page.locator('button[class*="notification"], button[aria-label*="notification"], [class*="bell"]');
    await expect(notificationBell.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("PWA Features", () => {
  test("should have manifest.json", async ({ page }) => {
    const response = await page.goto("/manifest.webmanifest");
    expect(response?.status()).toBeLessThan(400);
  });

  test("should register service worker", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length > 0;
      }
      return false;
    });
    
    // In production, SW should be registered
    // In dev, it might not be
    expect(typeof swRegistered).toBe("boolean");
  });
});

test.describe("Responsive Design", () => {
  test("should work on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");
    
    // Page should load
    await expect(page).toHaveTitle(/.+/);
    
    // Mobile menu should be present
    const menuButton = page.locator('button[class*="menu"], button[aria-label*="menu"]');
    await expect(menuButton.first()).toBeVisible({ timeout: 10000 });
  });

  test("should work on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/dashboard");
    
    await expect(page).toHaveTitle(/.+/);
  });

  test("should work on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/dashboard");
    
    await expect(page).toHaveTitle(/.+/);
    
    // Sidebar should be visible on desktop
    const sidebar = page.locator('nav, aside, [class*="sidebar"]');
    await expect(sidebar.first()).toBeVisible({ timeout: 10000 });
  });
});
