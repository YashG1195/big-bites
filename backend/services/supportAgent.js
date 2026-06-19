import Anthropic from '@anthropic-ai/sdk';
import Order from '../models/Order.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy_key',
});

const TOOLS = [
  {
    name: 'check_order_status',
    description: 'Check the current real-time status of an order using the orderId from context.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'initiate_refund',
    description: 'Initiate a refund for a missing item or poor quality. Must only be used up to the total order amount.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Reason for the refund' },
        amount: { type: 'number', description: 'Amount to refund. Must not exceed order total.' }
      },
      required: ['reason', 'amount']
    }
  },
  {
    name: 'escalate_to_human',
    description: 'Escalate the conversation to a human agent.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Reason for escalation' }
      },
      required: ['reason']
    }
  }
];

export async function handleSupportMessage(userId, orderId, conversationHistory = []) {
  try {
    let contextData = {};
    let activeOrder = null;

    if (orderId) {
      activeOrder = await Order.findById(orderId).populate('restaurantId', 'name').lean();
      if (activeOrder) {
        contextData.activeOrder = {
          id: activeOrder._id,
          status: activeOrder.status,
          restaurant: activeOrder.restaurantId?.name,
          items: activeOrder.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
          totalAmount: activeOrder.totalAmount,
          paymentStatus: activeOrder.paymentStatus,
          createdAt: activeOrder.createdAt,
          refunds: activeOrder.refunds
        };
      }
    } else {
      const recentOrders = await Order.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('restaurantId', 'name')
        .lean();
      contextData.recentOrders = recentOrders.map(o => ({
        id: o._id,
        status: o.status,
        restaurant: o.restaurantId?.name,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt
      }));
    }

    const systemPrompt = `You are an AI customer support assistant for "Big Bites", a food delivery app.
Today's Date: ${new Date().toISOString()}
User Context: ${JSON.stringify(contextData, null, 2)}

Instructions:
1. Be highly empathetic, concise, and professional.
2. Only discuss Big Bites order issues (e.g., where is my order, missing items, refunds).
3. If the user asks about unrelated topics, politely redirect them back to order support.
4. You can use tools to check order status, initiate refunds, or escalate to a human.
5. If the user wants a refund and it's justified, use the initiate_refund tool. You can only refund up to the order's total amount.
6. If the user is very angry or requests a human, use the escalate_to_human tool.`;

    const messages = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    let response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: systemPrompt,
      tools: TOOLS,
      messages: messages
    });

    let finalAction = null;

    if (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find(block => block.type === 'tool_use');
      const toolName = toolUseBlock.name;
      const toolInput = toolUseBlock.input;
      const toolId = toolUseBlock.id;

      let toolResultContent = "";

      if (toolName === 'check_order_status') {
        if (!activeOrder) {
          toolResultContent = "Error: No active order context provided.";
        } else {
          const freshOrder = await Order.findById(activeOrder._id);
          toolResultContent = `Current status: ${freshOrder.status}`;
        }
      } 
      else if (toolName === 'initiate_refund') {
        if (!activeOrder) {
          toolResultContent = "Error: Cannot initiate refund without a specific order ID.";
        } else {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const recentRefundsCount = await Order.aggregate([
            { $match: { userId: userId } },
            { $unwind: "$refunds" },
            { $match: { "refunds.createdAt": { $gte: thirtyDaysAgo } } },
            { $count: "total" }
          ]);

          const count = recentRefundsCount.length > 0 ? recentRefundsCount[0].total : 0;

          if (count >= 3) {
            toolResultContent = "Error: User has exceeded the allowed number of refunds in 30 days. Must escalate to human.";
            finalAction = "escalated_due_to_abuse";
          } else if (toolInput.amount > activeOrder.totalAmount) {
            toolResultContent = `Error: Requested refund amount (${toolInput.amount}) exceeds order total (${activeOrder.totalAmount}).`;
          } else {
            await Order.findByIdAndUpdate(activeOrder._id, {
              $push: {
                refunds: {
                  amount: toolInput.amount,
                  reason: toolInput.reason,
                  status: 'pending',
                  initiatedBy: 'ai'
                }
              }
            });
            toolResultContent = `Success: Refund of ${toolInput.amount} initiated and is pending human review.`;
            finalAction = "refund_initiated";
          }
        }
      }
      else if (toolName === 'escalate_to_human') {
        toolResultContent = "Success: Conversation escalated to human.";
        finalAction = "escalated";
      }

      messages.push({
        role: "assistant",
        content: response.content
      });

      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolId,
            content: toolResultContent
          }
        ]
      });

      response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        system: systemPrompt,
        tools: TOOLS,
        messages: messages
      });
    }

    const replyText = response.content.find(block => block.type === 'text')?.text || "";

    return {
      reply: replyText,
      action: finalAction,
      updatedHistory: messages.concat([{
        role: "assistant",
        content: response.content
      }])
    };

  } catch (error) {
    console.error("Claude API Error:", error);
    throw error;
  }
}
