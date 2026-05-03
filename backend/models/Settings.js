const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    maxVehiclesPerUser: { type: Number, default: 5 },
    maxActiveVehiclesPerUser: { type: Number, default: 1 },
    safeTimeDuration: { type: Number, default: 10 },
    maxBookingHours: { type: Number, default: 24 },
    maxEarlyCheckInMinutes: { type: Number, default: 5 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
