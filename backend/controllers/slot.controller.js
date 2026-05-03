const Slot = require('../models/Slot');
const Pricing = require('../models/Pricing');
const { updateSlotStatus } = require('../services/slotService');

const DEFAULT_RATES = {
  Car: 150,
  Bike: 50,
  EV: 200,
  Disabled: 0
};


// GET /api/slots
exports.getAllSlots = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.zone) filter.zone = req.query.zone;
    if (req.query.floor) filter.floor = req.query.floor;
    if (req.query.status) filter.status = req.query.status;

    let slots = await Slot.find(filter).lean();
    const pricings = await Pricing.find().lean();
    
    slots = slots.map(slot => {
      const pricing = pricings.find(p => p.vehicleType === slot.type && p.zone === slot.zone);
      return { ...slot, price: pricing ? pricing.ratePerHour : (DEFAULT_RATES[slot.type] || 150) };
    });

    res.status(200).json({ slots });
  } catch (error) {
    console.error('GetAllSlots error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// GET /api/slots/:id
exports.getSlotById = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id).lean();
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found.' });
    }
    const pricing = await Pricing.findOne({ vehicleType: slot.type, zone: slot.zone }).lean();
    slot.price = pricing ? pricing.ratePerHour : (DEFAULT_RATES[slot.type] || 150);
    res.status(200).json({ slot });
  } catch (error) {
    console.error('GetSlotById error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};


// POST /api/slots
exports.createSlot = async (req, res) => {
  try {
    const { slotNumber, type, floor, zone, status, isDisabled } = req.body;

    if (!slotNumber || !type || !floor || !zone) {
      return res.status(400).json({ message: 'slotNumber, type, floor, and zone are required.' });
    }

    const existing = await Slot.findOne({ slotNumber });
    if (existing) {
      return res.status(409).json({ message: 'Slot number already exists.' });
    }

    const slot = await Slot.create({
      slotNumber,
      type,
      floor,
      zone,
      status: status || 'Available',
      isDisabled: isDisabled || false,
    });

    const io = req.app.get('io');
    io.emit('slot:updated', slot);

    res.status(201).json({ slot });
  } catch (error) {
    console.error('CreateSlot error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PUT /api/slots/:id
exports.updateSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found.' });
    }

    const allowedFields = ['slotNumber', 'type', 'status', 'floor', 'zone', 'isDisabled'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        slot[field] = req.body[field];
      }
    });

    await slot.save();

    const io = req.app.get('io');
    io.emit('slot:updated', slot);

    res.status(200).json({ slot });
  } catch (error) {
    console.error('UpdateSlot error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// DELETE /api/slots/:id
exports.deleteSlot = async (req, res) => {
  try {
    const slot = await Slot.findByIdAndDelete(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found.' });
    }
    res.status(200).json({ message: 'Slot deleted successfully.' });
  } catch (error) {
    console.error('DeleteSlot error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};
