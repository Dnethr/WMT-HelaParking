const Settings = require('../models/Settings');

// GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ maxVehiclesPerUser: 5, maxActiveVehiclesPerUser: 1, safeTimeDuration: 10, maxBookingHours: 24, maxEarlyCheckInMinutes: 5 });
    }
    res.status(200).json({ settings });
  } catch (error) {
    console.error('getSettings error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PUT /api/settings
exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    const { maxVehiclesPerUser, maxActiveVehiclesPerUser, safeTimeDuration, maxBookingHours, maxEarlyCheckInMinutes } = req.body;
    if (maxVehiclesPerUser !== undefined) settings.maxVehiclesPerUser = Number(maxVehiclesPerUser);
    if (maxActiveVehiclesPerUser !== undefined) settings.maxActiveVehiclesPerUser = Number(maxActiveVehiclesPerUser);
    if (safeTimeDuration !== undefined) settings.safeTimeDuration = Number(safeTimeDuration);
    if (maxBookingHours !== undefined) settings.maxBookingHours = Number(maxBookingHours);
    if (maxEarlyCheckInMinutes !== undefined) settings.maxEarlyCheckInMinutes = Number(maxEarlyCheckInMinutes);

    await settings.save();
    res.status(200).json({ settings });
  } catch (error) {
    console.error('updateSettings error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};
