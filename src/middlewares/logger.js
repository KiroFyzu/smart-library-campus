const Log = require('../models/Log');

/**
 * Log an audit event
 * @param {string} action - Action type from constants.ACTIONS
 * @param {string} details - Action details
 */
function auditLog(action, details = '') {
  return (req, res, next) => {
    try {
      const userId = req.session.user ? req.session.user.id : null;
      const ip = req.ip || req.connection.remoteAddress;
      Log.create(userId, action, details, ip);
    } catch (err) {
      console.error('Audit log error:', err.message);
    }
    next();
  };
}

/**
 * Log helper function (non-middleware)
 */
function logAction(user_id, action, details, ip_address) {
  try {
    Log.create(user_id, action, details, ip_address);
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = { auditLog, logAction };
