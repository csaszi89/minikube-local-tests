import { type Page } from '@playwright/test';

export class TaskManagerPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get heading() {
    return this.page.getByRole('heading');
  }

  get titleInput() {
    return this.page.getByPlaceholder('Task title');
  }

  get descriptionInput() {
    return this.page.getByPlaceholder('Description (optional)');
  }

  get addTaskButton() {
    return this.page.getByRole('button', { name: 'Add Task' });
  }

  taskItem(name: string) {
    return this.page.getByRole('listitem').getByText(name);
  }

  get taskItemCount() {
    return this.page.getByRole('listitem').count();
  }

  async goto() {
    await this.page.goto('/');
  }
}
