const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const signupOtps = {}; // { email: { tokenHash, expiry } }

// POST /api/auth/send-signup-otp
exports.sendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(409).json({ message: 'Email already registered.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    signupOtps[email.toLowerCase()] = { tokenHash, expiry };

    console.log(`[SIGNUP OTP FOR ${email}]: ${otp}`);

    // RETURN IMMEDIATELY
    res.status(200).json({ message: 'OTP generated. Please check server logs.' });

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT, 10),
          secure: parseInt(process.env.EMAIL_PORT, 10) === 465,
          family: 4,
          logger: true,
          debug: true,
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
          lookup: (hostname, options, callback) => {
            const dns = require('dns');
            dns.lookup(hostname, { family: 4 }, callback);
          }
        });

        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'HelaParking — Email Verification Code',
          html: `<p>Your signup verification code is: <strong>${otp}</strong>. It expires in 15 minutes.</p>`,
        }).catch(err => console.error('Signup mail background error:', err.message));
      }
    } catch (err) {
      console.error('Send signup OTP mail error:', err);
    }
  } catch (error) {
    console.error('SendSignupOtp error:', error);
  }
};

// POST /api/auth/verify-signup-otp
exports.verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

    const record = signupOtps[email.toLowerCase()];
    if (!record) return res.status(400).json({ message: 'No OTP requested for this email.' });

    if (new Date() > record.expiry) {
      delete signupOtps[email.toLowerCase()];
      return res.status(400).json({ message: 'OTP has expired.' });
    }

    const hash = crypto.createHash('sha256').update(otp).digest('hex');
    if (hash !== record.tokenHash) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    // Successfully verified! We keep the record for a short duration to ensure signup completes
    res.status(200).json({ message: 'Email verified successfully.' });
  } catch (error) {
    console.error('VerifySignupOtp error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, vehicleNumber, vehicleType, phoneNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phoneNumber: phoneNumber || '',
      passwordHash,
      role: 'driver',
      vehicleNumber: vehicleNumber || '',
      vehicleType: vehicleType || 'Car',
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      role: user.role,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        vehicleNumber: user.vehicleNumber,
        vehicleType: user.vehicleType,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been banned. Contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      token,
      role: user.role,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        vehicleNumber: user.vehicleNumber,
        vehicleType: user.vehicleType,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('ChangePassword error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { resetTokenHash: tokenHash, resetTokenExpiry: expiry }
    );

    console.log(`[PASSWORD RESET OTP FOR ${email}]: ${otp}`);

    // RETURN IMMEDIATELY - Don't wait for DB or Email
    res.status(200).json({ message: 'Reset code generated. Please check your logs/email.' });

    try {
      const nodemailer = require('nodemailer');
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT, 10),
          secure: parseInt(process.env.EMAIL_PORT, 10) === 465,
          family: 4,
          logger: true, // Log SMTP traffic
          debug: true,  // Show debug info
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          lookup: (hostname, options, callback) => {
            const dns = require('dns');
            dns.lookup(hostname, { family: 4 }, callback);
          }
        });

        // Fire and forget (don't await so frontend doesn't hang)
        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'HelaParking — Password Reset OTP',
          html: `<p>Your password reset OTP is: <strong>${otp}</strong>. It expires in 15 minutes.</p>`,
        }).catch(err => console.error('Reset mail background error:', err.message));
      }
    } catch (mailError) {
      console.error('Email sending error:', mailError.message);
    }
  } catch (error) {
    console.error('ForgotPassword error:', error);
    // Note: Response already sent
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!otp || !newPassword || !email) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const tokenHash = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetTokenHash: tokenHash,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetTokenHash = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('ResetPassword error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// POST /api/auth/register-admin
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      phoneNumber: phoneNumber || '',
      passwordHash,
      role: 'admin',
    });

    res.status(201).json({
      message: 'Admin created successfully.',
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('RegisterAdmin error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};
