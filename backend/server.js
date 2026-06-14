import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import admin from 'firebase-admin';

import connectDB from './config/db.js';
import './config/redis.js'; // Initialize Redis
import './config/firebaseAdmin.js'; // Initialize Firebase Admin

import restaurantRoutes from './routes/restaurants.js';
import orderRoutes from './routes/orders.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = createServer(app);

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: '*', // In production, restrict to your app's domain
    methods: ['GET', 'POST', 'PATCH'],
  },
});

// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    if (token === 'mock-jwt-token-xyz-987') {
      socket.user = { uid: 'mock-uid-123', phone: '+911234567890' };
      return next();
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    socket.user = decodedToken;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id} (User: ${socket.user.uid})`);

  // Join a specific order room
  socket.on('join_order_room', (orderId) => {
    const roomName = `order:${orderId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room ${roomName}`);
  });

  // Rider sends location update
  socket.on('rider:location', (data) => {
    const { lat, lng, orderId } = data;
    if (!orderId) return;
    
    // Broadcast to everyone in the order room EXCEPT the sender
    socket.to(`order:${orderId}`).emit('rider:location', { latitude: lat, longitude: lng });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Attach io to req object so routes can access it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Security Middlewares
app.use(helmet());
app.use(cors());

// Rate Limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});
app.use('/api', limiter);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ROUTES ---
const apiRouter = express.Router();

apiRouter.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Big Bites API is running smoothly' });
});

// Prefix all routes with /api/v1
app.use('/api/v1', apiRouter);
app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/orders', orderRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
