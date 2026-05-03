const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const { updateSlotStatus } = require('../services/slotService');
const { calculateCost } = require('../services/pricingService');
const { sendNotification } = require('../services/notificationService');
const { generateQRPayload } = require('../utils/generateQR');

// POST /api/bookings
exports.createBooking = async (req, res) => {
  try {
    const { slotId, vehicleNumber, startTime, endTime } = req.body;

    if (!slotId || !vehicleNumber || !startTime || !endTime) {
      return res.status(400).json({ message: 'slotId, vehicleNumber, startTime, and endTime are required.' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: 'startTime must be before endTime.' });
    }

    if (start < new Date()) {
      return res.status(400).json({ message: 'startTime cannot be in the past.' });
    }

    const Settings = require('../models/Settings');
    const settings = await Settings.findOne() || { maxVehiclesPerUser: 5, maxActiveVehiclesPerUser: 1, maxBookingHours: 24 };

    const maxHours = settings.maxBookingHours || 24;
    const durationHours = (end - start) / 3600000;
    if (durationHours > maxHours) {
      return res.status(400).json({ message: `Maximum booking duration of ${maxHours} hours exceeded.` });
    }

    const activeCount = await Booking.countDocuments({
      userId: req.user._id,
      status: 'active',
    });
    const maxActive = settings.maxActiveVehiclesPerUser || 1;
    if (activeCount >= maxActive) {
      return res.status(400).json({ message: `Maximum active vehicles in parking slots of ${maxActive} reached.` });
    }


    // Check slot exists
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found.' });
    }

    if (slot.status === 'Out-of-Service') {
      return res.status(400).json({ message: 'Slot is currently out of service.' });
    }

    // Conflict detection — critical logic
    const conflict = await Booking.findOne({
      slotId,
      status: { $nin: ['cancelled', 'completed'] },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (conflict) {
      return res.status(409).json({ message: 'Slot is not available for the selected time window.' });
    }

    // Calculate cost
    const bookingCost = await calculateCost(slot.type, slot.zone, durationHours);


    const Fine = require('../models/Fine');
    const unpaidFines = await Fine.find({ userId: req.user._id, status: 'unpaid' });
    const outstandingFinesAmount = unpaidFines.reduce((sum, f) => sum + f.amount, 0);

    const totalCost = bookingCost + outstandingFinesAmount;

    // Create booking
    const booking = await Booking.create({
      userId: req.user._id,
      slotId,
      vehicleNumber,
      startTime: start,
      endTime: end,
      status: 'pending',
      paymentStatus: 'pending',
      totalCost,
    });

    // Generate QR payload
    const qrCode = generateQRPayload(booking, slot.slotNumber);
    booking.qrCode = qrCode;
    await booking.save();

    // Set slot to Reserved
    const io = req.app.get('io');
    await updateSlotStatus(slotId, 'Reserved', io);

    res.status(201).json({ booking });
  } catch (error) {
    console.error('CreateBooking error:', error);
    res.status(500).json({ message: error.message || 'Something went wrong.' });
  }
};

// GET /api/bookings/my
exports.getMyBookings = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const bookings = await Booking.find(filter)
      .populate('slotId', 'slotNumber type floor zone status')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ bookings });
  } catch (error) {
    console.error('GetMyBookings error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// GET /api/bookings
exports.getAllBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.slotId) filter.slotId = req.query.slotId;
    if (req.query.date) {
      const dayStart = new Date(req.query.date);
      const dayEnd = new Date(req.query.date);
      dayEnd.setDate(dayEnd.getDate() + 1);
      filter.startTime = { $gte: dayStart, $lt: dayEnd };
    }

    let query = Booking.find(filter).sort({ createdAt: -1 });

    if (req.user.role === 'driver') {
      query = query.select('startTime endTime slotId status');
    } else {
      query = query.populate('userId', 'name email vehicleNumber')
                   .populate('slotId', 'slotNumber type floor zone');
    }

    const bookings = await query.lean();
    res.status(200).json({ bookings });
  } catch (error) {
    console.error('GetAllBookings error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};


// PUT /api/bookings/:id/cancel
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking.' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be cancelled.' });
    }

    booking.status = 'cancelled';
    await booking.save();

    const io = req.app.get('io');
    await updateSlotStatus(booking.slotId, 'Available', io);

    await sendNotification(
      req.user._id,
      'Your booking has been cancelled.',
      'booking',
      booking._id.toString()
    );

    res.status(200).json({ booking });
  } catch (error) {
    console.error('CancelBooking error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PUT /api/bookings/:id/extend
exports.extendBooking = async (req, res) => {
  try {
    const { newEndTime } = req.body;
    if (!newEndTime) {
      return res.status(400).json({ message: 'newEndTime is required.' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to extend this booking.' });
    }

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot extend a cancelled or completed booking.' });
    }

    const newEnd = new Date(newEndTime);
    if (newEnd <= booking.endTime) {
      return res.status(400).json({ message: 'New end time must be after current end time.' });
    }

    // Re-run conflict check for extended window
    const conflict = await Booking.findOne({
      _id: { $ne: booking._id },
      slotId: booking.slotId,
      status: { $nin: ['cancelled', 'completed'] },
      startTime: { $lt: newEnd },
      endTime: { $gt: booking.startTime },
    });

    if (conflict) {
      return res.status(409).json({ message: 'Slot is not available for the extended time window.' });
    }

    // Recalculate cost
    const slot = await Slot.findById(booking.slotId);
    const oldDurationHours = (booking.endTime - booking.startTime) / (1000 * 60 * 60);
    const oldCost = await calculateCost(slot.type, slot.zone, oldDurationHours);
    
    const durationHours = (newEnd - booking.startTime) / (1000 * 60 * 60);
    const totalCost = await calculateCost(slot.type, slot.zone, durationHours);

    const extensionFee = totalCost - oldCost;

    if (extensionFee > 0) {
      const Fine = require('../models/Fine');
      await Fine.create({
        bookingId: booking._id,
        userId: booking.userId,
        amount: extensionFee,
        reason: 'Extension Fee',
        status: 'unpaid',
      });
    }

    booking.endTime = newEnd;
    booking.totalCost = totalCost;

    // Regenerate QR
    booking.qrCode = generateQRPayload(booking, slot.slotNumber);
    await booking.save();

    await sendNotification(
      req.user._id,
      `Booking extended. New end time: ${newEnd.toLocaleString()}. Updated cost: LKR ${totalCost}`,
      'booking',
      booking._id.toString()
    );

    res.status(200).json({ booking });
  } catch (error) {
    console.error('ExtendBooking error:', error);
    res.status(500).json({ message: error.message || 'Something went wrong.' });
  }
};

// GET /api/bookings/:id/qr
exports.getBookingQR = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).lean();
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.userId.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    res.status(200).json({ qrCode: booking.qrCode });
  } catch (error) {
    console.error('GetBookingQR error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};
