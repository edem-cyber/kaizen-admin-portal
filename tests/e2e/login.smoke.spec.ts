import { expect, test } from "@playwright/test";

// Smoke tests for the login page. Run unauthenticated and rely only on
// the page rendering — no live backend needed.

test.describe("Login — smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("LOGIN-smoke-01 — page renders with username and password inputs and Sign in button", async ({
    page,
  }) => {
    const username = page.locator("#username");
    const password = page.locator("#password");
    const signIn = page.getByRole("button", { name: /sign in/i });

    await expect(username).toBeVisible();
    await expect(username).toHaveAttribute("placeholder", /username|email/i);
    await expect(password).toBeVisible();
    await expect(password).toHaveAttribute("placeholder", /password/i);
    await expect(signIn).toBeVisible();
  });

  test("LOGIN-smoke-02 — empty username triggers validation error", async ({
    page,
  }) => {
    const signIn = page.getByRole("button", { name: /sign in/i });

    await signIn.click();

    await expect(
      page.getByText(/username.*required/i),
    ).toBeVisible();
  });

  test("LOGIN-smoke-03 — no horizontal scroll at mobile viewport", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile",
      "mobile-only assertion",
    );

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    const viewportWidth = page.viewportSize()?.width ?? 0;
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
  });
});
