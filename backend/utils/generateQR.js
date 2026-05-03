/**
 * Build a QR code payload for a booking.
 * The payload is a JSON string that can be encoded into a QR code.
 * @param {object} booking - The booking document
 * @param {string} slotNumber - The slot number string
 * @returns {string} JSON stringified QR payload
 */
function generateQRPayload(booking, slotNumber) {
  const payload = {
    bookingId: booking._id.toString(),
    slotNumber,
    vehicleNumber: booking.vehicleNumber,
    startTime: booking.startTime.toISOString(),
    endTime: booking.endTime.toISOString(),
    generatedAt: new Date().toISOString(),
  };
  return JSON.stringify(payload);
}

module.exports = { generateQRPayload };
