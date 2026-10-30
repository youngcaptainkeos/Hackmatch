import { MongoClient } from 'mongodb';
export async function getMongoDB() {
  if (!process.env.MONGODB_URI) throw new Error('MongoDB is not configured');
  if (!globalThis.mongoConnection) {
    const client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });
    globalThis.mongoConnection = client.connect().catch((error) => {
      globalThis.mongoConnection = null;
      throw error;
    });
  }
  const client = await globalThis.mongoConnection;
  return client.db(process.env.MONGODB_DATABASE || 'hackmatch');
}
