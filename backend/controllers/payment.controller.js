const Payment = require('../models/Payment');
const Fine = require('../models/Fine');
const Booking = require('../models/Booking');
const { sendNotification } = require('../services/notificationService');
const crypto = require('crypto');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// POST /api/payments
exports.createPayment = async (req, res) => {
  try {
    const { bookingId, fineId, amount, method } = req.body;
    if (!amount) return res.status(400).json({ message: 'amount is required.' });

    const payment = await Payment.create({
      userId: req.user._id,
      bookingId: bookingId || undefined,
      fineId: fineId || undefined,
      amount,
      method: method || 'card',
      status: 'completed',
      paidAt: new Date(),
    });

    // If paying a fine, mark it paid
    if (fineId) {
      await Fine.findByIdAndUpdate(fineId, { status: 'paid' });
    }

    await sendNotification(req.user._id, `Payment of LKR ${amount} recorded successfully.`, 'payment', payment._id.toString());
    res.status(201).json({ payment });
  } catch (error) {
    console.error('CreatePayment error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// GET /api/payments/my
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate('bookingId', 'slotId startTime endTime vehicleNumber')
      .populate('fineId', 'amount reason')
      .sort({ createdAt: -1 }).lean();
    res.status(200).json({ payments });
  } catch (error) {
    console.error('GetMyPayments error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// GET /api/payments/revenue
exports.getRevenue = async (req, res) => {
  try {
    const match = { status: 'completed' };
    if (req.query.from || req.query.to) {
      match.paidAt = {};
      if (req.query.from) match.paidAt.$gte = new Date(req.query.from);
      if (req.query.to) match.paidAt.$lte = new Date(req.query.to);
    }

    const revenue = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          avgTransaction: { $avg: '$amount' },
        },
      },
    ]);

    const byMethod = await Payment.aggregate([
      { $match: match },
      { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      revenue: revenue[0] || { totalRevenue: 0, totalTransactions: 0, avgTransaction: 0 },
      byMethod,
    });
  } catch (error) {
    console.error('GetRevenue error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// POST /api/payments/create-payment-intent
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ message: 'amount is required' });

    // Amount is in cents for Stripe (LKR usually has 2 decimal places)
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'lkr',
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Stripe Intent Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/payments/confirm-payment
exports.confirmPayment = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.paymentStatus = 'paid';
    await booking.save();

    const payment = await Payment.create({
      userId: req.user._id,
      bookingId: booking._id,
      amount: amount,
      method: 'card',
      status: 'completed',
      paidAt: new Date(),
    });

    await sendNotification(
      req.user._id, 
      `Payment of LKR ${amount} recorded securely via Stripe.`, 
      'payment', 
      payment._id.toString()
    );

    // Clear unpaid overstay fines once paid
    await Fine.updateMany({ userId: booking.userId, status: 'unpaid' }, { status: 'paid' });

    res.json({ success: true, payment });
  } catch (error) {
    console.error('Confirm Payment Error:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
};
