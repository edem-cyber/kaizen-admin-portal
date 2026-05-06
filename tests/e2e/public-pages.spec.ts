import { expect, test } from "@playwright/test";

// Public pages — no auth required.

test.describe("Public pages — critical", () => {
  test("CONTACT-04 — contact form submit button exists", async ({ page }) => {
    await page.goto("/contact");
    const submit = page.getByRole("button", { name: /send|submit|contact/i });
    await expect(submit.first()).toBeVisible({ timeout: 15_000 });
  });
});
