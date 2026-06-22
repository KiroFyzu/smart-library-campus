const express = require('express');
const router = express.Router();
const notifController = require('../controllers/notificationController');
const { isAuthenticated } = require('../middlewares/auth');

router.get('/notifications', isAuthenticated, notifController.list);
router.post('/notifications/:id/read', isAuthenticated, notifController.markRead);
router.post('/notifications/read-all', isAuthenticated, notifController.markAllRead);

module.exports = router;
