const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { isGuest, isAuthenticated } = require('../middlewares/auth');

// GET /login
router.get('/login', isGuest, authController.loginPage);

// POST /login
router.post('/login', [
  body('identifier').trim().notEmpty().withMessage('Email atau NIM wajib diisi'),
  body('password').notEmpty().withMessage('Password wajib diisi')
], authController.login);

// GET /register
router.get('/register', isGuest, authController.registerPage);

// POST /register
router.post('/register', [
  body('name').notEmpty().withMessage('Nama wajib diisi'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('password_confirm').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Konfirmasi password tidak cocok');
    return true;
  }),
  body('role').isIn(['student', 'lecturer', 'staff']).withMessage('Role tidak valid')
], authController.register);

// POST /logout
router.post('/logout', isAuthenticated, authController.logout);

module.exports = router;
