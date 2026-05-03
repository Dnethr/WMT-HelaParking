const Notification = require('../models/Notification');
const PushToken = require('../models/PushToken');
const socketService = require('./socketService');

/**
 * Create an in-app notification and send an Expo push notification if a token exists.
 * Called by booking, gate, fine, payment, and incident controllers.
 * @param {string} userId - The user's MongoDB ObjectId
 * @param {string} message - Notification message text
 * @param {string} type - One of: booking, fine, overstay, payment, incident, system
 * @param {string|null} relatedId - Optional related document ID
 */
async function sendNotification(userId, message, type, relatedId = null) {
  await Notification.create({
    userId,
    message,
    type,
    isRead: false,
    relatedId,
  });

  const io = socketService.getIo();
  if (io) {
    io.emit(`notification:${userId}`, { message, type, relatedId });
  }

  const tokenDoc = await PushToken.findOne({ userId });
  if (!tokenDoc) return;

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: tokenDoc.token,
        title: 'HelaParking',
        body: message,
        data: { type, relatedId },
      }),
    });
  } catch (error) {
    console.error('Push notification error:', error.message);
  }
}

module.exports = { sendNotification };
