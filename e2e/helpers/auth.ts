import type { APIRequestContext, Page } from "@playwright/test";

/**
 * E2E auth helpers for the current email/password auth system.
 *
 * The app issues httpOnly cookies (app_session_id + app_refresh_token) from
 * POST /api/auth/register and POST /api/auth/login. Playwright's
 * `page.request` shares its cookie jar with the page's browser context, so
 * registering through it logs the browser in directly — no UI round-trip
 * needed.
 */

export const TEST_PASSWORD = "E2eTestPassord123!";

let counter = 0;

/** Unique email per call so parallel tests/runs never collide. */
export function uniqueEmail(prefix = "e2e"): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${counter}@example.com`;
}

export interface TestAccount {
  email: string;
  password: string;
  name: string;
}

/**
 * Create a brand-new account via the API using an arbitrary request context.
 * Does NOT log the browser in unless the context shares cookies with it.
 */
export async function registerViaApi(
  request: APIRequestContext,
  overrides: Partial<TestAccount> = {},
): Promise<TestAccount> {
  const account: TestAccount = {
    email: overrides.email ?? uniqueEmail(),
    password: overrides.password ?? TEST_PASSWORD,
    name: overrides.name ?? "E2E Testbruker",
  };

  const response = await request.post("/api/auth/register", {
    data: {
      email: account.email,
      password: account.password,
      name: account.name,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `E2E account registration failed: ${response.status()} ${await response.text()}`,
    );
  }

  return account;
}

/**
 * Mark the onboarding wizard as completed before any page script runs, so
 * its dialog overlay never blocks pointer events in tests.
 */
export async function disableOnboarding(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("onboarding_completed", "true");
    localStorage.setItem("onboarding_skipped", "true");
  });
}

/**
 * Register a fresh account and leave the page's browser context
 * authenticated (session cookies are set by the register response).
 * Also disables the first-run onboarding wizard.
 */
export async function loginAsNewUser(
  page: Page,
  overrides: Partial<TestAccount> = {},
): Promise<TestAccount> {
  await disableOnboarding(page);
  // page.request shares cookie storage with the browser context.
  return registerViaApi(page.request, overrides);
}
