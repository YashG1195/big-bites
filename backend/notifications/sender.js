import admin from '../config/firebaseAdmin.js';

/**
 * Send a push notification to a single device.
 * @param {string} fcmToken - The device's FCM registration token.
 * @param {string} title    - Notification title.
 * @param {string} body     - Notification body text.
 * @param {object} data     - Optional key-value payload (must be strings).
 * @returns {Promise<string|null>} The message ID on success, null on failure.
 */
export const sendToDevice = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) {
    console.warn('[FCM] sendToDevice called with no fcmToken, skipping.');
    return null;
  }

  // Ensure all data values are strings (FCM requirement)
  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  );

  const message = {
    token: fcmToken,
    notification: { title, body },
    data: stringData,
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'big_bites_orders',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  try {
    const messageId = await admin.messaging().send(message);
    console.log(`[FCM] Notification sent to ${fcmToken.slice(0, 20)}... | ID: ${messageId}`);
    return messageId;
  } catch (error) {
    // Log but never crash the order flow due to a push notification failure
    console.error('[FCM] Error sending notification:', error.message);
    return null;
  }
};

/**
 * Convenience helpers that map order status to user-friendly messages.
 */
export const notifyOrderAccepted = (fcmToken, orderId) =>
  sendToDevice(
    fcmToken,
    '🎉 Order Accepted!',
    'Your order has been accepted and is being prepared.',
    { screen: 'OrderTracking', orderId }
  );

export const notifyRiderOnTheWay = (fcmToken, orderId) =>
  sendToDevice(
    fcmToken,
    '🛵 Rider On the Way!',
    'Your rider has picked up your order and is heading to you.',
    { screen: 'OrderTracking', orderId }
  );

export const notifyOrderDelivered = (fcmToken, orderId) =>
  sendToDevice(
    fcmToken,
    '✅ Order Delivered!',
    'Your Big Bites order has been delivered. Enjoy your meal!',
    { screen: 'OrderTracking', orderId }
  );
