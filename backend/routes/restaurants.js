import express from 'express';
import Restaurant from '../models/Restaurant.js';
import redisClient from '../config/redis.js';

const router = express.Router();

// Helper: try Redis get, return null if unavailable
const cacheGet = async (key) => {
  try { return await redisClient.get(key); } catch { return null; }
};

// Helper: try Redis set, fail silently if unavailable
const cacheSet = async (key, ttl, value) => {
  try { await redisClient.setex(key, ttl, value); } catch { /* no-op */ }
};

/**
 * @desc    Get all restaurants
 * @route   GET /api/v1/restaurants
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const cachedRestaurants = await cacheGet('restaurants:list');
    if (cachedRestaurants) {
      return res.status(200).json({ success: true, source: 'cache', data: JSON.parse(cachedRestaurants) });
    }

    const restaurants = await Restaurant.find({}).select('-menu');
    await cacheSet('restaurants:list', 300, JSON.stringify(restaurants));

    res.status(200).json({ success: true, source: 'database', data: restaurants });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Search restaurants by name or cuisine
 * @route   GET /api/v1/restaurants/search?q=
 * @access  Public
 */
router.get('/search', async (req, res, next) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Please provide a search query' });
    }

    const restaurants = await Restaurant.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).select('-menu');

    res.status(200).json({ success: true, data: restaurants });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get single restaurant with full menu
 * @route   GET /api/v1/restaurants/:id
 * @access  Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `restaurant:${id}`;

    const cachedRestaurant = await cacheGet(cacheKey);
    if (cachedRestaurant) {
      return res.status(200).json({ success: true, source: 'cache', data: JSON.parse(cachedRestaurant) });
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      res.status(404);
      throw new Error('Restaurant not found');
    }

    await cacheSet(cacheKey, 600, JSON.stringify(restaurant));
    res.status(200).json({ success: true, source: 'database', data: restaurant });
  } catch (error) {
    next(error);
  }
});

export default router;
