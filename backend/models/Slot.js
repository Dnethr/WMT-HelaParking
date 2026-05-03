const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    slotNumber: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ['Car', 'Bike', 'EV', 'Disabled'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Available', 'Reserved', 'Occupied', 'Out-of-Service'],
      default: 'Available',
    },
    floor: { type: String, required: true },
    zone: { type: String, enum: ['A', 'B', 'C'], required: true },
    isDisabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Slot', slotSchema);
