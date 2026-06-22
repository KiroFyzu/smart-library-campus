const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');

router.get('/dashboard', isAuthenticated, isAdmin, dashboardController.index);

module.exports = router;
