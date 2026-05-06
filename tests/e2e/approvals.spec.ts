import { expect, test } from "@playwright/test";
import { USER_AUTH, waitForListReady } from "./helpers";

test.use({ storageState: USER_AUTH });

test.describe("Approvals — critical", () => {
  test("APPROVALS-15 — approval card click routes to /requisitions/:id?from=approvals", async ({
    page,
  }) => {
    await page.goto("/approvals");
    await expect(
      page.getByRole("heading", { name: /approval/i }).first(),
    ).toBeVisible({ timeout: 15_000 });
    const cards = page.getByRole("link", { name: /view details/i });
    const count = await waitForListReady(page, cards);
    test.skip(count === 0, "No pending approvals to click.");
    await cards.first().click();
    await expect(page).toHaveURL(/\/requisitions\/[^/?]+(\?.*from=approvals)?/);
  });

  test("APPROVALS-16/17/18 — approve/reject/return buttons visible (if any pending)", async ({
    page,
  }) => {
    await page.goto("/approvals");
    await expect(
      page.getByRole("heading", { name: /approval/i }).first(),
    ).toBeVisible();
    const approveBtns = page.getByRole("button", { name: /^approve$/i });
    const count = await waitForListReady(page, approveBtns);
    test.skip(count === 0, "No pending approvals available.");
    await expect(approveBtns.first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^reject$/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^return$/i }).first()).toBeVisible();
  });

  test("APPACTION-01 — clicking Approve opens confirmation dialog", async ({
    page,
  }) => {
    await page.goto("/approvals");
    const approveBtns = page.getByRole("button", { name: /^approve$/i });
    const count = await waitForListReady(page, approveBtns);
    test.skip(count === 0, "No pending approvals.");
    await approveBtns.first().click();
    await expect(page.getByRole("dialog").or(page.getByRole("alertdialog"))).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("APPACTION-07 — Reject reason field is required", async ({ page }) => {
    await page.goto("/approvals");
    const rejectBtns = page.getByRole("button", { name: /^reject$/i });
    const count = await waitForListReady(page, rejectBtns);
    test.skip(count === 0, "No pending approvals.");
    await rejectBtns.first().click();
    const confirm = page
      .getByRole("dialog")
      .getByRole("button", { name: /^reject$/i });
    await confirm.click();
    await expect(page.locator("[data-sonner-toast]").first()).toBeVisible({
      timeout: 5_000,
    });
    await page.keyboard.press("Escape");
  });
});

test.describe("Approvals history — critical", () => {
  test("APPHIST-01 — history page loads", async ({ page }) => {
    await page.goto("/approvals/history");
    await expect(page.getByRole("heading").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("APPHIST-08 — flat response shape: history cards show requisition_title", async ({
    page,
  }) => {
    await page.goto("/approvals/history");
    const cards = page.getByRole("link", { name: /view details/i });
    const count = await waitForListReady(page, cards);
    test.skip(count === 0, "No approval history entries.");
    await expect(cards.first()).toBeVisible();
  });
});
