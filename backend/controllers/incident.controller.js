const IncidentReport = require('../models/IncidentReport');
const { updateSlotStatus } = require('../services/slotService');
const { sendNotification } = require('../services/notificationService');
const { generateTicketId } = require('../utils/generateTicketId');
const { uploadToCloudinary } = require('../utils/uploadMiddleware');

// POST /api/incidents
exports.createIncident = async (req, res) => {
  try {
    const { slotId, category, description } = req.body;
    if (!category || !description) return res.status(400).json({ message: 'category and description are required.' });

    let ticketId = generateTicketId();
    // Ensure unique
    while (await IncidentReport.findOne({ ticketId })) {
      ticketId = generateTicketId();
    }

    const incident = await IncidentReport.create({
      ticketId, userId: req.user._id, slotId: slotId || undefined, category, description, status: 'Open',
    });

    if (slotId) {
      const io = req.app.get('io');
      await updateSlotStatus(slotId, 'Out-of-Service', io);
    }

    // Push notification to all admins and superadmins
    const User = require('../models/User');
    const staff = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('_id').lean();
    for (const member of staff) {
      await sendNotification(member._id, `New Incident Reported: [Ticket ${ticketId}] ${category}`, 'incident', incident._id.toString());
    }

    res.status(201).json({ incident });
  } catch (error) {
    console.error('CreateIncident error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// GET /api/incidents/my
exports.getMyIncidents = async (req, res) => {
  try {
    const incidents = await IncidentReport.find({ userId: req.user._id }).populate('slotId', 'slotNumber').sort({ createdAt: -1 }).lean();
    res.status(200).json({ incidents });
  } catch (error) {
    console.error('GetMyIncidents error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// GET /api/incidents
exports.getAllIncidents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    const incidents = await IncidentReport.find(filter).populate('userId', 'name email').populate('slotId', 'slotNumber').populate('assignedAdminId', 'name').sort({ createdAt: -1 }).lean();
    res.status(200).json({ incidents });
  } catch (error) {
    console.error('GetAllIncidents error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// GET /api/incidents/:id
exports.getIncidentById = async (req, res) => {
  try {
    const incident = await IncidentReport.findById(req.params.id).populate('userId', 'name email').populate('slotId', 'slotNumber').populate('assignedAdminId', 'name').lean();
    if (!incident) return res.status(404).json({ message: 'Incident not found.' });
    res.status(200).json({ incident });
  } catch (error) {
    console.error('GetIncidentById error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PUT /api/incidents/:id/assign
exports.assignIncident = async (req, res) => {
  try {
    const incident = await IncidentReport.findByIdAndUpdate(req.params.id, { assignedAdminId: req.user._id }, { new: true });
    if (!incident) return res.status(404).json({ message: 'Incident not found.' });
    res.status(200).json({ incident });
  } catch (error) {
    console.error('AssignIncident error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PUT /api/incidents/:id/status
exports.updateIncidentStatus = async (req, res) => {
  try {
    const { status, resolutionNote } = req.body;
    if (!status) return res.status(400).json({ message: 'status is required.' });

    const update = { status };
    if (resolutionNote) update.resolutionNote = resolutionNote;

    const incident = await IncidentReport.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!incident) return res.status(404).json({ message: 'Incident not found.' });

    if (status === 'Resolved' && incident.slotId) {
      const io = req.app.get('io');
      await updateSlotStatus(incident.slotId, 'Available', io);
    }

    await sendNotification(incident.userId, `Incident ${incident.ticketId} status updated to ${status}.`, 'incident', incident._id.toString());
    res.status(200).json({ incident });
  } catch (error) {
    console.error('UpdateIncidentStatus error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// POST /api/incidents/:id/image
exports.uploadEvidence = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image file is required.' });

    const imageUrl = await uploadToCloudinary(req.file.buffer, 'helaparking/incidents');
    const incident = await IncidentReport.findByIdAndUpdate(req.params.id, { evidenceImageUrl: imageUrl }, { new: true });
    if (!incident) return res.status(404).json({ message: 'Incident not found.' });

    res.status(200).json({ incident });
  } catch (error) {
    console.error('UploadEvidence error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// DELETE /api/incidents/:id
exports.deleteIncident = async (req, res) => {
  try {
    const incident = await IncidentReport.findByIdAndDelete(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Incident not found.' });
    res.status(200).json({ message: 'Incident deleted.' });
  } catch (error) {
    console.error('DeleteIncident error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};
