import dns from 'node:dns';
import mongoose from 'mongoose';
import { config } from '../config.js';

// Resolve MongoDB Atlas SRV records reliably on Windows network environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_e) {
  // Ignore in restricted environments
}

mongoose.set('strictQuery', true);

/** @returns {"connected" | "disconnected" | "not_configured"} */
export function dbStatus() {
  if (!config.mongo.uri) return 'not_configured';
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}

export function isDbConnected() {
  return dbStatus() === 'connected';
}

/**
 * Connect to MongoDB Atlas. Never throws: the API keeps working without a DB
 * (search, questions, compliance check), and DB-only endpoints return 503 DB_UNAVAILABLE.
 */
export async function connectDb() {
  if (!config.mongo.uri) {
    console.warn('[db] MONGODB_URI not set — running without database.');
    return false;
  }
  try {
    await mongoose.connect(config.mongo.uri, {
      dbName: config.mongo.dbName,
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[db] connected (db: ${config.mongo.dbName})`);
    return true;
  } catch (err) {
    console.error(`[db] connection failed: ${err.message}`);
    return false;
  }
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
