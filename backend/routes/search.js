import express from 'express';
import crypto from 'crypto';
import redisClient from '../config/redis.js';
import { parseSearchIntent } from '../services/searchIntentParser.js';
import { buildAndExecuteQuery, fallbackSearch } from '../services/elasticSearchQuery.js';
import Restaurant from '../models/Restaurant.js';
import elasticClient from '../services/elasticClient.js';

const router = express.Router();

router.get('/natural', async (req, res, next) => {
  try {
    const { q, lat, lng } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const queryStr = q.trim();

    if (queryStr.length < 5) {
      const results = await fallbackSearch(queryStr);
      return res.status(200).json({
        success: true,
        data: {
          filters: { keywords: [queryStr] },
          results
        }
      });
    }

    const userLocation = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;

    const locationKey = userLocation ? `${Math.round(userLocation.lat * 100)},${Math.round(userLocation.lng * 100)}` : 'noloc';
    const cacheKey = `search:${crypto.createHash('md5').update(queryStr.toLowerCase()).digest('hex')}:${locationKey}`;
    
    const cachedResponse = await redisClient.get(cacheKey);
    if (cachedResponse) {
      return res.status(200).json(JSON.parse(cachedResponse));
    }

    let filters;
    try {
      filters = await parseSearchIntent(queryStr, userLocation);
    } catch (err) {
      const results = await fallbackSearch(queryStr);
      return res.status(200).json({
        success: true,
        data: { filters: { keywords: [queryStr] }, results }
      });
    }

    const results = await buildAndExecuteQuery(filters, userLocation);

    const responseData = {
      success: true,
      data: {
        filters,
        results
      }
    };

    await redisClient.setex(cacheKey, 120, JSON.stringify(responseData));

    res.status(200).json(responseData);

  } catch (error) {
    next(error);
  }
});

// Temporary bulk sync endpoint
router.post('/sync-all', async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find();
    let count = 0;
    
    for (const doc of restaurants) {
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
        count++;
      } catch (err) {
        console.error('Error syncing restaurant', doc._id, err);
      }
    }

    res.status(200).json({ success: true, message: `Synced ${count} restaurants and their dishes` });
  } catch (error) {
    next(error);
  }
});

export default router;
