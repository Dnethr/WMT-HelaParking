const Booking = require('../models/Booking');

// GET /api/overstays
exports.getOverstays = async (req, res) => {
  try {
    const overstays = await Booking.find({
      status: 'active',
      endTime: { $lt: new Date() },
    })
      .populate('userId', 'name email vehicleNumber')
      .populate('slotId', 'slotNumber type floor zone')
      .sort({ endTime: 1 })
      .lean();

    res.status(200).json({ overstays });
  } catch (error) {
    console.error('GetOverstays error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};
