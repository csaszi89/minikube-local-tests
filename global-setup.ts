import { TodoDbHelper } from './helpers/TodoDbHelper';

async function globalSetup() {
  const db = new TodoDbHelper();

  try {
    await db.connect();
    await db.clearAll();
  } finally {
    await db.disconnect();
  }
}

export default globalSetup;