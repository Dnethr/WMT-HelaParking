const Notification = require('../models/Notification');
const PushToken = require('../models/PushToken');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');

// GET /api/notifications/my
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error('GetMyNotifications error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    res.status(200).json({ notification });
  } catch (error) {
    console.error('MarkAsRead error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('MarkAllAsRead error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// POST /api/notifications/broadcast
exports.broadcast = async (req, res) => {
  try {
    const { message, userId, type } = req.body;
    if (!message) return res.status(400).json({ message: 'message is required.' });

    if (userId) {
      await sendNotification(userId, message, type || 'system');
      return res.status(200).json({ message: 'Notification sent to user.' });
    }

    // Send to all drivers
    const drivers = await User.find({ role: 'driver' }).select('_id').lean();
    for (const driver of drivers) {
      await sendNotification(driver._id, message, type || 'system');
    }
    res.status(200).json({ message: `Notification broadcast to ${drivers.length} drivers.` });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// POST /api/notifications/push-token
exports.registerPushToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'token is required.' });

    await PushToken.findOneAndUpdate(
      { userId: req.user._id },
      { token },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: 'Push token registered.' });
  } catch (error) {
    console.error('RegisterPushToken error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};
