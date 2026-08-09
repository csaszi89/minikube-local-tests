import { request } from '@playwright/test';
import { apiBaseURL } from './playwright.config';

async function globalSetup() {
  const api = await request.newContext({
    baseURL: apiBaseURL,
  });

  const tasks = await api.get('/api/tasks');
  const data = await tasks.json();

  await Promise.all(
    data.map((task: { id: string }) => api.delete(`/api/tasks/${task.id}`))
  );

  await api.dispose();
}

export default globalSetup;