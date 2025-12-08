// tests/new.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Signup Page (/new)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/new");
  });

  test("should display logo, title, subtitles and main form", async ({ page }) => {
    await expect(page.locator('img[alt="SoulSync Logo"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "SoulSync AI" })).toBeVisible();
    await expect(page.getByText("Let’s find your person.")).toBeVisible();
    await expect(page.getByText("Create your SoulSync account.")).toBeVisible();

    await expect(page.getByText("Display name")).toBeVisible();
    await expect(page.getByText("Email address")).toBeVisible();
    await expect(page.getByText("Password", { exact: true })).toBeVisible();

    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    await expect(
      page.getByText("Password must be at least 8 characters.")
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Sign up" })
    ).toBeVisible();

    await expect(page.getByText("Already have an account?")).toBeVisible();
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
  });

  test("sign up button is disabled when fields are empty", async ({ page }) => {
    const signupButton = page.getByRole("button", { name: "Sign up" });
    await expect(signupButton).toBeDisabled();
  });

  test("should show error for invalid email format", async ({ page }) => {
    await page.fill("#name", "Test User");
    await page.fill("#email", "invalid-email"); // invalid on purpose
    await page.fill("#password", "password123");

    const signupButton = page.getByRole("button", { name: "Sign up" });
    await expect(signupButton).toBeEnabled();
    await signupButton.click();

    // Debug screenshot for CI/local
    await page.screenshot({ path: 'debug-invalid-email.png', fullPage: true });

    // More robust locator for error message
    const errorText = page.locator('p', { hasText: /valid email/i });
    await expect(errorText).toBeVisible({ timeout: 7000 });
  });

  test("sign up button stays disabled for too short password", async ({ page }) => {
    await page.fill("#name", "Test User");
    await page.fill("#email", "joylynmadriagats@gmail.com");
    await page.fill("#password", "short");

    const signupButton = page.getByRole("button", { name: "Sign up" });
    await expect(signupButton).toBeDisabled();
  });

  test("sign up button becomes enabled when form is valid", async ({ page }) => {
    const signupButton = page.getByRole("button", { name: "Sign up" });

    await page.fill("#name", "Test User");
    await page.fill("#email", "joylynmadriagats@gmail.com"); // ← your email here
    await page.fill("#password", "password123");

    await expect(signupButton).toBeEnabled();
  });
});
