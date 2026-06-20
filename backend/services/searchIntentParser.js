import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy_key',
});

const EXTRACT_FILTERS_TOOL = {
  name: 'extract_search_filters',
  description: 'Extracts structured filters from a natural language food search query.',
  input_schema: {
    type: 'object',
    properties: {
      cuisine: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of cuisines mentioned (e.g. Italian, Chinese, Indian)'
      },
      maxPrice: {
        type: 'number',
        description: 'Maximum price if the user mentions a budget (e.g. under 150 -> 150)'
      },
      minRating: {
        type: 'number',
        description: 'Minimum rating if the user mentions quality (e.g. highly rated -> 4.0, 4 stars -> 4.0)'
      },
      isVeg: {
        type: 'boolean',
        description: 'True if user strictly wants vegetarian/vegan, false if they strictly want non-veg. Omit if not mentioned.'
      },
      spiceLevel: {
        type: 'string',
        enum: ['mild', 'medium', 'spicy'],
        description: 'Desired spice level if mentioned.'
      },
      mealType: {
        type: 'string',
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        description: 'Meal type if mentioned.'
      },
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: 'Any specific dish names, ingredients, or general keywords mentioned (e.g. "pizza", "biryani", "healthy").'
      }
    },
    required: ['keywords', 'cuisine']
  }
};

export async function parseSearchIntent(query, userLocation) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      system: `You are an AI assistant that parses natural language food search queries into structured JSON filters.
If the query is completely unrelated to food, restaurants, or delivery (e.g., "what is the weather"), return an empty structure where keywords just contains the literal query, so the system can gracefully fail or fallback.
Extract prices, ratings, veg/non-veg preferences, cuisines, and key dish names.`,
      messages: [
        { role: 'user', content: `Parse this search query: "${query}"` }
      ],
      tools: [EXTRACT_FILTERS_TOOL],
      tool_choice: { type: 'tool', name: 'extract_search_filters' }
    });

    const toolBlock = response.content.find(block => block.type === 'tool_use' && block.name === 'extract_search_filters');
    
    if (toolBlock && toolBlock.input) {
      return toolBlock.input;
    }

    return { keywords: [query], cuisine: [] };

  } catch (error) {
    console.error('Claude API Error in parseSearchIntent:', error);
    throw error;
  }
}
