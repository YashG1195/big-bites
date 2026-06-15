import express from 'express';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @desc    Save / refresh the FCM device token for the logged-in user
 * @route   POST /api/v1/users/fcm-token
 * @access  Private
 */
router.post('/fcm-token', verifyToken, async (req, res, next) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      res.status(400);
      throw new Error('fcmToken is required');
    }

    const user = await User.findByIdAndUpdate(
      req.dbUser._id,
      { fcmToken },
      { new: true, select: '-addresses' }
    );

    res.status(200).json({
      success: true,
      message: 'FCM token updated',
      data: { fcmToken: user.fcmToken },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get logged-in user profile
 * @route   GET /api/v1/users/me
 * @access  Private
 */
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.dbUser._id).select('-fcmToken');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
