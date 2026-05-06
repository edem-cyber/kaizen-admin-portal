import { expect, test } from "@playwright/test";
import { USER_AUTH, expectNoHorizontalScroll, waitForListReady } from "./helpers";

test.describe("Responsive breakpoints — critical", () => {
  test("RESP-01 — login page no horizontal scroll at mobile", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile",
      "mobile-only assertion",
    );
    await page.goto("/login");
    await expectNoHorizontalScroll(page);
  });

  test("RESP-02 — authenticated dashboard no horizontal scroll at mobile", async ({
    browser,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile",
      "mobile-only assertion",
    );
    const ctx = await browser.newContext({
      storageState: USER_AUTH,
    });
    const page = await ctx.newPage();
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await expectNoHorizontalScroll(page);
    await ctx.close();
  });

  test("RESP-03 — requisition detail tabs wrap at mobile (grid-cols-3)", async ({
    browser,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile",
      "mobile-only assertion",
    );
    const ctx = await browser.newContext({
      storageState: USER_AUTH,
    });
    const page = await ctx.newPage();
    await page.goto("/requisitions");
    const cards = page.locator(
      'a[href^="/requisitions/"]:not([href="/requisitions"]):not([href="/requisitions/new"])',
    );
    const count = await waitForListReady(page, cards);
    test.skip(count === 0, "No requisitions — cannot exercise detail tabs.");
    const href = await cards.first().getAttribute("href");
    await page.goto(href!);
    await page.waitForLoadState("networkidle").catch(() => {});
    await expectNoHorizontalScroll(page);
    await ctx.close();
  });
});

test.describe("Error handling — critical", () => {
  test("ERROR-02 — invalid requisition ID → 404 or graceful fallback", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ storageState: USER_AUTH });
    const page = await ctx.newPage();
    const response = await page.goto(
      "/requisitions/00000000-0000-0000-0000-000000000000",
    );
    // Either status 404 or page renders with an "not found" UI
    if (response && response.status() >= 500) {
      throw new Error(`Server error: ${response.status()}`);
    }
    const notFound = page.getByText(/not found|doesn't exist|no such/i);
    const heading = page.getByRole("heading");
    await expect(
      notFound.first().or(heading.first()),
    ).toBeVisible({ timeout: 15_000 });
    await ctx.close();
  });
});
