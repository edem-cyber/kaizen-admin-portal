import { chromium, FullConfig } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const AUTH_DIR = path.resolve(__dirname, ".auth");

async function loginAndSaveState(
  baseURL: string,
  username: string,
  password: string,
  file: string,
  isAdmin: boolean,
) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ baseURL });
  const page = await ctx.newPage();

  await page.goto("/login");

  // Step 1: username → Next
  await page.locator("#username").fill(username);
  await page.getByRole("button", { name: /^next/i }).click();

  // Step 2: password → Sign in
  await page.locator("#password").waitFor({ state: "visible" });
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Platform admin lands on /admin, everyone else on /admin
  const expected = isAdmin ? /\/admin(\/|$)/ : /\/(dashboard|admin)(\/|$)/;
  await page.waitForURL(expected, { timeout: 20_000 });

  await ctx.storageState({ path: file });
  await browser.close();
}

export default async function globalSetup(config: FullConfig) {
  const baseURL =
    config.projects[0].use.baseURL ??
    process.env.PLAYWRIGHT_BASE_URL ??
    "http://localhost:3000";

  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const user = process.env.E2E_USERNAME;
  const userPw = process.env.E2E_PASSWORD;
  const admin = process.env.E2E_ADMIN_USERNAME;
  const adminPw = process.env.E2E_ADMIN_PASSWORD;

  if (!user || !userPw) {
    throw new Error(
      "E2E_USERNAME / E2E_PASSWORD missing. Copy .env.test.example to .env.test and fill in values.",
    );
  }

  await loginAndSaveState(
    baseURL,
    user,
    userPw,
    path.join(AUTH_DIR, "user.json"),
    false,
  );

  if (admin && adminPw) {
    await loginAndSaveState(
      baseURL,
      admin,
      adminPw,
      path.join(AUTH_DIR, "admin.json"),
      true,
    );
  }
}
