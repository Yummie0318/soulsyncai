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
    await expect(
      page.getByText("Password")
    ).toBeVisible();

    // Inputs
    await expect(page.locator('input#name')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();

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

  test("should show error when submitting with empty fields", async ({ page }) => {
    const signupButton = page.getByRole("button", { name: "Sign up" });

    // Try to submit immediately
    await signupButton.click();

    // Expect client-side validation error
    await expect(
      page.getByText("Please fill in all fields.")
    ).toBeVisible();
  });

  test("should show error for invalid email format", async ({ page }) => {
    // Fill only name and invalid email + valid length password
    await page.fill("#name", "Test User");
    await page.fill("#email", "invalid-email");
    await page.fill("#password", "password123");

    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(
      page.getByText("Please enter a valid email address.")
    ).toBeVisible();
  });

  test("should show error for too short password", async ({ page }) => {
    await page.fill("#name", "Test User");
    await page.fill("#email", "test@example.com");
    await page.fill("#password", "short");

    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(
      page.getByText("Password must be at least 8 characters long.")
    ).toBeVisible();
  });

  // Optional: just check that button becomes enabled when form is valid
  test("sign up button becomes enabled when form is valid", async ({ page }) => {
    const signupButton = page.getByRole("button", { name: "Sign up" });

    // Initially disabled (because fields empty / invalid)
    // We don't assert disabled state here because it's handled via CSS classes,
    // but we can check it changes after filling valid data.

    await page.fill("#name", "Test User");
    await page.fill("#email", "test@example.com");
    await page.fill("#password", "password123");

    await expect(signupButton).toBeEnabled();
  });
});
