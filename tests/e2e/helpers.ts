import { expect, Locator, Page, test } from "@playwright/test";

export const USER_AUTH = "tests/.auth/user.json";
export const ADMIN_AUTH = "tests/.auth/admin.json";

/**
 * Wait for a list-style page to settle. A list is considered "ready" once
 * either (a) at least one matching row/card is visible, or (b) the network
 * is idle (meaning the fetch completed, rendering an empty state).
 *
 * Returns the final count of matches.
 */
export async function waitForListReady(
  page: Page,
  locator: Locator,
  opts: { timeout?: number } = {},
): Promise<number> {
  const timeout = opts.timeout ?? 15_000;
  await page.waitForLoadState("networkidle", { timeout }).catch(() => {});
  // Give React Query one more microtask to render after the fetch resolves
  await page.waitForTimeout(250);
  return await locator.count();
}

/**
 * Wait for a page's primary heading to be visible. Useful as a "page loaded"
 * smoke assertion.
 */
export async function expectHeading(page: Page, text: string | RegExp) {
  await expect(
    page.getByRole("heading", { name: text }).first(),
  ).toBeVisible({ timeout: 15_000 });
}

/**
 * Skip a test when the target list or row we expect isn't present in the
 * current environment. Prefer this over failing — the test is validating
 * behavior that requires seeded state.
 */
export function skipWhenMissing(
  condition: boolean,
  what: string,
): asserts condition {
  test.skip(!condition, `Skipping — no ${what} available in this environment.`);
}

/**
 * Assert no horizontal overflow (for mobile-viewport responsiveness tests).
 * Uses body.scrollWidth (vs document.documentElement) and allows a small
 * tolerance for sub-pixel rounding and off-screen toast/tooltip portals.
 */
export async function expectNoHorizontalScroll(page: Page, tolerance = 2) {
  const widths = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + tolerance);
}
