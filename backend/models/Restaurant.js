import mongoose from 'mongoose';
import { menuItemSchema } from './MenuItem.js';
import elasticClient from '../services/elasticClient.js';

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
    isOpen: {
      type: Boolean,
      default: true,
    },
    location: {
      lat: { type: Number, default: 28.6139 },
      lng: { type: Number, default: 77.2090 }
    },
    favouritesCount: {
      type: Number,
      default: 0,
    },
    menu: [menuItemSchema],
  },
  { timestamps: true }
);

// Create text index on name and cuisine for search
restaurantSchema.index({ name: 'text', cuisine: 'text' });

async function syncToElastic(doc) {
  if (!doc) return;
  try {
    await elasticClient.index({
      index: 'restaurants',
      id: doc._id.toString(),
      document: {
        name: doc.name,
        cuisine: doc.cuisine,
        rating: doc.rating,
        deliveryTime: doc.deliveryTime,
        isOpen: doc.isOpen,
        location: { lat: doc.location?.lat || 28.6139, lon: doc.location?.lng || 77.2090 }
      }
    });

    if (doc.menu && Array.isArray(doc.menu)) {
      const operations = doc.menu.flatMap(item => [
        { index: { _index: 'dishes', _id: item._id.toString() } },
        {
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          isVeg: item.isVeg,
          spiceLevel: item.spiceLevel || 'mild',
          tags: item.tags || [],
          restaurantId: doc._id.toString(),
          restaurantName: doc.name
        }
      ]);

      if (operations.length > 0) {
        await elasticClient.bulk({ refresh: true, operations });
      }
    }
  } catch (error) {
    console.error('Elasticsearch sync failed:', error);
  }
}

restaurantSchema.post('save', function (doc) {
  syncToElastic(doc);
});

restaurantSchema.post('findOneAndUpdate', function (doc) {
  syncToElastic(doc);
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export default Restaurant;
