import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  const MAX_RETRIES = 5;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
      });
      console.log('MongoDB Connected Successfully');
      break;
    } catch (error) {
      retries += 1;
      console.error(`MongoDB Connection Error (Attempt ${retries}/${MAX_RETRIES}):`, error.message);
      if (retries >= MAX_RETRIES) {
        console.error('Failed to connect to MongoDB after maximum retries. Exiting...');
        process.exit(1);
      }
      // Wait for 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

export default connectDB;
