import { test, expect } from "@playwright/test";

test.describe("Welcome Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/welcome"); // Adjusts if your route is differents
  });

  test("should display logo", async ({ page }) => {
    const logo = page.locator('img[alt="SoulSync Logo"]');
    await expect(logo).toBeVisible();
  });

  test("should show title 'SoulSync AI'", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "SoulSync AI" })).toBeVisible();
  });

  test("should display subtitle", async ({ page }) => {
    await expect(
      page.locator("text=Let’s find your person.")
    ).toBeVisible();
  });

  test("should have Continue my journey button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Continue my journey" })
    ).toBeVisible();
  });

  test("should have Start a new journey button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Start a new journey" })
    ).toBeVisible();
  });

  test("Continue button should navigate to /login", async ({ page }) => {
    await page.getByRole("button", { name: "Continue my journey" }).click();
    await expect(page).toHaveURL(/.*login/);
  });

  test("Start new journey button should navigate to /new", async ({ page }) => {
    await page.getByRole("button", { name: "Start a new journey" }).click();
    await expect(page).toHaveURL(/.*new/);
  });
});
