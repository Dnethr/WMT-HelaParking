const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const dns = require('dns');
const User = require('../models/User');
require('dotenv').config();

dns.setDefaultResultOrder('ipv4first');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const existing = await User.findOne({ role: 'superadmin' });
    if (existing) {
      console.log('Super admin already exists.');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash('Admin@12345', 12);
    await User.create({
      name: 'Super Admin',
      email: 'superadmin@helaparking.com',
      passwordHash,
      role: 'superadmin',
    });

    console.log('Super admin created.');
    console.log('Email: superadmin@helaparking.com');
    console.log('Password: Admin@12345');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}).catch((err) => {
  console.error('DB connection error:', err);
  process.exit(1);
});
