const Slot = require('../models/Slot');

/**
 * Update slot status and emit Socket.io event.
 * Called by booking, gate, and incident controllers.
 * @param {string} slotId - The slot's MongoDB ObjectId
 * @param {string} newStatus - One of: Available, Reserved, Occupied, Out-of-Service
 * @param {object} io - Socket.io server instance
 * @returns {object} The updated slot document
 */
async function updateSlotStatus(slotId, newStatus, io) {
  const slot = await Slot.findByIdAndUpdate(
    slotId,
    { status: newStatus },
    { new: true }
  );

  if (!slot) {
    throw new Error(`Slot not found: ${slotId}`);
  }

  if (io) {
    io.emit('slot:updated', slot);
  }

  return slot;
}

module.exports = { updateSlotStatus };
