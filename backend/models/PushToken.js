const mongoose = require('mongoose');

const pushTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    token: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PushToken', pushTokenSchema);
