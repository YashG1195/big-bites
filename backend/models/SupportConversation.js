import mongoose from 'mongoose';

const supportConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system', 'tool'], required: true },
    content: { type: mongoose.Schema.Types.Mixed }, 
    createdAt: { type: Date, default: Date.now }
  }],
  resolvedBy: {
    type: String,
    enum: ['ai', 'human']
  }
}, { timestamps: true });

const SupportConversation = mongoose.model('SupportConversation', supportConversationSchema);
export default SupportConversation;
