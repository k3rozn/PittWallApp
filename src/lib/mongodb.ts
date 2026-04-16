import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

// Skip connection if URI is missing or a placeholder
const MONGODB_ENABLED =
  !!MONGODB_URI &&
  MONGODB_URI !== "mongodb+srv://user:password@cluster.mongodb.net/pitwall?retryWrites=true&w=majority";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.__mongoose ?? { conn: null, promise: null };

if (!global.__mongoose) {
  global.__mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose | null> {
  if (!MONGODB_ENABLED) {
    // Return null — callers must handle null gracefully
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("[MongoDB] Connection failed:", e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;
