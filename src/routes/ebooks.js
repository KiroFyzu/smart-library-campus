const express = require('express');
const router = express.Router();
const ebookController = require('../controllers/ebookController');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/ebooks', isAuthenticated, ebookController.list);
router.post('/ebooks/:bookId', isAuthenticated, isAdmin, upload.single('ebook'), ebookController.upload);
router.get('/ebooks/:id/read', isAuthenticated, ebookController.read);
router.get('/ebooks/:id/download', isAuthenticated, ebookController.download);
router.post('/ebooks/:id/delete', isAuthenticated, isAdmin, ebookController.delete);

module.exports = router;
