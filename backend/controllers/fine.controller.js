const Fine = require('../models/Fine');
const { sendNotification } = require('../services/notificationService');

// POST /api/fines
exports.createFine = async (req, res) => {
  try {
    const { bookingId, userId, amount, reason, overstayMinutes } = req.body;
    if (!bookingId || !userId || !amount) return res.status(400).json({ message: 'bookingId, userId, amount required.' });

    const fine = await Fine.create({ bookingId, userId, amount, reason: reason || 'Overstay', overstayMinutes: overstayMinutes || 0, status: 'unpaid' });
    await sendNotification(userId, `You have been fined LKR ${amount}. Reason: ${fine.reason}`, 'fine', fine._id.toString());
    res.status(201).json({ fine });
  } catch (error) {
    console.error('CreateFine error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// GET /api/fines/my
exports.getMyFines = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    const fines = await Fine.find(filter).populate('bookingId', 'slotId startTime endTime').sort({ createdAt: -1 }).lean();
    res.status(200).json({ fines });
  } catch (error) {
    console.error('GetMyFines error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// GET /api/fines
exports.getAllFines = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const fines = await Fine.find(filter).populate('userId', 'name email').populate('bookingId', 'slotId startTime endTime vehicleNumber').sort({ createdAt: -1 }).lean();
    res.status(200).json({ fines });
  } catch (error) {
    console.error('GetAllFines error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PUT /api/fines/:id/pay
exports.payFine = async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) return res.status(404).json({ message: 'Fine not found.' });
    if (fine.status === 'paid') return res.status(400).json({ message: 'Fine is already paid.' });

    fine.status = 'paid';
    await fine.save();
    await sendNotification(fine.userId, `Fine of LKR ${fine.amount} has been paid.`, 'payment', fine._id.toString());
    res.status(200).json({ fine });
  } catch (error) {
    console.error('PayFine error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};
