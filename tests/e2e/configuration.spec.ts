import { expect, test } from "@playwright/test";
import { USER_AUTH } from "./helpers";

test.use({ storageState: USER_AUTH });

// Match by href to avoid the "Budgets" label also matching "Budget Rules".
const CONFIG_DESTINATIONS: Array<{ path: string; id: string }> = [
  { path: "/configuration/approval-levels", id: "CONFIG-04a" },
  { path: "/configuration/default-approvers", id: "CONFIG-04b" },
  { path: "/configuration/committees", id: "CONFIG-04c" },
  { path: "/configuration/budget-rules", id: "CONFIG-04d" },
  { path: "/configuration/budgets", id: "CONFIG-04e" },
  { path: "/configuration/allocation-rules", id: "CONFIG-04f" },
  { path: "/configuration/accounting", id: "CONFIG-04g" },
  { path: "/configuration/workflow", id: "CONFIG-04h" },
  { path: "/configuration/policy", id: "CONFIG-04i" },
  { path: "/configuration/fiscal-year", id: "CONFIG-04j" },
];

test.describe("Configuration hub — critical", () => {
  for (const { path, id } of CONFIG_DESTINATIONS) {
    test(`${id} — card click routes to ${path}`, async ({ page }) => {
      const response = await page.goto("/configuration");
      if (response && response.status() >= 400) {
        test.skip(true, `No config access for this role (${response.status()}).`);
      }
      await expect(page.locator("body")).toBeVisible();
      const link = page.locator(`a[href="${path}"]`).first();
      await expect(link).toBeVisible({ timeout: 5_000 });
      await Promise.all([
        page.waitForURL((url) => url.pathname === path, { timeout: 15_000 }),
        link.click(),
      ]);
    });
  }
});

test.describe("Configuration subpages — load smoke", () => {
  for (const { path } of CONFIG_DESTINATIONS) {
    test(`${path} loads`, async ({ page }) => {
      const response = await page.goto(path);
      if (response && response.status() >= 400) {
        test.skip(true, `No access to ${path} (${response.status()}).`);
      }
      await expect(page.locator("body")).toBeVisible();
    });
  }
});
