import { test, expect, request as requestContext } from '@playwright/test';
import { TaskManagerPage } from '../pages/TaskManagerPage';
import { TodoApiHelper } from '../helpers/TodoApiHelper';
import { apiBaseURL } from '../playwright.config';

let taskManager: TaskManagerPage;
let createdTaskTitle: string | undefined;

test.describe('Task Manager UI', () => {
  test.beforeEach(async ({ page }) => {
    createdTaskTitle = undefined;
    taskManager = new TaskManagerPage(page);
    await taskManager.goto();
  });

  test.afterEach(async () => {
    // Only deletes the task a test actually created, not the whole collection.
    if (!createdTaskTitle) {
      return;
    }

    const api = await requestContext.newContext({ baseURL: apiBaseURL });
    const helper = new TodoApiHelper(api);
    const items = await helper.list();
    const created = items.find((item) => item.title === createdTaskTitle);
    if (created) {
      await helper.delete(created.id);
    }
    await api.dispose();
  });

  test('Navigate to website and verify initial page elements', async () => {
    await test.step('Verify the page header', async () => {
      await expect(taskManager.heading).toHaveText('Task Manager');
    });

    await test.step('Verify task form controls', async () => {
      await expect(taskManager.titleInput).toBeVisible();
      await expect(taskManager.titleInput).toBeEnabled();

      await expect(taskManager.descriptionInput).toBeVisible();
      await expect(taskManager.descriptionInput).toBeEnabled();

      await expect(taskManager.addTaskButton).toBeVisible();
      await expect(taskManager.addTaskButton).toBeEnabled();
    });
  });

  test('Navigate to website and create a task with description', async () => {
    await test.step('Enter task details', async () => {
      const uid = crypto.randomUUID();
      createdTaskTitle = `New Task ${uid}`;
      await taskManager.titleInput.fill(createdTaskTitle);
      await taskManager.descriptionInput.fill('Task Description');
    });

    await test.step('Create the task', async () => {
      await taskManager.addTaskButton.click();
    });

    await test.step('Verify the created task', async () => {
      await expect(taskManager.taskItem(createdTaskTitle!)).toBeVisible();
    });
  });

  test('Navigate to website and create a task without description', async () => {
    await test.step('Enter a task title', async () => {
      const uid = crypto.randomUUID();
      createdTaskTitle = `New Task ${uid}`;
      await taskManager.titleInput.fill(createdTaskTitle);
      await taskManager.descriptionInput.fill('');
    });

    await test.step('Create the task', async () => {
      await taskManager.addTaskButton.click();
    });

    await test.step('Verify the created task', async () => {
      await expect(taskManager.taskItem(createdTaskTitle!)).toBeVisible();
    });
  });

  test('Navigate to website and try create a task without name', async () => {
    const initialTaskCount = await test.step('Record the existing task count', async () =>
      taskManager.taskItemCount,
    );

    await test.step('Submit an empty task form', async () => {
      await taskManager.titleInput.fill('');
      await taskManager.descriptionInput.fill('');
      await taskManager.addTaskButton.click();
    });

    await test.step('Verify that no task was created', async () => {
      const finalTaskCount = await taskManager.taskItemCount;
      expect(finalTaskCount).toBe(initialTaskCount);
    });
  });
});
