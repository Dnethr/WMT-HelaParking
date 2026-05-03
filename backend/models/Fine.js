const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    reason: { type: String, default: 'Overstay' },
    overstayMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Fine', fineSchema);
