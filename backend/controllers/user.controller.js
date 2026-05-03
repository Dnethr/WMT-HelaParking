const User = require('../models/User');

// GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).lean();
    res.status(200).json({ users });
  } catch (error) {
    console.error('GetAllUsers error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to update this profile.' });
    }
    const { name, vehicleNumber, vehicleType, phoneNumber } = req.body;
    const update = {};
    if (name) update.name = name;
    if (vehicleNumber !== undefined) update.vehicleNumber = vehicleNumber;
    if (vehicleType) update.vehicleType = vehicleType;
    if (phoneNumber !== undefined) update.phoneNumber = phoneNumber;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ user });
  } catch (error) {
    console.error('UpdateUser error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PUT /api/users/:id/ban
exports.toggleBan = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.isBanned = !user.isBanned;
    await user.save();
    res.status(200).json({ user: { _id: user._id, name: user.name, email: user.email, isBanned: user.isBanned } });
  } catch (error) {
    console.error('ToggleBan error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete yourself.' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('DeleteUser error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

const Settings = require('../models/Settings');

// GET /api/users/me/vehicles
exports.getVehicles = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ vehicles: user.vehicles || [] });
  } catch (error) {
    console.error('getVehicles error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// POST /api/users/vehicles
exports.addVehicle = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const settings = await Settings.findOne() || { maxVehiclesPerUser: 5, maxActiveVehiclesPerUser: 1 };
    const maxVehicles = settings.maxVehiclesPerUser || 5;
    if (user.vehicles && user.vehicles.length >= maxVehicles) {
      return res.status(400).json({ message: `Maximum vehicle count of ${maxVehicles} reached.` });
    }


    const { vehicleNumber, vehicleType } = req.body;
    if (!vehicleNumber || !vehicleType) {
      return res.status(400).json({ message: 'Vehicle number and type are required.' });
    }

    const existing = user.vehicles.find(v => v.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase());
    if (existing) {
      return res.status(400).json({ message: 'This vehicle is already added.' });
    }

    user.vehicles.push({ vehicleNumber: vehicleNumber.toUpperCase(), vehicleType });
    await user.save();
    res.status(200).json({ vehicles: user.vehicles });
  } catch (error) {
    console.error('addVehicle error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// DELETE /api/users/vehicles/:vehicleNumber
exports.deleteVehicle = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.vehicles = user.vehicles.filter(v => v.vehicleNumber.toUpperCase() !== req.params.vehicleNumber.toUpperCase());
    await user.save();
    res.status(200).json({ vehicles: user.vehicles });
  } catch (error) {
    console.error('deleteVehicle error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// DELETE /api/users/me
exports.deleteMe = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('deleteMe error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

