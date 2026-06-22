const { ROLES } = require('../config/constants');

/**
 * Check if user is authenticated
 */
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  req.flash('error', 'Silakan login terlebih dahulu.');
  res.redirect('/login');
}

/**
 * Check if user is admin
 */
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === ROLES.ADMIN) {
    return next();
  }
  req.flash('error', 'Akses ditolak. Halaman hanya untuk administrator.');
  res.redirect('/');
}

/**
 * Check if user is admin or lecturer
 */
function isLecturerOrAdmin(req, res, next) {
  if (req.session.user && (req.session.user.role === ROLES.ADMIN || req.session.user.role === ROLES.LECTURER)) {
    return next();
  }
  req.flash('error', 'Akses ditolak.');
  res.redirect('/');
}

/**
 * Redirect to home if already logged in
 */
function isGuest(req, res, next) {
  if (!req.session.user) {
    return next();
  }
  res.redirect('/');
}

module.exports = { isAuthenticated, isAdmin, isLecturerOrAdmin, isGuest };
