const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['booking', 'fine', 'overstay', 'payment', 'incident', 'system'],
      default: 'system',
    },
    isRead: { type: Boolean, default: false },
    relatedId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
