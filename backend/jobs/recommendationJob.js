import cron from 'node-cron';
import Order from '../models/Order.js';
import { generateRecommendations } from '../services/recommendationEngine.js';

export function startRecommendationJob() {
  // Run every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('Starting scheduled recommendation generation...');
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // We handle $or inside distinct just to be safe, though Mongoose distinct may not support $or directly at the root.
      // Alternatively, just query users who have orders >= 7 days ago.
      // Order schema usually defines `user: { type: ObjectId }`, let's just use `user`.
      const activeUserIds = await Order.distinct('user', { createdAt: { $gte: sevenDaysAgo } });
      
      console.log(`Found ${activeUserIds.length} active users for recommendations job.`);

      for (let i = 0; i < activeUserIds.length; i++) {
        const userId = activeUserIds[i];
        if (!userId) continue;

        try {
          await generateRecommendations(userId);
        } catch (err) {
          console.error(`Failed to generate recommendation for user ${userId}`, err);
        }
        
        // Delay between calls to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log('Finished scheduled recommendation generation.');
    } catch (error) {
      console.error('Error in recommendation job:', error);
    }
  });
}
