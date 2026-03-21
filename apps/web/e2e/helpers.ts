import { type Page, expect } from "@playwright/test";

export const API_BASE = process.env.E2E_API_URL ?? "http://localhost:8000";

/** Unique email for each test run so tests don't interfere. */
export function uniqueEmail(prefix = "user"): string {
  return `${prefix}+${Date.now()}@e2e.test`;
}

/** Sign up a new user via API (faster than UI). Returns csrf_token. */
export async function apiSignup(
  page: Page,
  email: string,
  password = "Password123!",
  name = "테스터",
): Promise<string> {
  const ctx = page.context();

  // Sign up
  const signupRes = await ctx.request.post(`${API_BASE}/api/v1/auth/signup`, {
    data: { email, password, name },
  });
  expect(signupRes.status()).toBe(201);

  // Log in
  const loginRes = await ctx.request.post(`${API_BASE}/api/v1/auth/login`, {
    data: { email, password },
  });
  expect(loginRes.status()).toBe(200);
  const { csrf_token } = await loginRes.json();

  // Reload page so session cookie is active in browser context
  await page.goto("/dashboard");
  return csrf_token as string;
}

/** Navigate and wait for the page to fully load (no spinners). */
export async function goTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}
