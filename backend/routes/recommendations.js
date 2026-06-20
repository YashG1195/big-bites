import express from 'express';
import { protect } from '../middleware/auth.js';
import UserRecommendations from '../models/UserRecommendations.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import { generateRecommendations } from '../services/recommendationEngine.js';
import mongoose from 'mongoose';

const router = express.Router();

const populateDishDetails = async (recommendationDishes) => {
  const dishMap = {};
  recommendationDishes.forEach(d => { dishMap[d.dishId.toString()] = d.reason; });

  const dishIds = Object.keys(dishMap);
  
  const restaurants = await Restaurant.find({ 
    isOpen: true,
    'menu._id': { $in: dishIds.map(id => new mongoose.Types.ObjectId(id)) }
  }).lean();

  const finalResults = [];
  restaurants.forEach(r => {
    r.menu.forEach(item => {
      const idStr = item._id.toString();
      if (dishMap[idStr]) {
        finalResults.push({
          dish: item,
          restaurant: { _id: r._id, name: r.name, rating: r.rating, deliveryTime: r.deliveryTime },
          reason: dishMap[idStr]
        });
      }
    });
  });

  return finalResults;
};

router.get('/', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;

    let cached = await UserRecommendations.findOne({ userId }).lean();

    if (!cached || !cached.dishes || cached.dishes.length === 0) {
      const orderCount = await Order.countDocuments({ $or: [{ user: userId }, { userId: userId }] });

      if (orderCount > 0) {
        const newRecs = await generateRecommendations(userId);
        if (newRecs && newRecs.dishes) {
          cached = newRecs;
        }
      }

      if (!cached || !cached.dishes || cached.dishes.length === 0) {
        const topRestaurants = await Restaurant.find({ isOpen: true })
          .sort({ rating: -1 })
          .limit(5)
          .lean();

        const fallbackResults = [];
        topRestaurants.forEach(r => {
          if (r.menu && r.menu.length > 0) {
            const topItem = r.menu[0]; 
            fallbackResults.push({
              dish: topItem,
              restaurant: { _id: r._id, name: r.name, rating: r.rating, deliveryTime: r.deliveryTime },
              reason: "Popular near you right now"
            });
          }
        });

        return res.status(200).json({ success: true, data: fallbackResults.slice(0, 10) });
      }
    }

    const results = await populateDishDetails(cached.dishes);

    res.status(200).json({
      success: true,
      data: results
    });

  } catch (error) {
    next(error);
  }
});

export default router;
