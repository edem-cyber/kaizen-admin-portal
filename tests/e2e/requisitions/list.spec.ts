import { expect, test } from "@playwright/test";
import { USER_AUTH, expectHeading, waitForListReady } from "../helpers";

test.use({ storageState: USER_AUTH });

test.describe("Kaizen Admins list — critical", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/requisitions");
  });

  test("REQLIST-03 — 'New Kaizen Admin' button navigates to /requisitions/new", async ({
    page,
  }) => {
    await expectHeading(page, /requisitions|my requisitions/i);
    const newBtn = page.getByRole("link", { name: /new requisition|create/i }).first();
    await expect(newBtn).toBeVisible();
    await newBtn.click();
    await expect(page).toHaveURL(/\/requisitions\/new/);
  });

  test("REQLIST-08 — clicking a card (if any) navigates to detail", async ({
    page,
  }) => {
    await expectHeading(page, /requisitions|my requisitions/i);
    const cards = page.locator(
      'a[href^="/requisitions/"]:not([href="/requisitions"]):not([href="/requisitions/new"])',
    );
    const count = await waitForListReady(page, cards);
    test.skip(count === 0, "No requisitions returned by API — cannot click a card.");
    const href = await cards.first().getAttribute("href");
    expect(href).toMatch(/^\/requisitions\/[^/]+$/);
    await page.goto(href!);
    await expect(page).toHaveURL(/\/requisitions\/[^/]+$/);
  });
});
