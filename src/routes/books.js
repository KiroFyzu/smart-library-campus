const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Admin routes (must come before /:id to avoid matching 'create' as id)
router.get('/books/create', isAuthenticated, isAdmin, bookController.createForm);
router.post('/books', isAuthenticated, isAdmin, upload.single('cover'), bookController.create);

// Public (authenticated) routes
router.get('/books', isAuthenticated, bookController.list);
router.get('/books/:id', isAuthenticated, bookController.detail);
router.get('/books/:id/edit', isAuthenticated, isAdmin, bookController.editForm);
router.post('/books/:id', isAuthenticated, isAdmin, upload.single('cover'), bookController.update);
router.post('/books/:id/delete', isAuthenticated, isAdmin, bookController.delete);

module.exports = router;
