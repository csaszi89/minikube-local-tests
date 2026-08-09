import { test, expect } from '@playwright/test';

test('navigate to local server', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading')).toHaveText('Welcome to nginx!');
});
