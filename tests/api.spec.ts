import { type APIRequestContext, expect, request, test } from '@playwright/test';
import { TodoApiHelper } from '../helpers/TodoApiHelper';
import { apiBaseURL } from '../playwright.config';

let api: APIRequestContext;
let todoApi: TodoApiHelper;
let createdTaskIds: string[];

function uniqueTaskTitle(prefix: string): string {
  return `${prefix} ${crypto.randomUUID()}`;
}

test.describe('Task Manager API', () => {
  test.beforeEach(async () => {
    api = await request.newContext({ baseURL: apiBaseURL });
    todoApi = new TodoApiHelper(api);
    createdTaskIds = [];
  });

  test.afterEach(async () => {
    try {
      const tasks = await todoApi.list();
      for (const task of tasks) {
        if (createdTaskIds.includes(task.id)) {
          await todoApi.delete(task.id);
        }
      }
    } finally {
      await api.dispose();
    }
  });

  test('List tasks', async () => {
    await test.step('Request the task collection', async () => {
      const tasks = await todoApi.list();
      expect(tasks).toEqual(expect.any(Array));
    });
  });

  test('Create a task', async () => {
    const title = uniqueTaskTitle('Created API task');
    const description = 'Created through the API';

    await test.step('Create a task', async () => {
      const task = await todoApi.create({ title, description });
      createdTaskIds.push(task.id);

      expect(task).toMatchObject({
        id: expect.any(String),
        title,
        description,
      });
    });
  });

  test('Edit a task', async () => {
    const originalTitle = uniqueTaskTitle('Original API task');
    const updatedTitle = uniqueTaskTitle('Updated API task');
    const updatedDescription = 'Updated through the API';

    const task = await test.step('Create a task to edit', async () => {
      const created = await todoApi.create({ title: originalTitle });
      createdTaskIds.push(created.id);
      return created;
    });

    await test.step('Update the task', async () => {
      await todoApi.edit(task.id, {
        title: updatedTitle,
        description: updatedDescription,
      });
    });

    await test.step('Verify the updated task was persisted', async () => {
      const tasks = await todoApi.list();
      expect(tasks.find((item) => item.id === task.id)).toMatchObject({
        id: task.id,
        title: updatedTitle,
        description: updatedDescription,
      });
    });
  });

  test('Delete a task', async () => {
    const title = uniqueTaskTitle('Deleted API task');

    const task = await test.step('Create a task to delete', async () => {
      const created = await todoApi.create({ title });
      createdTaskIds.push(created.id);
      return created;
    });

    await test.step('Delete the task', async () => {
      await todoApi.delete(task.id);
    });

    await test.step('Verify the task was removed', async () => {
      const tasks = await todoApi.list();
      expect(tasks.find((item) => item.id === task.id)).toBeUndefined();
    });
  });
});