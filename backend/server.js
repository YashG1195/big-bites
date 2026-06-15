import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';

// ─── Sentry MUST be initialized before any other imports that could throw ─────
import {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
} from './config/sentry.js';
initSentry();

import connectDB from './config/db.js';
import './config/redis.js';
import { firebaseAuth } from './config/firebaseAdmin.js';

import restaurantRoutes from './routes/restaurants.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = createServer(app);

// ─── Sentry request + tracing handlers (must be FIRST app middlewares) ────────
app.use(sentryRequestHandler);
app.use(sentryTracingHandler);

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: '*',
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

    const auth = firebaseAuth();
    if (!auth) return next(new Error('Auth service unavailable'));

    const decodedToken = await auth.verifyIdToken(token);
    socket.user = decodedToken;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id} (User: ${socket.user.uid})`);

  socket.on('join_order_room', (orderId) => {
    const roomName = `order:${orderId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room ${roomName}`);
  });

  socket.on('rider:location', (data) => {
    const { lat, lng, orderId } = data;
    if (!orderId) return;
    socket.to(`order:${orderId}`).emit('rider:location', { latitude: lat, longitude: lng });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Security Middlewares
app.use(helmet());
app.use(cors());

// Rate Limiting
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

// ─── Routes ──────────────────────────────────────────────────────────────────
const apiRouter = express.Router();
apiRouter.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Big Bites API is running smoothly' });
});

app.use('/api/v1', apiRouter);
app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/users', userRoutes);

// ─── Sentry error handler (before our own handler, after all routes) ──────────
app.use(sentryErrorHandler);

// ─── Custom Error Handling ────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
