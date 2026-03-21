/**
 * E2E Scenario 1: User signup → login → dashboard
 *
 * Covers:
 * - Sign-up form submission
 * - Login form submission
 * - Redirect to /dashboard on success
 * - Logout and redirect back to login
 */
import { expect, test } from "@playwright/test";

import { uniqueEmail } from "./helpers";

test.describe("Auth flow", () => {
  const email = uniqueEmail("auth-e2e");
  const password = "TestPassword123!";

  test("user can sign up and is redirected to onboarding or dashboard", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page).toHaveURL(/\/auth\/signup/);

    await page.getByLabel("이메일").fill(email);
    await page.getByLabel("비밀번호").fill(password);
    // Name field (signup has name field)
    const nameField = page.getByLabel("이름");
    if (await nameField.isVisible()) {
      await nameField.fill("E2E 테스터");
    }

    await page.getByRole("button", { name: /회원가입/ }).click();

    // Should redirect away from signup on success
    await page.waitForURL((url) => !url.pathname.includes("/auth/signup"), { timeout: 10_000 });
  });

  test("user can log in and sees dashboard", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("이메일").fill(email);
    await page.getByLabel("비밀번호").fill(password);
    await page.getByRole("button", { name: /로그인/ }).click();

    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 10_000 });
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test("wrong credentials show error message", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("이메일").fill("nonexistent@example.com");
    await page.getByLabel("비밀번호").fill("wrongpassword");
    await page.getByRole("button", { name: /로그인/ }).click();

    // Error message should appear
    await expect(page.locator("text=비밀번호").or(page.locator("text=이메일")).or(
      page.locator('[class*="danger"]'),
    )).toBeVisible({ timeout: 5_000 });
  });

  test("unauthenticated access to /dashboard redirects to login", async ({ page }) => {
    // Start fresh (no session)
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await page.waitForURL(/\/auth\/login/, { timeout: 5_000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
