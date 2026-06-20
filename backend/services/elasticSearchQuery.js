import elasticClient from './elasticClient.js';
import Restaurant from '../models/Restaurant.js';

export async function buildAndExecuteQuery(filters, userLocation) {
  try {
    const must = [];
    const filter = [];

    // 1. Text Search (multi_match) on keywords
    if (filters.keywords && filters.keywords.length > 0) {
      const keywordString = filters.keywords.join(' ');
      must.push({
        multi_match: {
          query: keywordString,
          fields: ['name^3', 'description^2', 'tags', 'restaurantName^2'],
          fuzziness: 'AUTO'
        }
      });
    }

    // 2. Exact Match Filters
    if (filters.cuisine && filters.cuisine.length > 0) {
      must.push({
        multi_match: {
          query: filters.cuisine.join(' '),
          fields: ['category', 'tags', 'description'],
          fuzziness: 'AUTO'
        }
      });
    }

    if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
      filter.push({
        range: {
          price: { lte: filters.maxPrice }
        }
      });
    }

    if (filters.isVeg !== undefined) {
      filter.push({
        term: {
          isVeg: filters.isVeg
        }
      });
    }

    if (filters.spiceLevel) {
      filter.push({
        term: {
          spiceLevel: filters.spiceLevel
        }
      });
    }

    const body = {
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter: filter
        }
      },
      size: 50 // Fetch more initially so we have enough after joining with open restaurants
    };

    const result = await elasticClient.search({
      index: 'dishes',
      body
    });

    const hits = result.hits.hits.map(hit => ({
      _id: hit._id,
      ...hit._source,
      score: hit._score
    }));

    const restaurantIds = [...new Set(hits.map(h => h.restaurantId))];
    
    // Post-processing: Join parent restaurant info & apply rating/open filters natively in MongoDB
    const restaurantFilter = { _id: { $in: restaurantIds }, isOpen: true };
    if (filters.minRating) {
      restaurantFilter.rating = { $gte: filters.minRating };
    }

    const restaurants = await Restaurant.find(restaurantFilter).lean();
    const restaurantMap = {};
    restaurants.forEach(r => { restaurantMap[r._id.toString()] = r; });

    let finalDishes = hits
      .filter(dish => restaurantMap[dish.restaurantId])
      .map(dish => {
        const r = restaurantMap[dish.restaurantId];
        return {
          ...dish,
          restaurant: {
            id: r._id,
            name: r.name,
            rating: r.rating,
            deliveryTime: r.deliveryTime,
            isOpen: r.isOpen,
            location: r.location
          }
        };
      });

    // Custom scoring: Base relevance + rating boost
    finalDishes.sort((a, b) => {
      const scoreA = a.score + (a.restaurant.rating || 0);
      const scoreB = b.score + (b.restaurant.rating || 0);
      return scoreB - scoreA;
    });

    return finalDishes.slice(0, 20);

  } catch (error) {
    console.error('Elasticsearch Query Error:', error);
    throw error;
  }
}

export async function fallbackSearch(query) {
  try {
    const result = await elasticClient.search({
      index: 'dishes',
      body: {
        query: {
          multi_match: {
            query: query,
            fields: ['name^3', 'description', 'tags', 'restaurantName'],
            fuzziness: 'AUTO'
          }
        },
        size: 20
      }
    });

    const hits = result.hits.hits.map(hit => ({
      _id: hit._id,
      ...hit._source
    }));

    // Basic join for fallback too
    const restaurantIds = [...new Set(hits.map(h => h.restaurantId))];
    const restaurants = await Restaurant.find({ _id: { $in: restaurantIds }, isOpen: true }).lean();
    const restaurantMap = {};
    restaurants.forEach(r => { restaurantMap[r._id.toString()] = r; });

    return hits
      .filter(dish => restaurantMap[dish.restaurantId])
      .map(dish => {
        const r = restaurantMap[dish.restaurantId];
        return {
          ...dish,
          restaurant: {
            id: r._id,
            name: r.name,
            rating: r.rating,
            deliveryTime: r.deliveryTime,
            isOpen: r.isOpen
          }
        };
      });
  } catch (err) {
    console.error('Fallback search error:', err);
    return [];
  }
}
