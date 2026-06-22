const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { isAuthenticated } = require('../middlewares/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.get('/profile', isAuthenticated, profileController.viewProfile);
router.post('/profile', isAuthenticated, profileController.updateProfile);
router.post('/profile/photo', isAuthenticated, upload.single('photo'), profileController.uploadPhoto);

module.exports = router;
