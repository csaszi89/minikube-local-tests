import { type APIRequestContext, expect } from '@playwright/test';

export type TodoItem = {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
};

export type CreateTodoInput = {
  title: string;
  description?: string;
};

export type EditTodoInput = Partial<Pick<TodoItem, 'title' | 'description' | 'completed'>>;

export class TodoApiHelper {
  private readonly api: APIRequestContext;

  constructor(api: APIRequestContext) {
    this.api = api;
  }

  async list(): Promise<TodoItem[]> {
    const response = await this.api.get('/api/tasks');
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async create(input: CreateTodoInput): Promise<TodoItem> {
    const response = await this.api.post('/api/tasks', {
      data: input,
    });
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async edit(id: string, input: EditTodoInput): Promise<TodoItem> {
    const response = await this.api.put(`/api/tasks/${id}`, {
      data: input,
    });
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await this.api.delete(`/api/tasks/${id}`);
    expect(response.ok()).toBeTruthy();
  }
}