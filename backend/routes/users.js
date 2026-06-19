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

/**
 * @desc    Get user addresses
 * @route   GET /api/v1/users/addresses
 * @access  Private
 */
router.get('/addresses', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.dbUser._id);
    res.status(200).json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Add a new address
 * @route   POST /api/v1/users/addresses
 * @access  Private
 */
router.post('/addresses', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.dbUser._id);
    const newAddress = req.body;
    
    if (newAddress.isDefault || user.addresses.length === 0) {
      newAddress.isDefault = true;
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    user.addresses.push(newAddress);
    await user.save();
    
    res.status(201).json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Update an address
 * @route   PATCH /api/v1/users/addresses/:addressId
 * @access  Private
 */
router.patch('/addresses/:addressId', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.dbUser._id);
    const address = user.addresses.id(req.params.addressId);
    
    if (!address) {
      res.status(404);
      throw new Error('Address not found');
    }
    
    Object.assign(address, req.body);
    
    if (req.body.isDefault) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== req.params.addressId) {
          addr.isDefault = false;
        }
      });
    }

    await user.save();
    res.status(200).json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Delete an address
 * @route   DELETE /api/v1/users/addresses/:addressId
 * @access  Private
 */
router.delete('/addresses/:addressId', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.dbUser._id);
    user.addresses.pull({ _id: req.params.addressId });
    
    if (user.addresses.length > 0 && !user.addresses.some(addr => addr.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.status(200).json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Set default address
 * @route   PATCH /api/v1/users/addresses/:addressId/default
 * @access  Private
 */
router.patch('/addresses/:addressId/default', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.dbUser._id);
    
    let found = false;
    user.addresses.forEach(addr => {
      if (addr._id.toString() === req.params.addressId) {
        addr.isDefault = true;
        found = true;
      } else {
        addr.isDefault = false;
      }
    });

    if (!found) {
      res.status(404);
      throw new Error('Address not found');
    }

    await user.save();
    res.status(200).json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
});

export default router;
