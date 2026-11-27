import { expect, test } from '@playwright/test';

/**
 * Smoke test of the template: the main page loads data from the example API
 * (served by the MSW fake backend). Every new user flow adds its own spec
 * under e2e/.
 */
test.describe('example page', () => {
  test('shows the data returned by the example API', async ({ page }) => {
    await page.goto('/main');

    await expect(
      page.getByRole('heading', { level: 1, name: /App Template/ }),
    ).toBeVisible();
    await expect(
      page.getByText('Example data served by the MSW fake backend'),
    ).toBeVisible();
  });

  test('redirects unknown routes to the main page', async ({ page }) => {
    await page.goto('/does-not-exist');

    await expect(page).toHaveURL(/\/main$/);
  });
});
