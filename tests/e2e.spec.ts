import { test, expect } from '@playwright/test';
import { TaskManagerPage } from '../pages/TaskManagerPage';

let taskManager: TaskManagerPage;

test.beforeEach(async ({ page }) => {
  taskManager = new TaskManagerPage(page);
  await taskManager.goto();
});

test('Navigate to website and verify header', async () => {
  await expect(taskManager.heading).toHaveText('Task Manager');
});

test('Navigate to website and verify basic elements', async () => {
  await expect(taskManager.titleInput).toBeVisible();
  await expect(taskManager.titleInput).toBeEnabled();

  await expect(taskManager.descriptionInput).toBeVisible();
  await expect(taskManager.descriptionInput).toBeEnabled();

  await expect(taskManager.addTaskButton).toBeVisible();
  await expect(taskManager.addTaskButton).toBeEnabled();
});
