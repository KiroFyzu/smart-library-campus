const { validationResult } = require('express-validator');

/**
 * Middleware to check validation results and redirect back with errors
 * @param {string} redirectPath - Path to redirect on validation failure
 */
function validate(redirectPath) {
  return (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(e => e.msg).join(', '));
      return res.redirect(redirectPath);
    }
    next();
  };
}

module.exports = { validate };
