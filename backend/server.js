require('dotenv').config();
const dns = require('dns');
// Force IPv4 as priority for all network operations (Fixes Railway ENETUNREACH)
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./config/db');

const Booking = require('./models/Booking');
const Fine = require('./models/Fine');
const { sendNotification } = require('./services/notificationService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const socketService = require('./services/socketService');
socketService.setIo(io);

app.set('io', io);
app.use(cors());
app.use(express.json());

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/slots', require('./routes/slot.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/gate', require('./routes/gate.routes'));
app.use('/api/fines', require('./routes/fine.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/pricing', require('./routes/pricing.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/incidents', require('./routes/incident.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/overstays', require('./routes/overstay.routes'));
app.use('/api/settings', require('./routes/settings.routes'));

// Health check
app.get('/', (req, res) => res.json({ message: 'HelaParking API is running.' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Connect DB then start cron and server
connectDB().then(() => {
  // Notification cron job — runs every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const Settings = require('./models/Settings');
      const sysSettings = await Settings.findOne() || { safeTimeDuration: 10 };
      const safeTime = sysSettings.safeTimeDuration || 10;

      const now = new Date();
      const in15 = new Date(now.getTime() + 15 * 60000);

      // ── Phase 1: 15-min warning (endTime is within the next 15 min) ──
      const endingSoon = await Booking.find({
        status: 'active',
        endingSoonNotified: { $ne: true },
        endTime: { $gt: now, $lte: in15 },
      });

      for (const booking of endingSoon) {
        await sendNotification(
          booking.userId,
          'Your parking session ends in 15 minutes. Please prepare to check out.',
          'booking',
          booking._id.toString()
        );
        booking.endingSoonNotified = true;
        await booking.save();
      }

      // ── Phase 2: Time ended — grace window message ──
      const overdue = await Booking.find({
        status: 'active',
        overstayNotified: { $ne: true },
        endTime: { $lt: now },
      });

      for (const booking of overdue) {
        await sendNotification(
          booking.userId,
          `Your booking time has ended. You have a ${safeTime}-minute window to check out, otherwise you will be overcharged.`,
          'overstay',
          booking._id.toString()
        );
        booking.overstayNotified = true;
        await booking.save();
      }

      // ── Phase 3: Safe time expired ──
      const safeTimeExpired = await Booking.find({
        status: 'active',
        safeTimeExpiredNotified: { $ne: true },
        overstayNotified: true,
        endTime: { $lt: new Date(now.getTime() - safeTime * 60000) },
      });

      for (const booking of safeTimeExpired) {
        await sendNotification(
          booking.userId,
          'Safe time is up. You will be fined extra for overstaying.',
          'overstay',
          booking._id.toString()
        );
        booking.safeTimeExpiredNotified = true;
        await booking.save();
      }

      const total = endingSoon.length + overdue.length + safeTimeExpired.length;
      if (total > 0) {
        console.log(`Cron: Sent ${endingSoon.length} ending-soon, ${overdue.length} time-ended, ${safeTimeExpired.length} safe-time-expired notifications.`);
      }
    } catch (error) {
      console.error('Cron notification error:', error);
    }
  });

  console.log('Overstay cron job scheduled (every 5 minutes).');

  const PORT = process.env.PORT || 4000;
  server.listen(PORT, '0.0.0.0', () => console.log(`HelaParking server running on port ${PORT} (0.0.0.0)`));
});
