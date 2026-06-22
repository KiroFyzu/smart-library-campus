const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const Book = require('../models/Book');
const Category = require('../models/Category');

// Home route
router.get('/', isAuthenticated, (req, res) => {
  if (req.session.user.role === 'admin') {
    return res.redirect('/dashboard');
  }
  res.redirect('/books');
});

// Auth routes
router.use('/', require('./auth'));

// Profile routes
router.use('/', require('./profile'));

// Book routes
router.use('/', require('./books'));

// Category routes
router.use('/', require('./categories'));

// Borrow routes
router.use('/', require('./borrow'));

// E-book routes
router.use('/', require('./ebooks'));

// Notification routes
router.use('/', require('./notifications'));

// Dashboard routes
router.use('/', require('./dashboard'));

module.exports = router;
