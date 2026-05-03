const mongoose = require('mongoose');

const incidentReportSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
    },
    category: {
      type: String,
      enum: ['Blocked Car', 'Equipment Failure', 'Theft', 'Oil Spill', 'Other'],
      required: true,
    },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['Open', 'Investigating', 'Resolved'],
      default: 'Open',
    },
    assignedAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    evidenceImageUrl: { type: String },
    resolutionNote: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('IncidentReport', incidentReportSchema);
