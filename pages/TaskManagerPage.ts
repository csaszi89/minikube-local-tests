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
    return this.page.getByRole('listitem').filter({ hasText: name });
  }

  editTaskButton(name: string) {
    return this.taskItem(name).getByRole('button', { name: 'Edit' });
  }

  deleteTaskButton(name: string) {
    return this.taskItem(name).getByRole('button', { name: 'Delete' });
  }

  get editingTaskItem() {
    return this.page
      .getByRole('listitem')
      .filter({ has: this.page.getByRole('button', { name: 'Save' }) });
  }

  get editTaskTitleInput() {
    return this.editingTaskItem.getByRole('textbox').first();
  }

  get editTaskDescriptionInput() {
    return this.editingTaskItem.getByRole('textbox').nth(1);
  }

  get saveTaskButton() {
    return this.editingTaskItem.getByRole('button', { name: 'Save' });
  }

  get cancelTaskButton() {
    return this.editingTaskItem.getByRole('button', { name: 'Cancel' });
  }

  get taskItemCount() {
    return this.page.getByRole('listitem').count();
  }

  async goto() {
    await this.page.goto('/');
  }
}
