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

test('Navigate to website and create a task with description', async () => {
  const uid = crypto.randomUUID();
  await taskManager.titleInput.fill(`New Task ${uid}`);
  await taskManager.descriptionInput.fill('Task Description');
  await taskManager.addTaskButton.click();
  await expect(taskManager.taskItem(`New Task ${uid}`)).toBeVisible();
});

test('Navigate to website and create a task without description', async () => {
  const uid = crypto.randomUUID();
  await taskManager.titleInput.fill(`New Task ${uid}`);
  await taskManager.descriptionInput.fill('');
  await taskManager.addTaskButton.click();
  await expect(taskManager.taskItem(`New Task ${uid}`)).toBeVisible();
});

test('Navigate to website and try create a task without name', async () => {
  const initialTaskCount = await taskManager.taskItemCount;
  await taskManager.titleInput.fill('');
  await taskManager.descriptionInput.fill('');
  await taskManager.addTaskButton.click();
  const finalTaskCount = await taskManager.taskItemCount;
  expect(finalTaskCount).toBe(initialTaskCount);
});
