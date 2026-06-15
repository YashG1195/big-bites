import { firebaseAuth } from '../config/firebaseAdmin.js';
import User from '../models/User.js';
import { setSentryUser } from '../config/sentry.js';

export const verifyToken = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    // Dev mock token bypass
    if (token === 'mock-jwt-token-xyz-987') {
      req.user = { uid: 'mock-uid-123', phone: '+911234567890' };
      let user = await User.findOne({ phone: '+911234567890' });
      if (!user) {
        user = await User.create({ phone: '+911234567890', name: 'Mock User' });
      }
      req.dbUser = user;
      setSentryUser(user);
      return next();
    }

    // Real Firebase token verification
    const auth = firebaseAuth();
    if (!auth) {
      return res.status(503).json({ success: false, message: 'Auth service unavailable (dummy Firebase credentials in dev)' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;

    const user = await User.findOne({ phone: decodedToken.phone_number });
    req.dbUser = user;
    setSentryUser(user);

    next();
  } catch (error) {
    console.error('Token Verification Error:', error.message);
    res.status(401).json({ success: false, message: 'Not authorized, token failed verification' });
  }
};
