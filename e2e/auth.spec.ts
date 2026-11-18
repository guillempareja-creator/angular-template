import { expect, test } from '@playwright/test';

/**
 * Smoke test of the template: login → main page (data served by MSW) → logout.
 * Every new feature should add its own happy-path journey under e2e/.
 */
test.describe('authentication flow', () => {
  test('redirects anonymous users to the login page', async ({ page }) => {
    await page.goto('/main');

    await expect(page).toHaveURL(/\/login$/);
  });

  test('shows validation errors when the form is empty', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-btn-submit').click();

    await expect(page.locator('#login-error-username')).toBeVisible();
    await expect(page.locator('#login-error-password')).toBeVisible();
  });

  test('logs in, loads data from the API and logs out', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#login-input-username').fill('demo');
    await page.locator('#login-input-password').fill('demo');
    await page.locator('#login-btn-submit').click();

    await expect(page).toHaveURL(/\/main$/);
    await expect(
      page.getByText('Example data served by the MSW fake backend'),
    ).toBeVisible();

    await page.locator('#header-btn-logout').click();

    await expect(page).toHaveURL(/\/login$/);
  });
});
