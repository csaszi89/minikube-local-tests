import { test, expect } from '@playwright/test';

test('navigate to local server', async ({ page }) => {
  await page.goto('http://127.0.0.1:55551/');

  await expect(page).toHaveURL('http://127.0.0.1:55551/');
  await expect(page.getByRole('heading')).toHaveText('Welcome to nginx!');
});
