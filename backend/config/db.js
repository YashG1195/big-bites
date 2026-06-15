import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  const MAX_RETRIES = 5;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      // useNewUrlParser and useUnifiedTopology are deprecated/removed in Mongoose 7+
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('[MongoDB] Connected successfully.');
      break;
    } catch (error) {
      retries += 1;
      console.error(`[MongoDB] Connection error (attempt ${retries}/${MAX_RETRIES}):`, error.message);
      if (retries >= MAX_RETRIES) {
        // Don't exit — let the server keep running so health endpoint still works
        console.error('[MongoDB] Max retries reached. Server continues without DB. Restart when MongoDB is available.');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

export default connectDB;
