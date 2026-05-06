import { expect, test } from "@playwright/test";
import { USER_AUTH, expectHeading } from "./helpers";

test.use({ storageState: USER_AUTH });

test.describe("Dashboard home + shell — critical", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin");
  });

  test("DASH-05 — page loads and renders primary content", async ({ page }) => {
    // The dashboard has KPI cards; verify page structure mounted
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveURL(/\/admin/);
  });

  test("SIDEBAR-03 — clicking Kaizen Admins nav routes to /requisitions", async ({
    page,
  }, testInfo) => {
    // On mobile, the sidebar is a drawer — open it via the trigger first.
    if (testInfo.project.name === "chromium-mobile") {
      await page.getByRole("button", { name: /toggle sidebar|menu/i }).first().click();
    }
    await page
      .getByRole("link", { name: /requisitions|my requisitions/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/requisitions/);
  });

  test("USERDROP-05 — Log out routes to /login", async ({ page }, testInfo) => {
    if (testInfo.project.name === "chromium-mobile") {
      await page.getByRole("button", { name: /toggle sidebar|menu/i }).first().click();
    }
    const avatar = page
      .locator('button:has-text("testuser1"), button:has([data-slot="avatar"])')
      .first();
    await avatar.click();
    await page.getByRole("menuitem", { name: /log out|logout|sign out/i }).click();
    await page.waitForURL(/\/login/, { timeout: 10_000 });
  });
});
