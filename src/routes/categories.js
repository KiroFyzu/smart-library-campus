const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');

router.get('/categories', isAuthenticated, isAdmin, categoryController.list);
router.post('/categories', isAuthenticated, isAdmin, categoryController.create);
router.post('/categories/:id', isAuthenticated, isAdmin, categoryController.update);
router.post('/categories/:id/delete', isAuthenticated, isAdmin, categoryController.delete);

module.exports = router;
