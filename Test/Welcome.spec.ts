import { test, expect } from '@playwright/test';

test.describe('SoulSync Welcome Page', () => {
  // Optionally set up initial localStorage values
  test.beforeEach(async ({ page }) => {
    // Example: set a mock user session (customize as needed)
    await page.addInitScript(() => {
      localStorage.setItem('user_id', 'test-user');
    });
  });

  test('should display logo, title, subtitle, and main buttons', async ({ page }) => {
    // Visit your Welcome pages route (adjust if you use a full URL in CI)
    await page.goto('http://localhost:3000/(frontend)/welcome');

    // Logo
    await expect(page.locator('img[alt="SoulSync Logo"]')).toBeVisible();

    // Title
    await expect(page.locator('h1')).toHaveText('SoulSync AI');

    // Subtitle
    await expect(page.getByText("Let’s find your person.")).toBeVisible();

    // Buttons
    await expect(page.getByRole('button', { name: 'Continue my journey' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start a new journey' })).toBeVisible();

    // Links
    await expect(page.locator('a[href="/login"]')).toBeVisible();
    await expect(page.locator('a[href="/new"]')).toBeVisible();
  });

  // Example: Add API mocking or navigation tests if you want (like your island tests)
  // If your WelcomePage responds to API or localStorage, you can customize below!

  // test('should redirect to another page if certain localStorage key is missing', async ({ page }) => {
  //   await page.addInitScript(() => {
  //     localStorage.removeItem('user_id');
  //   });
  //   await page.goto('http://localhost:3000/(frontend)/welcome');
  //   await expect(page).toHaveURL(/login/);
  // });
});