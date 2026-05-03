import mongoose from 'mongoose';
import dns from 'dns';
import logger from '../utils/logger';

// Use Google DNS to resolve MongoDB Atlas SRV records
// (fixes ECONNREFUSED on mobile hotspot / restrictive networks)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// Cache the connection promise across serverless invocations.
// On Vercel a single Node instance handles many requests; we must not
// open a new mongoose connection per request.
type Cached = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalAny = global as unknown as { _mongoose?: Cached };
const cached: Cached = globalAny._mongoose ?? (globalAny._mongoose = { conn: null, promise: null });

const connectDB = async (): Promise<void> => {
  if (cached.conn) return;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI as string, {
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => {
        logger.info(`MongoDB Connected: ${m.connection.host}`);
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error: any) {
    cached.promise = null;
    logger.error(`MongoDB connection failed: ${error.message}`);
    if (process.env.VERCEL) {
      throw error;
    }
    logger.error('Server will start without database connection. Retrying in 30 seconds...');
    setTimeout(connectDB, 30000);
  }
};

export default connectDB;
