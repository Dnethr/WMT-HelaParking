const Booking = require('../models/Booking');
const Fine = require('../models/Fine');
const { updateSlotStatus } = require('../services/slotService');
const { sendNotification } = require('../services/notificationService');

// POST /api/gate/scan
exports.scan = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required.' });

    const booking = await Booking.findById(bookingId).populate('slotId', 'slotNumber');
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    if (booking.status === 'pending') {
      const Settings = require('../models/Settings');
      const sysSettings = await Settings.findOne() || { maxEarlyCheckInMinutes: 5 };
      const maxEarly = sysSettings.maxEarlyCheckInMinutes || 5;

      const now = new Date();
      const earliestAllowed = new Date(booking.startTime.getTime() - maxEarly * 60000);
      if (now < earliestAllowed) {
        return res.status(400).json({ message: `Too early. You can only check in up to ${maxEarly} minutes before the booking start time.` });
      }

      // PERFORM CHECK-IN
      booking.status = 'active';
      await booking.save();

      const io = req.app.get('io');
      await updateSlotStatus(booking.slotId._id || booking.slotId, 'Occupied', io);

      await sendNotification(booking.userId, `Checked in at slot ${booking.slotId.slotNumber || 'N/A'}.`, 'booking', booking._id.toString());

      // Fetch user's overstays and existing unpaid fines
      const overstays = await Booking.find({
        userId: booking.userId,
        status: 'active',
        endTime: { $lt: new Date() },
      })
        .populate('slotId', 'slotNumber type floor zone')
        .lean();

      const existingFines = await Fine.find({
        userId: booking.userId,
        status: 'unpaid',
      }).lean();

      return res.status(200).json({ message: 'Check-in successful.', booking, overstays, existingFines });
    } else if (booking.status === 'active') {
      // PERFORM CHECK-OUT
      booking.status = 'completed';
      await booking.save();

      const io = req.app.get('io');
      await updateSlotStatus(booking.slotId._id || booking.slotId, 'Available', io);

      // Check overstay
      const now = new Date();
      const endTimeDate = new Date(booking.endTime);
      let fineCreated = null;
      if (now > endTimeDate) {
        const overstayMinutes = Math.floor((now - endTimeDate) / 60000);
        
        const Settings = require('../models/Settings');
        let sysSettings = await Settings.findOne();
        const safeTime = sysSettings ? sysSettings.safeTimeDuration : 10;

        if (overstayMinutes > safeTime) {
          const Slot = require('../models/Slot');
          const Pricing = require('../models/Pricing');

          const slot = await Slot.findById(booking.slotId);
          const pricing = await Pricing.findOne({ vehicleType: slot.type, zone: slot.zone });
          const ratePerHour = pricing ? pricing.ratePerHour : 100;

          const extraHours = Math.ceil(overstayMinutes / 60);
          const amount = ratePerHour * extraHours;

          const existingFine = await Fine.findOne({ bookingId: booking._id });
          if (!existingFine && amount > 0) {
            fineCreated = await Fine.create({
              bookingId: booking._id,
              userId: booking.userId,
              amount,
              reason: 'Overstay',
              overstayMinutes,
              status: 'unpaid',
            });
            await sendNotification(
              booking.userId,
              `Fined LKR ${amount} for overstaying ${overstayMinutes} min.`,
              'fine',
              fineCreated._id.toString()
            );
          }
        }
      }

      await sendNotification(booking.userId, `Checked out from slot ${booking.slotId.slotNumber || 'N/A'}. Thank you!`, 'booking', booking._id.toString());

      // Fetch user's overstays and existing unpaid fines
      const overstays = await Booking.find({
        userId: booking.userId,
        status: 'active',
        endTime: { $lt: new Date() },
      })
        .populate('slotId', 'slotNumber type floor zone')
        .lean();

      const existingFines = await Fine.find({
        userId: booking.userId,
        status: 'unpaid',
      }).lean();

      return res.status(200).json({ message: 'Check-out successful.', booking, fine: fineCreated, overstays, existingFines });
    } else {
      return res.status(400).json({ message: `Booking has been ${booking.status}.` });
    }
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// POST /api/gate/checkin
exports.checkIn = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required.' });

    const booking = await Booking.findById(bookingId).populate('slotId', 'slotNumber');
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (booking.status !== 'pending') return res.status(400).json({ message: `Booking is already ${booking.status}.` });

    const Settings = require('../models/Settings');
    const sysSettings = await Settings.findOne() || { maxEarlyCheckInMinutes: 5 };
    const maxEarly = sysSettings.maxEarlyCheckInMinutes || 5;

    const now = new Date();
    const earliestAllowed = new Date(booking.startTime.getTime() - maxEarly * 60000);
    if (now < earliestAllowed) {
      return res.status(400).json({ message: `Too early. You can only check in up to ${maxEarly} minutes before the booking start time.` });
    }

    booking.status = 'active';
    await booking.save();

    const io = req.app.get('io');
    await updateSlotStatus(booking.slotId._id || booking.slotId, 'Occupied', io);

    await sendNotification(booking.userId, `Checked in at slot ${booking.slotId.slotNumber || 'N/A'}.`, 'booking', booking._id.toString());

    // Fetch user's overstays
    const overstays = await Booking.find({
      userId: booking.userId,
      status: 'active',
      endTime: { $lt: new Date() },
    })
      .populate('slotId', 'slotNumber type floor zone')
      .lean();

    res.status(200).json({ message: 'Check-in successful.', booking, overstays });
  } catch (error) {
    console.error('CheckIn error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// POST /api/gate/checkout
exports.checkOut = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required.' });

    const booking = await Booking.findById(bookingId).populate('slotId', 'slotNumber');
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (booking.status !== 'active') return res.status(400).json({ message: `Booking is ${booking.status}. Cannot check out.` });

    booking.status = 'completed';
    await booking.save();

    const io = req.app.get('io');
    await updateSlotStatus(booking.slotId._id || booking.slotId, 'Available', io);

    // Check overstay
    const now = new Date();
    let fineCreated = null;
    if (now > booking.endTime) {
      const overstayMinutes = Math.floor((now - booking.endTime) / 60000);

      const Settings = require('../models/Settings');
      let sysSettings = await Settings.findOne();
      const safeTime = sysSettings ? sysSettings.safeTimeDuration : 10;

      if (overstayMinutes > safeTime) {
        const Slot = require('../models/Slot');
        const Pricing = require('../models/Pricing');

        const slot = await Slot.findById(booking.slotId);
        const pricing = await Pricing.findOne({ vehicleType: slot.type, zone: slot.zone });
        const ratePerHour = pricing ? pricing.ratePerHour : 100;

        const extraHours = Math.ceil(overstayMinutes / 60);
        const amount = ratePerHour * extraHours;

        const existingFine = await Fine.findOne({ bookingId: booking._id });
        if (!existingFine && amount > 0) {
          fineCreated = await Fine.create({
            bookingId: booking._id,
            userId: booking.userId,
            amount,
            reason: 'Overstay',
            overstayMinutes,
            status: 'unpaid',
          });
          await sendNotification(
            booking.userId,
            `Fined LKR ${amount} for overstaying ${overstayMinutes} min.`,
            'fine',
            fineCreated._id.toString()
          );
        }
      }
    }

    await sendNotification(booking.userId, `Checked out from slot ${booking.slotId.slotNumber || 'N/A'}. Thank you!`, 'booking', booking._id.toString());

    // Fetch user's overstays
    const overstays = await Booking.find({
      userId: booking.userId,
      status: 'active',
      endTime: { $lt: new Date() },
    })
      .populate('slotId', 'slotNumber type floor zone')
      .lean();

    res.status(200).json({ message: 'Check-out successful.', booking, fine: fineCreated, overstays });
  } catch (error) {
    console.error('CheckOut error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};
