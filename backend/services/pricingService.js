const Pricing = require('../models/Pricing');

const DEFAULT_RATES = {
  Car: 150,
  Bike: 50,
  EV: 200,
  Disabled: 0
};

/**
 * Calculate parking cost based on vehicle type, zone, and duration.
 * Uses fallback standard defaults if no pricing config exists for the combination.
 * @param {string} vehicleType - Car, Bike, EV, or Disabled
 * @param {string} zone - A, B, or C
 * @param {number} durationHours - Duration in hours (can be fractional)
 * @returns {number} Total cost rounded to 2 decimal places
 */
async function calculateCost(vehicleType, zone, durationHours) {
  const pricing = await Pricing.findOne({ vehicleType, zone });
  const ratePerHour = pricing ? pricing.ratePerHour : (DEFAULT_RATES[vehicleType] || 150);
  return parseFloat((ratePerHour * durationHours).toFixed(2));
}

module.exports = { calculateCost };
