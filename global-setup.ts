import { request } from '@playwright/test';
import { apiBaseURL } from './playwright.config';
import { TodoApiHelper } from './helpers/TodoApiHelper';

async function globalSetup() {
  const api = await request.newContext({
    baseURL: apiBaseURL,
  });

  const todoApi = new TodoApiHelper(api);

  const tasks = await todoApi.list();

  await Promise.all(tasks.map((task) => todoApi.delete(task.id)));

  await api.dispose();
}

export default globalSetup;