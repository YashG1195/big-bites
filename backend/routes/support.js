import express from 'express';
import rateLimit from 'express-rate-limit';
import { verifyToken } from '../middleware/auth.js';
import { handleSupportMessage } from '../services/supportAgent.js';
import SupportConversation from '../models/SupportConversation.js';

const router = express.Router();

const supportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many support requests, please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/chat', verifyToken, supportLimiter, async (req, res, next) => {
  try {
    const { orderId, message, conversationHistory = [] } = req.body;
    const userId = req.dbUser._id;

    // The frontend sends the entire history including the latest message, so we just pass it to the agent
    const { reply, action, updatedHistory } = await handleSupportMessage(userId, orderId, conversationHistory);

    let conversation;
    if (orderId) {
      conversation = await SupportConversation.findOne({ userId, orderId }).sort({ updatedAt: -1 });
    } else {
      conversation = await SupportConversation.findOne({ userId, orderId: { $exists: false } }).sort({ updatedAt: -1 });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    if (conversation && conversation.updatedAt > oneHourAgo) {
      conversation.messages = updatedHistory;
      if (action === 'escalated' || action === 'escalated_due_to_abuse') {
        conversation.resolvedBy = 'human';
      }
      await conversation.save();
    } else {
      await SupportConversation.create({
        userId,
        orderId: orderId || null,
        messages: updatedHistory,
        resolvedBy: (action === 'escalated' || action === 'escalated_due_to_abuse') ? 'human' : 'ai'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        reply,
        action,
        updatedHistory
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
