import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.error('Server will start without database connection. Retrying in 30 seconds...');
    setTimeout(connectDB, 30000);
  }
};

export default connectDB;
