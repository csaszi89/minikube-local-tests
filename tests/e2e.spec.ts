import { test, expect } from '@playwright/test';

test('Navigate to website and verify header', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading')).toHaveText('Task Manager');
});
