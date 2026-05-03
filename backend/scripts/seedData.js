const mongoose = require('mongoose');
const dns = require('dns');
const Pricing = require('../models/Pricing');
const Slot = require('../models/Slot');
require('dotenv').config();

dns.setDefaultResultOrder('ipv4first');
const pricingData = [
  { vehicleType: 'Car', zone: 'A', ratePerHour: 150 },
  { vehicleType: 'Car', zone: 'B', ratePerHour: 120 },
  { vehicleType: 'Car', zone: 'C', ratePerHour: 100 },
  { vehicleType: 'Bike', zone: 'A', ratePerHour: 80 },
  { vehicleType: 'Bike', zone: 'B', ratePerHour: 60 },
  { vehicleType: 'Bike', zone: 'C', ratePerHour: 50 },
  { vehicleType: 'EV', zone: 'A', ratePerHour: 200 },
  { vehicleType: 'EV', zone: 'B', ratePerHour: 170 },
  { vehicleType: 'EV', zone: 'C', ratePerHour: 150 },
  { vehicleType: 'Disabled', zone: 'A', ratePerHour: 50 },
  { vehicleType: 'Disabled', zone: 'B', ratePerHour: 50 },
  { vehicleType: 'Disabled', zone: 'C', ratePerHour: 50 },
];

const slotData = [
  // Floor 1, Zone A — 6 slots
  { slotNumber: 'F1-A01', type: 'Car', floor: '1', zone: 'A' },
  { slotNumber: 'F1-A02', type: 'Car', floor: '1', zone: 'A' },
  { slotNumber: 'F1-A03', type: 'Car', floor: '1', zone: 'A' },
  { slotNumber: 'F1-A04', type: 'Bike', floor: '1', zone: 'A' },
  { slotNumber: 'F1-A05', type: 'EV', floor: '1', zone: 'A' },
  { slotNumber: 'F1-A06', type: 'Disabled', floor: '1', zone: 'A' },
  // Floor 1, Zone B — 4 slots
  { slotNumber: 'F1-B01', type: 'Car', floor: '1', zone: 'B' },
  { slotNumber: 'F1-B02', type: 'Car', floor: '1', zone: 'B' },
  { slotNumber: 'F1-B03', type: 'Bike', floor: '1', zone: 'B' },
  { slotNumber: 'F1-B04', type: 'EV', floor: '1', zone: 'B' },
  // Floor 2, Zone A — 5 slots
  { slotNumber: 'F2-A01', type: 'Car', floor: '2', zone: 'A' },
  { slotNumber: 'F2-A02', type: 'Car', floor: '2', zone: 'A' },
  { slotNumber: 'F2-A03', type: 'Bike', floor: '2', zone: 'A' },
  { slotNumber: 'F2-A04', type: 'EV', floor: '2', zone: 'A' },
  { slotNumber: 'F2-A05', type: 'Disabled', floor: '2', zone: 'A' },
  // Floor 2, Zone B — 5 slots
  { slotNumber: 'F2-B01', type: 'Car', floor: '2', zone: 'B' },
  { slotNumber: 'F2-B02', type: 'Car', floor: '2', zone: 'B' },
  { slotNumber: 'F2-B03', type: 'Car', floor: '2', zone: 'B' },
  { slotNumber: 'F2-B04', type: 'Bike', floor: '2', zone: 'B' },
  { slotNumber: 'F2-B05', type: 'EV', floor: '2', zone: 'B' },
];

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    // Seed pricing
    for (const p of pricingData) {
      await Pricing.findOneAndUpdate(
        { vehicleType: p.vehicleType, zone: p.zone },
        p,
        { upsert: true, new: true }
      );
    }
    console.log(`Seeded ${pricingData.length} pricing configs.`);

    // Seed slots
    for (const s of slotData) {
      await Slot.findOneAndUpdate(
        { slotNumber: s.slotNumber },
        { ...s, status: 'Available', isDisabled: false },
        { upsert: true, new: true }
      );
    }
    console.log(`Seeded ${slotData.length} slots.`);

    process.exit(0);
  } catch (error) {
    console.error('Seed data error:', error);
    process.exit(1);
  }
}).catch((err) => {
  console.error('DB connection error:', err);
  process.exit(1);
});
