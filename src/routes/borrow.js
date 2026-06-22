const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');

// Create borrowing
router.post('/borrow', isAuthenticated, borrowController.create);

// User history
router.get('/borrow/history', isAuthenticated, borrowController.history);

// Return book
router.post('/borrow/:id/return', isAuthenticated, borrowController.returnBook);

// Admin: overdue list
router.get('/borrow/overdue', isAuthenticated, isAdmin, borrowController.overdue);

module.exports = router;
