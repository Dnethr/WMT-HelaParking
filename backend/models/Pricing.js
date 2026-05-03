const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      enum: ['Car', 'Bike', 'EV', 'Disabled'],
      required: true,
    },
    zone: {
      type: String,
      enum: ['A', 'B', 'C'],
      required: true,
    },
    ratePerHour: { type: Number, required: true },
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate pricing entries
pricingSchema.index({ vehicleType: 1, zone: 1 }, { unique: true });

module.exports = mongoose.model('Pricing', pricingSchema);
