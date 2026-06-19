import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  name: String,
  price: Number,
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: ['Order Placed', 'Accepted', 'Being Prepared', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Order Placed',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Pending',
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    razorpayOrderId: {
      type: String,
    },
    refunds: [{
      amount: Number,
      reason: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      initiatedBy: {
        type: String,
        enum: ['ai', 'human', 'user']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
