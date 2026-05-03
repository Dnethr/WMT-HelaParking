const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const dns = require('dns');
const User = require('../models/User');
require('dotenv').config();

dns.setDefaultResultOrder('ipv4first');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const passwordHash = await bcrypt.hash('Password@123', 12);

    // 1. Create a Driver
    const driverEmail = 'driver@helaparking.com';
    const existingDriver = await User.findOne({ email: driverEmail });
    if (!existingDriver) {
      await User.create({
        name: 'Test Driver',
        email: driverEmail,
        passwordHash,
        role: 'driver',
        vehicleNumber: 'CAA-1234',
        vehicleType: 'Car',
      });
      console.log('✅ Driver created -> Email: driver@helaparking.com | Password: Password@123');
    } else {
      console.log('⚠️ Driver already exists (driver@helaparking.com)');
    }

    // 2. Create an Admin
    const adminEmail = 'admin@helaparking.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'Test Admin',
        email: adminEmail,
        passwordHash,
        role: 'admin',
      });
      console.log('✅ Admin created -> Email: admin@helaparking.com | Password: Password@123');
    } else {
      console.log('⚠️ Admin already exists (admin@helaparking.com)');
    }

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}).catch((err) => {
  console.error('DB connection error:', err);
  process.exit(1);
});
