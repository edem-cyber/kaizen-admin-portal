import { expect, test } from "@playwright/test";

// Smoke tests for the login page. Run unauthenticated and rely only on
// the page rendering — no live backend needed.

test.describe("Login — smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("LOGIN-smoke-01 — page renders with username input and Next button", async ({
    page,
  }) => {
    const username = page.locator("#username");
    const next = page.getByRole("button", { name: /^next|checking/i });

    await expect(username).toBeVisible();
    await expect(username).toHaveAttribute("placeholder", /username|email/i);
    await expect(next).toBeVisible();
  });

  test("LOGIN-smoke-02 — empty username triggers validation error on Next", async ({
    page,
  }) => {
    const username = page.locator("#username");
    const next = page.getByRole("button", { name: /^next/i });

    await username.fill("");
    await next.click();

    // loginSchema: username.min(1, "Username or email is required")
    await expect(
      page.getByText(/username.*required/i),
    ).toBeVisible();
  });

  test("LOGIN-smoke-03 — Sign up link navigates to /signup", async ({
    page,
  }) => {
    await page.getByRole("link", { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("LOGIN-smoke-04 — no horizontal scroll at mobile viewport", async ({
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
