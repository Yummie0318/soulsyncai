// tests/new.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Signup Page (/new)", () => {
  test.beforeEach(async ({ page }) => {
    // Assumes baseURL is set to http://localhost:3000 in playwright.config.ts
    await page.goto("/new");
  });

  test("should display logo, title, subtitles and main form", async ({ page }) => {
    // Logo
    await expect(page.locator('img[alt="SoulSync Logo"]')).toBeVisible();

    // Title
    await expect(
      page.getByRole("heading", { name: "SoulSync AI" })
    ).toBeVisible();

    // Subtitle text
    await expect(
      page.getByText("Let’s find your person.")
    ).toBeVisible();

    // Create account text
    await expect(
      page.getByText("Create your SoulSync account.")
    ).toBeVisible();

    // Labels
    await expect(
      page.getByText("Display name")
    ).toBeVisible();
    await expect(
      page.getByText("Email address")
    ).toBeVisible();

    // More specific for password: use label or exact text
    await expect(
      page.getByText("Password", { exact: true })
    ).toBeVisible();
    // or: await expect(page.getByLabel("Password")).toBeVisible();

    // Inputs
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    // Helper text under password
    await expect(
      page.getByText("Password must be at least 8 characters.")
    ).toBeVisible();

    // Signup button
    await expect(
      page.getByRole("button", { name: "Sign up" })
    ).toBeVisible();

    // "Already have an account? Log in" link
    await expect(
      page.getByText("Already have an account?")
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Log in" })
    ).toBeVisible();
  });

  test("sign up button is disabled when fields are empty", async ({ page }) => {
    const signupButton = page.getByRole("button", { name: "Sign up" });

    // With all fields empty, canSubmit = false -> button disabled
    await expect(signupButton).toBeDisabled();
  });

  test("should show error for invalid email format", async ({ page }) => {
    // Fill only name and invalid email + valid length password
    await page.fill("#name", "Test User");
    await page.fill("#email", "invalid-email");
    await page.fill("#password", "password123");

    const signupButton = page.getByRole("button", { name: "Sign up" });

    // Now canSubmit should be true -> button enabled
    await expect(signupButton).toBeEnabled();

    await signupButton.click();

    await expect(
      page.getByText("Please enter a valid email address.")
    ).toBeVisible();
  });

  test("sign up button stays disabled for too short password", async ({ page }) => {
    await page.fill("#name", "Test User");
    await page.fill("#email", "joylynmadriagats@gmail.com");
    await page.fill("#password", "short"); // length < 8

    const signupButton = page.getByRole("button", { name: "Sign up" });

    // Because password is too short, canSubmit is false -> button disabled
    await expect(signupButton).toBeDisabled();

    // We do NOT expect an error message here, because handleSubmit never runs
  });

  test("sign up button becomes enabled when form is valid", async ({ page }) => {
    const signupButton = page.getByRole("button", { name: "Sign up" });

    await page.fill("#name", "Test User");
    await page.fill("#email", "joylynmadriagats@gmail.com");
    await page.fill("#password", "password123");

    await expect(signupButton).toBeEnabled();
  });
});
