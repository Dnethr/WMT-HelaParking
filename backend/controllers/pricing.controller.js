const Pricing = require('../models/Pricing');

// GET /api/pricing
exports.getAllPricing = async (req, res) => {
  try {
    const pricing = await Pricing.find().sort({ vehicleType: 1, zone: 1 }).lean();
    res.status(200).json({ pricing });
  } catch (error) {
    console.error('GetAllPricing error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PUT /api/pricing
exports.bulkUpdatePricing = async (req, res) => {
  try {
    const { updates } = req.body;
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: 'updates array is required.' });
    }

    const results = [];
    for (const item of updates) {
      const { vehicleType, zone, ratePerHour } = item;
      if (!vehicleType || !zone || ratePerHour === undefined) continue;

      const updated = await Pricing.findOneAndUpdate(
        { vehicleType, zone },
        { ratePerHour },
        { new: true, upsert: true }
      );
      results.push(updated);
    }

    res.status(200).json({ message: 'Pricing updated.', pricing: results });
  } catch (error) {
    console.error('BulkUpdatePricing error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};
