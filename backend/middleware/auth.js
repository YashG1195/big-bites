import admin from '../config/firebaseAdmin.js';
import User from '../models/User.js';

export const verifyToken = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    // If we are using mock frontend token "mock-jwt-token-xyz-987", we can bypass this for dev testing:
    if (token === 'mock-jwt-token-xyz-987') {
      req.user = { uid: 'mock-uid-123', phone: '+911234567890' };
      // Try to find mock user or create one
      let user = await User.findOne({ phone: '+911234567890' });
      if (!user) {
        user = await User.create({ phone: '+911234567890', name: 'Mock User' });
      }
      req.dbUser = user;
      return next();
    }

    // Real Firebase token verification
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // contains uid, phone_number, etc.

    // Fetch user from DB based on phone number or UID
    // Assuming we save the phone number in our DB when they verify OTP on the client
    const user = await User.findOne({ phone: decodedToken.phone_number });
    req.dbUser = user;

    next();
  } catch (error) {
    console.error('Token Verification Error:', error.message);
    res.status(401).json({ success: false, message: 'Not authorized, token failed verification' });
  }
};
