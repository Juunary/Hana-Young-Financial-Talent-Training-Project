/**
 * E2E Scenario 3: Evaluation flow
 *
 * Covers:
 * - Evaluation start page loads with factor info
 * - Submitting evaluation request redirects to status page
 * - Status page shows progress stages
 * - History page lists evaluations
 */
import { expect, test } from "@playwright/test";

import { API_BASE, apiSignup, uniqueEmail } from "./helpers";

test.describe("Evaluation flow", () => {
  test.beforeEach(async ({ page }) => {
    await apiSignup(page, uniqueEmail("eval-e2e"));
  });

  test("evaluation start page shows scoring factors", async ({ page }) => {
    await page.goto("/evaluation/start");
    await page.waitForLoadState("networkidle");

    // Key factor names should appear
    await expect(page.getByText(/학업 역량/)).toBeVisible();
    await expect(page.getByText(/프로젝트/)).toBeVisible();
    await expect(page.getByText(/100점/)).toBeVisible();
  });

  test("submitting evaluation redirects to status page", async ({ page }) => {
    await page.goto("/evaluation/start");
    await page.waitForLoadState("networkidle");

    const submitBtn = page.getByRole("button", { name: /평가 시작|평가 요청/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Should redirect to /evaluation/{id}
    await page.waitForURL(/\/evaluation\/[^/]+$/, { timeout: 10_000 });
    await expect(page).not.toHaveURL("/evaluation/start");

    // Status indicators should be present
    await expect(
      page.getByText(/대기|처리|pending|processing/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("evaluation history page loads", async ({ page }) => {
    // Create an evaluation via API first
    const csrfRes = await page.context().request.get(`${API_BASE}/api/v1/auth/csrf-token`);
    const { csrf_token } = await csrfRes.json().catch(() => ({ csrf_token: "" }));

    await page.context().request.post(`${API_BASE}/api/v1/evaluations`, {
      headers: { "X-CSRF-Token": csrf_token },
    });

    await page.goto("/evaluation/history");
    await page.waitForLoadState("networkidle");

    // Should show at least one evaluation
    await expect(
      page.getByText(/대기|pending|처리|completed/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});
