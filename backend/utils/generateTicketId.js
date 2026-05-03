const crypto = require('crypto');

/**
 * Generate a unique ticket ID for incident reports.
 * Format: TKT-XXXX where XXXX is a random 4-char hex string (uppercase).
 * @returns {string} Generated ticket ID
 */
function generateTicketId() {
  const hex = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 4);
  return `TKT-${hex}`;
}

module.exports = { generateTicketId };
