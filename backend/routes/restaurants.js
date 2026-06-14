import express from 'express';
import Restaurant from '../models/Restaurant.js';
import redisClient from '../config/redis.js';

const router = express.Router();

/**
 * @desc    Get all restaurants
 * @route   GET /api/v1/restaurants
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    // 1. Check Redis Cache
    const cachedRestaurants = await redisClient.get('restaurants:list');
    
    if (cachedRestaurants) {
      return res.status(200).json({
        success: true,
        source: 'cache',
        data: JSON.parse(cachedRestaurants),
      });
    }

    // 2. Fallback to MongoDB
    // We only select basic info for the list view, excluding the full menu for performance
    const restaurants = await Restaurant.find({}).select('-menu');

    // 3. Set Cache (TTL: 5 minutes = 300 seconds)
    await redisClient.setex('restaurants:list', 300, JSON.stringify(restaurants));

    res.status(200).json({
      success: true,
      source: 'database',
      data: restaurants,
    });
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

    // Use MongoDB Text Search index (no cache for search)
    const restaurants = await Restaurant.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .select('-menu');

    res.status(200).json({
      success: true,
      data: restaurants,
    });
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

    // 1. Check Cache
    const cachedRestaurant = await redisClient.get(cacheKey);
    
    if (cachedRestaurant) {
      return res.status(200).json({
        success: true,
        source: 'cache',
        data: JSON.parse(cachedRestaurant),
      });
    }

    // 2. Fetch from DB
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      res.status(404);
      throw new Error('Restaurant not found');
    }

    // 3. Set Cache (TTL: 10 minutes = 600 seconds)
    await redisClient.setex(cacheKey, 600, JSON.stringify(restaurant));

    res.status(200).json({
      success: true,
      source: 'database',
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
