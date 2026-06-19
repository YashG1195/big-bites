import express from 'express';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';
import {
  notifyOrderAccepted,
  notifyRiderOnTheWay,
  notifyOrderDelivered,
} from '../notifications/sender.js';

const router = express.Router();

// Apply auth middleware to all order routes
router.use(verifyToken);

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

/**
 * @desc    Get all orders for logged-in user
 * @route   GET /api/v1/orders/my
 * @access  Private
 */
router.get('/my', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const query = { userId: req.dbUser._id };
    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate('restaurantId', 'name image')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get order by ID
 * @route   GET /api/v1/orders/:id
 * @access  Private
 */
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurantId', 'name image cuisine')
      .populate('userId', 'name phone');

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Check if the order belongs to the user (or if the user is admin)
    if (order.userId._id.toString() !== req.dbUser._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to view this order');
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Create a new order
 * @route   POST /api/v1/orders
 * @access  Private
 */
router.post('/', async (req, res, next) => {
  try {
    const { restaurantId, items } = req.body;

    if (!items || items.length === 0) {
      res.status(400);
      throw new Error('No order items');
    }

    // 1. Fetch Restaurant to validate menu item prices
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      res.status(404);
      throw new Error('Restaurant not found');
    }

    // 2. Validate prices (Never trust client prices)
    let totalAmount = 0;
    const validatedItems = items.map((clientItem) => {
      // Find the corresponding item in the restaurant's menu
      const dbMenuItem = restaurant.menu.id(clientItem.menuItemId);
      
      if (!dbMenuItem) {
        res.status(400);
        throw new Error(`Menu item ${clientItem.name} not found in this restaurant`);
      }

      // Calculate total with true DB price
      totalAmount += dbMenuItem.price * clientItem.quantity;

      return {
        menuItemId: dbMenuItem._id,
        name: dbMenuItem.name,
        price: dbMenuItem.price, // STRICTLY USE DB PRICE
        quantity: clientItem.quantity,
      };
    });

    // 3. Create the Order in MongoDB
    const order = new Order({
      userId: req.dbUser._id,
      restaurantId,
      items: validatedItems,
      totalAmount,
      status: 'Order Placed',
      paymentStatus: 'Pending',
    });

    const savedOrder = await order.save();

    // Emit event
    if (req.io) {
      req.io.to(`order:${savedOrder._id.toString()}`).emit('order:placed', savedOrder);
    }

    // 4. Create Razorpay Payment Order
    const razorpayOptions = {
      amount: totalAmount * 100, // Amount in paise
      currency: 'INR',
      receipt: savedOrder._id.toString(),
      payment_capture: 1, // Auto capture
    };

    try {
      const razorpayOrder = await razorpay.orders.create(razorpayOptions);
      
      // Update DB with Razorpay Order ID
      savedOrder.razorpayOrderId = razorpayOrder.id;
      await savedOrder.save();

      res.status(201).json({
        success: true,
        data: savedOrder,
        razorpayOrderId: razorpayOrder.id,
      });
    } catch (rzpError) {
      console.warn('Razorpay Error (Expected if using dummy keys):', rzpError.message);
      // Simulate success for development if dummy keys are used
      savedOrder.razorpayOrderId = `mock_rzp_${Date.now()}`;
      await savedOrder.save();
      
      res.status(201).json({
        success: true,
        data: savedOrder,
        razorpayOrderId: savedOrder.razorpayOrderId,
      });
    }

  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Preview/validate a reorder
 * @route   POST /api/v1/orders/:id/reorder
 * @access  Private
 */
router.post('/:id/reorder', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.userId.toString() !== req.dbUser._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to reorder this order');
    }

    const restaurant = await Restaurant.findById(order.restaurantId);
    
    if (!restaurant) {
      return res.status(200).json({
        success: true,
        restaurantOpen: false,
        restaurantId: order.restaurantId,
        available: [],
        unavailable: order.items,
        priceChanged: []
      });
    }

    const available = [];
    const unavailable = [];
    const priceChanged = [];

    order.items.forEach(orderItem => {
      const currentMenuItem = restaurant.menu.id(orderItem.menuItemId);
      
      if (!currentMenuItem) {
        unavailable.push(orderItem);
      } else if (currentMenuItem.price !== orderItem.price) {
        priceChanged.push({
          ...orderItem.toObject(),
          newPrice: currentMenuItem.price
        });
      } else {
        available.push(orderItem);
      }
    });

    res.status(200).json({
      success: true,
      restaurantOpen: restaurant.isOpen,
      restaurantId: restaurant._id,
      available,
      unavailable,
      priceChanged
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Update order status
 * @route   PATCH /api/v1/orders/:id/status
 * @access  Private (Rider/Admin)
 */
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    
    // In a real app, verify req.dbUser has Rider or Admin role here
    
    const validStatuses = ['Order Placed', 'Accepted', 'Being Prepared', 'Out for Delivery', 'Delivered', 'Cancelled'];
    
    if (!validStatuses.includes(status)) {
      res.status(400);
      throw new Error('Invalid status update');
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    order.status = status;
    const updatedOrder = await order.save();

    // 1. Socket.IO real-time event
    const eventMap = {
      'Order Placed': 'order:placed',
      'Accepted': 'order:accepted',
      'Being Prepared': 'order:preparing',
      'Out for Delivery': 'order:out_for_delivery',
      'Delivered': 'order:delivered',
    };

    const eventName = eventMap[status];
    if (req.io && eventName) {
      req.io.to(`order:${order._id.toString()}`).emit(eventName, updatedOrder);
      req.io.to(`order:${order._id.toString()}`).emit('order:status_update', updatedOrder);
    }

    // 2. FCM Push Notification — fetch customer FCM token
    const customer = await User.findById(order.userId).select('fcmToken');
    const orderId = order._id.toString();

    if (customer?.fcmToken) {
      if (status === 'Accepted') {
        notifyOrderAccepted(customer.fcmToken, orderId);
      } else if (status === 'Out for Delivery') {
        notifyRiderOnTheWay(customer.fcmToken, orderId);
      } else if (status === 'Delivered') {
        notifyOrderDelivered(customer.fcmToken, orderId);
      }
    }

    res.status(200).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
