import { expect, test } from "@playwright/test";
import { USER_AUTH } from "./helpers";

test.use({ storageState: USER_AUTH });

test.describe("Users list — critical", () => {
  test("USERS-01 — list loads or access is gated", async ({ page }) => {
    const response = await page.goto("/users");
    // Either the page loads (permission-granted) or redirects (forbidden)
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Budget tracking — critical", () => {
  test("BUDGET-01 — budget page loads", async ({ page }) => {
    await page.goto("/budget");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveURL(/\/budget/);
  });
});

test.describe("Notifications — critical", () => {
  test("NOTIF-01 — notifications page loads", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.locator("body")).toBeVisible();
  });
});
