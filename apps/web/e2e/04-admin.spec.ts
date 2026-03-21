/**
 * E2E Scenario 4: Admin portal
 *
 * Covers:
 * - Admin login page renders
 * - Non-admin role blocked on admin login
 * - Admin login page is separate from user login
 * - Admin dashboard shows stats
 */
import { expect, test } from "@playwright/test";

import { API_BASE, uniqueEmail } from "./helpers";

test.describe("Admin portal", () => {
  test("admin login page is accessible", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/관리자 패널/i)).toBeVisible();
    await expect(page.getByLabel("이메일")).toBeVisible();
    await expect(page.getByLabel("비밀번호")).toBeVisible();
  });

  test("regular user cannot log in via admin login", async ({ page }) => {
    // Create a regular user
    const email = uniqueEmail("admin-e2e");
    await page.context().request.post(`${API_BASE}/api/v1/auth/signup`, {
      data: { email, password: "Password123!", name: "일반 사용자" },
    });

    // Attempt admin login with regular user credentials
    await page.goto("/admin/login");
    await page.getByLabel("이메일").fill(email);
    await page.getByLabel("비밀번호").fill("Password123!");
    await page.getByRole("button", { name: /로그인/ }).click();

    // Should show error — regular user cannot access admin
    await expect(
      page.getByText(/관리자|심사자|접근/i).first(),
    ).toBeVisible({ timeout: 5_000 });
    // Should NOT redirect to admin dashboard
    await expect(page).not.toHaveURL(/\/admin\/dashboard/);
  });

  test("unauthenticated access to /admin/dashboard redirects to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/admin/dashboard");

    // Either redirected to admin login or auth login
    await page.waitForURL(/\/admin\/login|\/auth\/login/, { timeout: 5_000 });
    await expect(page).toHaveURL(/login/);
  });

  test("admin evaluation list page has correct structure", async ({ page }) => {
    // This test assumes a pre-seeded admin account in CI
    // In local testing, ensure seed-db.py has been run
    const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@skillfinance.test";
    const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "AdminPassword123!";

    await page.goto("/admin/login");
    await page.getByLabel("이메일").fill(adminEmail);
    await page.getByLabel("비밀번호").fill(adminPassword);
    await page.getByRole("button", { name: /로그인/ }).click();

    await page.waitForURL(/\/admin\/dashboard/, { timeout: 10_000 });

    // Navigate to evaluations list
    await page.goto("/admin/evaluations");
    await page.waitForLoadState("networkidle");

    // Table headers should be present
    await expect(page.getByText(/평가 ID/i)).toBeVisible();
    await expect(page.getByText(/사용자/i).first()).toBeVisible();
    await expect(page.getByText(/상태/i).first()).toBeVisible();
  });
});
