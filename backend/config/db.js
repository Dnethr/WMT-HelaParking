const mongoose = require('mongoose');
const dns = require('dns');

// Fix for ECONNREFUSED on SRV lookup (Node.js 18+ defaults to IPv6)
dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
