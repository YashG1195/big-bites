import mongoose from 'mongoose';

const userRecommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    dishes: [
      {
        dishId: { type: mongoose.Schema.Types.ObjectId },
        reason: { type: String, required: true },
      }
    ],
    generatedAt: {
      type: Date,
      default: Date.now,
      index: { expires: '6h' } // TTL index: documents expire 6 hours after generatedAt
    }
  },
  { timestamps: true }
);

const UserRecommendations = mongoose.model('UserRecommendations', userRecommendationSchema);
export default UserRecommendations;
