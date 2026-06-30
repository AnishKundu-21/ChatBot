import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB_NAME ?? "memory_chatbot";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);

  await db.collection("memories").createIndex({ user_id: 1, is_active: 1 });
  await db.collection("messages").createIndex({ session_id: 1, user_id: 1 });

  console.log(`Connected to MongoDB (${dbName})`);
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error("MongoDB is not connected — call connectMongo() first");
  }
  return db;
}

export function getClient(): MongoClient {
  if (!client) {
    throw new Error("MongoDB is not connected — call connectMongo() first");
  }
  return client;
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}