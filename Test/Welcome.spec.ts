const { test, expect } = require('@playwright/test');

test('WelcomePage renders logo, title, subtitle, and buttons', async ({ page }) => {
  // Update this path if your WelcomePage is served at a different route
  await page.goto('/(frontend)/welcome');

  // Check logo is visible
  await expect(page.locator('img[alt="SoulSync Logo"]')).toBeVisible();

  // Check title
  await expect(page.locator('h1')).toHaveText('SoulSync AI');

  // Check subtitle
  await expect(page.getByText("Let’s find your person.")).toBeVisible();

  // Check buttons
  await expect(page.getByRole('button', { name: 'Continue my journey' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start a new journey' })).toBeVisible();

  // Check links
  await expect(page.locator('a[href="/login"]')).toBeVisible();
  await expect(page.locator('a[href="/new"]')).toBeVisible();
});