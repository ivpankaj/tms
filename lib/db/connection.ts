import mongoose from "mongoose";
import { env } from "@/lib/config/env";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  memoryServer?: any;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const mongoUri = env.database.uri;
    const isCloudCluster =
      mongoUri.startsWith("mongodb+srv://") ||
      (mongoUri.includes("@") && !mongoUri.includes("localhost") && !mongoUri.includes("127.0.0.1"));

    cached.promise = (async () => {
      // 1. Cloud MongoDB (e.g. MongoDB Atlas)
      if (isCloudCluster) {
        console.log("[Cookmywork] Connecting to MongoDB Atlas Cluster...");
        return await mongoose.connect(mongoUri, {
          bufferCommands: false,
          serverSelectionTimeoutMS: 10000,
          dbName: env.database.dbName || "cookmywork",
        });
      }

      // 2. Local MongoDB connection attempt with quick timeout (1.5s)
      try {
        const localConn = await mongoose.connect(mongoUri, {
          bufferCommands: false,
          serverSelectionTimeoutMS: 1500,
          dbName: env.database.dbName || "cookmywork",
        });
        return localConn;
      } catch (localErr: any) {
        console.warn(
          `[Cookmywork] Local MongoDB at ${mongoUri} not reachable (${localErr.message || "Connection refused"}).`
        );
        console.log(
          "[Cookmywork] Auto-starting embedded in-memory MongoDB engine for seamless instant development..."
        );

        // 3. Fallback to embedded in-memory MongoDB
        if (!cached.memoryServer) {
          const { MongoMemoryServer } = await import("mongodb-memory-server");
          cached.memoryServer = await MongoMemoryServer.create();
        }

        const embeddedUri = cached.memoryServer.getUri();
        console.log(`[Cookmywork] Embedded MongoDB running at: ${embeddedUri}`);

        return await mongoose.connect(embeddedUri, {
          bufferCommands: false,
          serverSelectionTimeoutMS: 5000,
          dbName: env.database.dbName || "cookmywork",
        });
      }
    })()
      .then((m) => {
        cached.conn = m;
        return m;
      })
      .catch((err) => {
        console.error("[Cookmywork] Database connection failed:", err.message);
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
