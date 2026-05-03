const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phoneNumber: { type: String, default: '' },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['driver', 'admin', 'superadmin'],
      default: 'driver',
    },
    vehicleNumber: { type: String, default: '' },
    vehicleType: {
      type: String,
      enum: ['Car', 'Bike', 'EV', 'Disabled'],
      default: 'Car',
    },
    isBanned: { type: Boolean, default: false },
    vehicles: [
      {
        vehicleNumber: { type: String, required: true },
        vehicleType: {
          type: String,
          enum: ['Car', 'Bike', 'EV', 'Disabled'],
          default: 'Car',
        },
      },
    ],
    resetTokenHash: { type: String },
    resetTokenExpiry: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
