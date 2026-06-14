import mongoose from 'mongoose';
import { menuItemSchema } from './MenuItem.js';

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    cuisine: [
      {
        type: String,
      },
    ],
    rating: {
      type: Number,
      default: 0,
    },
    deliveryTime: {
      type: Number, // in minutes
      default: 30,
    },
    menu: [menuItemSchema],
  },
  { timestamps: true }
);

// Create text index on name and cuisine for search
restaurantSchema.index({ name: 'text', cuisine: 'text' });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export default Restaurant;
