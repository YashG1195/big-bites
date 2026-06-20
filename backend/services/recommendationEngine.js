import Anthropic from '@anthropic-ai/sdk';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import UserRecommendations from '../models/UserRecommendations.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy_key',
});

const RANK_TOOL = {
  name: 'rank_recommendations',
  description: 'Ranks the candidate dishes for the user and provides a personalized reason.',
  input_schema: {
    type: 'object',
    properties: {
      rankedDishIds: {
        type: 'array',
        description: 'Array of up to 10 dish IDs from the candidate pool, ordered by relevance.',
        items: {
          type: 'object',
          properties: {
            dishId: { type: 'string' },
            reason: { type: 'string', description: 'Short personalized reason, e.g. "You order this often on Fridays" or "A healthy choice for lunch"' }
          },
          required: ['dishId', 'reason']
        }
      }
    },
    required: ['rankedDishIds']
  }
};

export async function generateRecommendations(userId) {
  try {
    const user = await User.findById(userId).populate('favouriteRestaurants').lean();
    if (!user) throw new Error('User not found');

    const recentOrders = await Order.find({ $or: [{ user: userId }, { userId: userId }] })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('restaurant')
      .lean();

    const orderHistorySummary = recentOrders.map(o => ({
      date: o.createdAt,
      restaurant: o.restaurant?.name,
      items: o.items ? o.items.map(i => i.name) : [],
      totalAmount: o.totalAmount
    }));

    const openRestaurants = await Restaurant.find({ isOpen: true }).limit(20).lean();
    let candidates = [];
    openRestaurants.forEach(r => {
      if (r.menu && Array.isArray(r.menu)) {
        r.menu.forEach(item => {
          if (candidates.length < 50) {
            candidates.push({
              dishId: item._id.toString(),
              name: item.name,
              restaurant: r.name,
              cuisine: r.cuisine,
              price: item.price,
              isVeg: item.isVeg,
              rating: r.rating
            });
          }
        });
      }
    });

    if (candidates.length === 0) return null;

    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const systemPrompt = `You are a food recommendation engine. 
Rank the provided candidate dishes based on the user's order history, affinities, and the current context.
Current Time: ${currentTime}
Current Day: ${currentDay}
Instructions:
- Pick the top 5 to 10 most relevant dishes from the Candidate Pool.
- Consider time of day (e.g. coffee for breakfast, comfort food for dinner).
- Consider repeat order habits.
- Provide a short, highly personalized reason for each pick (e.g., "Since you love spicy food", "A great lunch option", "You order this often on Fridays").
- You MUST ONLY pick IDs from the candidate pool provided. Do not hallucinate IDs.`;

    const userMessage = `
User Order History:
${JSON.stringify(orderHistorySummary, null, 2)}

Candidate Pool:
${JSON.stringify(candidates, null, 2)}
`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 600,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ],
      tools: [RANK_TOOL],
      tool_choice: { type: 'tool', name: 'rank_recommendations' }
    });

    console.log(`[Tokens] Recommendation for ${userId}: In=${response.usage.input_tokens}, Out=${response.usage.output_tokens}`);

    const toolBlock = response.content.find(block => block.type === 'tool_use' && block.name === 'rank_recommendations');
    
    if (!toolBlock || !toolBlock.input || !toolBlock.input.rankedDishIds) {
      console.warn('Claude did not return proper ranked recommendations.');
      return null;
    }

    const { rankedDishIds } = toolBlock.input;

    const candidateIds = new Set(candidates.map(c => c.dishId));
    const validRecommendations = rankedDishIds.filter(item => candidateIds.has(item.dishId));

    if (validRecommendations.length === 0) return null;

    const savedRecs = await UserRecommendations.findOneAndUpdate(
      { userId },
      {
        userId,
        dishes: validRecommendations,
        generatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    return savedRecs;

  } catch (error) {
    console.error(`Error generating recommendations for user ${userId}:`, error);
    return null;
  }
}
