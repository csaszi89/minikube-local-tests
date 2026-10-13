import { test, expect, request as requestContext } from '@playwright/test';
import { TaskManagerPage } from '../pages/TaskManagerPage';
import { TodoApiHelper } from '../helpers/TodoApiHelper';
import { apiBaseURL } from '../playwright.config';

let taskManager: TaskManagerPage;
let createdTaskTitle: string | undefined;
let seededTaskId: string | undefined;

async function seedTask(title: string) {
  const api = await requestContext.newContext({ baseURL: apiBaseURL });
  const helper = new TodoApiHelper(api);
  try {
    return await helper.create({ title, description: 'Seeded task description' });
  } finally {
    await api.dispose();
  }
}

test.describe('Task Manager UI', () => {
  test.beforeEach(async ({ page }) => {
    createdTaskTitle = undefined;
    seededTaskId = undefined;
    taskManager = new TaskManagerPage(page);
    await taskManager.goto();
  });

  test.afterEach(async () => {
    // Only deletes the task a test actually created, not the whole collection.
    if (!createdTaskTitle && !seededTaskId) {
      return;
    }

    const api = await requestContext.newContext({ baseURL: apiBaseURL });
    const helper = new TodoApiHelper(api);
    const items = await helper.list();
    const created = items.find(
      (item) => item.id === seededTaskId || item.title === createdTaskTitle,
    );
    if (created) {
      await helper.delete(created.id);
    }
    await api.dispose();
  });

  test('Verify initial page elements', async () => {
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

  test('Create a task with description', async () => {
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

  test('Create a task without description', async () => {
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

  test('Create a task title with special characters at the maximum allowed length', async () => {
    const specialCharacters = 'áéőű!@#$%&()-_+[]{}';
    createdTaskTitle = `${specialCharacters}${'a'.repeat(100 - specialCharacters.length)}`;

    await test.step('Enter a 100-character task title with special characters', async () => {
      await taskManager.titleInput.fill(createdTaskTitle!);
    });

    await test.step('Create the task', async () => {
      await taskManager.addTaskButton.click();
    });

    await test.step('Verify the task was created with its original title', async () => {
      await expect(taskManager.taskItem(createdTaskTitle!)).toBeVisible();
      await expect(taskManager.taskItem(createdTaskTitle!)).toContainText(createdTaskTitle!);
    });
  });

  test('Limit a task title input to 100 characters', async () => {
    const titlePrefix = `Task-${crypto.randomUUID()}-`;
    createdTaskTitle = `${titlePrefix}${'a'.repeat(100 - titlePrefix.length)}`;
    const titleLongerThanAllowed = `${createdTaskTitle}x`;

    await test.step('Enter a task title longer than 100 characters', async () => {
      await taskManager.titleInput.fill(titleLongerThanAllowed);
    });

    await test.step('Verify the title was truncated to 100 characters', async () => {
      await expect(taskManager.titleInput).toHaveValue(createdTaskTitle!);
    });

    await test.step('Create the task with the truncated title', async () => {
      await taskManager.addTaskButton.click();
    });

    await test.step('Verify the task was created with the truncated title', async () => {
      await expect(taskManager.taskItem(createdTaskTitle!)).toBeVisible();
    });
  });

  test('Edit a seeded task', async () => {
    const seededTaskTitle = `Seeded Task ${crypto.randomUUID()}`;
    const updatedTaskTitle = `Updated Task ${crypto.randomUUID()}`;

    await test.step('Seed a task through the API', async () => {
      const seededTask = await seedTask(seededTaskTitle);
      seededTaskId = seededTask.id;
    });

    await test.step('Open the seeded task for editing', async () => {
      await taskManager.goto();
      await taskManager.editTaskButton(seededTaskTitle).click();
    });

    await test.step('Update and save the task', async () => {
      await taskManager.editTaskTitleInput.fill(updatedTaskTitle);
      await taskManager.editTaskDescriptionInput.fill('Updated task description');
      await taskManager.saveTaskButton.click();
    });

    await test.step('Verify the updated task', async () => {
      await expect(taskManager.taskItem(updatedTaskTitle)).toBeVisible();
      await expect(taskManager.taskItem(seededTaskTitle)).not.toBeVisible();
    });
  });

  test('Cancel editing a seeded task', async () => {
    const seededTaskTitle = `Seeded Task ${crypto.randomUUID()}`;
    const seededTaskDescription = 'Seeded task description';

    await test.step('Seed a task through the API', async () => {
      const seededTask = await seedTask(seededTaskTitle);
      seededTaskId = seededTask.id;
    });

    await test.step('Change the seeded task', async () => {
      await taskManager.goto();
      await taskManager.editTaskButton(seededTaskTitle).click();
      await taskManager.editTaskTitleInput.fill(`Changed Task ${crypto.randomUUID()}`);
      await taskManager.editTaskDescriptionInput.fill('Changed task description');
    });

    await test.step('Cancel the edit', async () => {
      await taskManager.cancelTaskButton.click();
    });

    await test.step('Verify the original task was preserved', async () => {
      await expect(taskManager.taskItem(seededTaskTitle)).toBeVisible();
      await expect(taskManager.taskItem(seededTaskTitle)).toContainText(seededTaskDescription);
    });
  });

  test('Delete a seeded task', async () => {
    const seededTaskTitle = `Seeded Task ${crypto.randomUUID()}`;

    await test.step('Seed a task through the API', async () => {
      const seededTask = await seedTask(seededTaskTitle);
      seededTaskId = seededTask.id;
    });

    await test.step('Delete the seeded task', async () => {
      await taskManager.goto();
      await taskManager.deleteTaskButton(seededTaskTitle).click();
    });

    await test.step('Verify the task was removed', async () => {
      await expect(taskManager.taskItem(seededTaskTitle)).not.toBeVisible();
    });
  });

  test('Verify empty name behavior', async () => {
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
