import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
dotenv.config();

const elasticClient = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
});

export const initElasticIndices = async () => {
  try {
    const restaurantsExists = await elasticClient.indices.exists({ index: 'restaurants' });
    if (!restaurantsExists) {
      await elasticClient.indices.create({
        index: 'restaurants',
        body: {
          mappings: {
            properties: {
              name: { type: 'text' },
              cuisine: { type: 'keyword' },
              rating: { type: 'float' },
              deliveryTime: { type: 'integer' },
              isOpen: { type: 'boolean' },
              location: { type: 'geo_point' } // Need geo_point for geo_distance queries
            }
          }
        }
      });
      console.log('Elasticsearch index "restaurants" created.');
    }

    const dishesExists = await elasticClient.indices.exists({ index: 'dishes' });
    if (!dishesExists) {
      await elasticClient.indices.create({
        index: 'dishes',
        body: {
          mappings: {
            properties: {
              name: { type: 'text' },
              description: { type: 'text' },
              price: { type: 'float' },
              category: { type: 'keyword' },
              isVeg: { type: 'boolean' },
              spiceLevel: { type: 'keyword' },
              tags: { type: 'keyword' },
              restaurantId: { type: 'keyword' },
              restaurantName: { type: 'text' }
            }
          }
        }
      });
      console.log('Elasticsearch index "dishes" created.');
    }
  } catch (error) {
    console.error('Error initializing Elasticsearch indices:', error);
  }
};

export default elasticClient;
