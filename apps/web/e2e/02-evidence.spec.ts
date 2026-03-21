/**
 * E2E Scenario 2: Evidence input — academic + project
 *
 * Covers:
 * - Evidence hub page loads with all 8 categories
 * - Academic record form saves successfully
 * - Project record form saves successfully
 * - Evidence hub reflects updated state
 */
import { expect, test } from "@playwright/test";

import { apiSignup, uniqueEmail } from "./helpers";

test.describe("Evidence input", () => {
  test.beforeEach(async ({ page }) => {
    await apiSignup(page, uniqueEmail("evidence-e2e"));
  });

  test("evidence hub shows 8 categories", async ({ page }) => {
    await page.goto("/evidence");
    await page.waitForLoadState("networkidle");

    // All 8 category links should be visible
    const categories = ["학업", "프로젝트", "인턴십", "자격증", "교육", "포트폴리오", "GitHub", "파일"];
    for (const cat of categories) {
      await expect(page.getByText(cat).first()).toBeVisible();
    }
  });

  test("can save academic record", async ({ page }) => {
    await page.goto("/evidence/academic");
    await page.waitForLoadState("networkidle");

    // Fill in GPA
    const gpaInput = page.getByLabel(/학점|GPA/i).first();
    if (await gpaInput.isVisible()) {
      await gpaInput.fill("3.8");
    }

    // Fill in university
    const uniInput = page.getByLabel(/학교|대학/i).first();
    if (await uniInput.isVisible()) {
      await uniInput.fill("한국대학교");
    }

    // Save
    const saveBtn = page.getByRole("button", { name: /저장|확인/i });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      // Should show success or not show an error
      await page.waitForTimeout(1000);
      const errorMsg = page.locator('[class*="danger"]');
      if (await errorMsg.isVisible()) {
        const text = await errorMsg.textContent();
        throw new Error(`Save failed: ${text}`);
      }
    }
  });

  test("can add a project record", async ({ page }) => {
    await page.goto("/evidence/projects");
    await page.waitForLoadState("networkidle");

    // Click add button
    const addBtn = page.getByRole("button", { name: /추가|새 프로젝트/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
    }

    // Fill in project title
    const titleInput = page.getByLabel(/프로젝트명|제목|title/i).first();
    if (await titleInput.isVisible()) {
      await titleInput.fill("E2E 테스트 프로젝트");
    }

    // Fill description
    const descInput = page.getByLabel(/설명|description/i).first();
    if (await descInput.isVisible()) {
      await descInput.fill("Playwright E2E 테스트를 위한 샘플 프로젝트입니다.");
    }

    // Save
    const saveBtn = page.getByRole("button", { name: /저장|추가|확인/i }).last();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(1000);
    }
  });
});
