/// <reference types="node" />
import { Collection, Db, MongoClient, ObjectId } from 'mongodb';

export type TodoDbItem = {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
};

export type CreateTodoDbInput = {
  title: string;
  description?: string;
  completed?: boolean;
};

export type EditTodoDbInput = Partial<Pick<TodoDbItem, 'title' | 'description' | 'completed'>>;

export type TodoDbHelperOptions = {
  uri?: string;
  dbName?: string;
  collectionName?: string;
  serviceName?: string;
  servicePort?: number;
  namespace?: string;
};

function buildMongoUri(options?: TodoDbHelperOptions): string {
  if (options?.uri) {
    return options.uri;
  }

  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const isInCluster = Boolean(process.env.KUBERNETES_SERVICE_HOST);
  const serviceName = options?.serviceName ?? process.env.MONGODB_SERVICE_NAME ?? 'mongo-svc';
  const servicePort = options?.servicePort ?? Number(process.env.MONGODB_SERVICE_PORT ?? '27017');
  const namespace =
    options?.namespace ?? process.env.K8S_NAMESPACE ?? process.env.POD_NAMESPACE ?? 'default';

  if (isInCluster) {
    return `mongodb://${serviceName}.${namespace}.svc.cluster.local:${servicePort}`;
  }

  // Local runs usually need a port-forward or exposed service.
  return `mongodb://127.0.0.1:${servicePort}`;
}

function toMongoFilter(id: string) {
  return ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
}

function mapDocumentToTodoItem(doc: Record<string, unknown>): TodoDbItem {
  const rawId = doc._id;
  const id = rawId instanceof ObjectId ? rawId.toHexString() : String(rawId ?? doc.id ?? '');

  return {
    id,
    title: String(doc.title ?? ''),
    description: doc.description ? String(doc.description) : undefined,
    completed: typeof doc.completed === 'boolean' ? doc.completed : undefined,
  };
}

export class TodoDbHelper {
  private readonly client: MongoClient;
  private readonly dbName: string;
  private readonly collectionName: string;

  constructor(options?: TodoDbHelperOptions) {
    this.client = new MongoClient(buildMongoUri(options));
    this.dbName = options?.dbName ?? process.env.MONGODB_DB_NAME ?? 'taskmanager';
    this.collectionName =
      options?.collectionName ?? process.env.MONGODB_COLLECTION ?? 'tasks';
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  private get collection(): Collection {
    const db: Db = this.client.db(this.dbName);
    return db.collection(this.collectionName);
  }

  async list(): Promise<TodoDbItem[]> {
    const docs = await this.collection.find({}).toArray();
    return docs.map((doc) => mapDocumentToTodoItem(doc as Record<string, unknown>));
  }

  async create(input: CreateTodoDbInput): Promise<TodoDbItem> {
    const now = new Date();
    const insertResult = await this.collection.insertOne({
      ...input,
      createdAt: now,
      updatedAt: now,
    });

    const inserted = await this.collection.findOne({ _id: insertResult.insertedId });
    if (!inserted) {
      throw new Error('Failed to load created todo item from MongoDB.');
    }

    return mapDocumentToTodoItem(inserted as Record<string, unknown>);
  }

  async edit(id: string, input: EditTodoDbInput): Promise<TodoDbItem | null> {
    const filter = toMongoFilter(id);

    await this.collection.updateOne(filter, {
      $set: {
        ...input,
        updatedAt: new Date(),
      },
    });

    const updated = await this.collection.findOne(filter);
    if (!updated) {
      return null;
    }

    return mapDocumentToTodoItem(updated as Record<string, unknown>);
  }

  async delete(id: string): Promise<boolean> {
    const filter = toMongoFilter(id);
    const result = await this.collection.deleteOne(filter);
    return result.deletedCount === 1;
  }

  async clearAll(): Promise<number> {
    const result = await this.collection.deleteMany({});
    return result.deletedCount;
  }
}