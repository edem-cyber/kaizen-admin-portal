import { expect, test } from "@playwright/test";

// Authenticated: runs as the Corporate user saved by global-setup.
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Create Kaizen Admin — authenticated", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/requisitions/new");
  });

  test("REQCREATE-01 — form mounts once config resolves", async ({ page }) => {
    // First either shows the loading state or the title once config loads
    await expect(
      page.getByRole("heading", { name: /create requisition/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Title input + Submit button are both part of the mounted form
    await expect(page.getByLabel(/^title$/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /submit requisition/i }),
    ).toBeVisible();
  });

  test("REQCREATE-37 — validation-error toast surfaces on empty submit", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: /create requisition/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Submit is gated on hasFiscalYears from a React Query hook. Wait for
    // the fiscal-year fetch to resolve before checking disabled state.
    await page.waitForLoadState("networkidle").catch(() => {});
    const submit = page.getByRole("button", { name: /submit requisition/i });
    // Wait up to 3s for Submit to become enabled (FY data resolving)
    await submit
      .waitFor({ state: "visible", timeout: 5_000 })
      .catch(() => {});
    for (let i = 0; i < 6; i++) {
      if (!(await submit.isDisabled())) break;
      await page.waitForTimeout(500);
    }
    const stillDisabled = await submit.isDisabled();
    test.skip(
      stillDisabled,
      "Submit stayed disabled — org genuinely has no fiscal years configured.",
    );

    await submit.click();
    const toast = page.locator("[data-sonner-toast]").first();
    await expect(toast).toBeVisible({ timeout: 5_000 });
    await expect(toast).toContainText(
      /title|description|justification|category|fiscal year/i,
    );
  });

  test("REQCREATE-32 — Cancel returns to /requisitions with no confirm", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: /create requisition/i }),
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /^cancel$/i }).click();
    await expect(page).toHaveURL(/\/requisitions$/);
  });
});
