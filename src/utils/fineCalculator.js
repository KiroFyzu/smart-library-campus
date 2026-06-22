const { FINE_PER_DAY } = require('../config/constants');

/**
 * Calculate fine for late book return
 * @param {string} dueDate - Due date (YYYY-MM-DD)
 * @param {string} returnDate - Return date (YYYY-MM-DD), defaults to today
 * @returns {{ daysLate: number, fine: number }}
 */
function calculateFine(dueDate, returnDate = null) {
  const due = new Date(dueDate);
  const returned = returnDate ? new Date(returnDate) : new Date();

  // Reset time portion for accurate day comparison
  due.setHours(0, 0, 0, 0);
  returned.setHours(0, 0, 0, 0);

  const diffMs = returned - due;
  const daysLate = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const fine = daysLate * FINE_PER_DAY;

  return { daysLate, fine };
}

module.exports = { calculateFine };
