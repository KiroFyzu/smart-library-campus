const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { ACTIONS } = require('../config/constants');
const { logAction } = require('../middlewares/logger');

exports.loginPage = (req, res) => {
  res.render('auth/login', { title: 'Login', layout: false });
};

exports.registerPage = (req, res) => {
  res.render('auth/register', { title: 'Register', layout: false });
};

exports.login = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array().map(e => e.msg).join(', '));
    return res.redirect('/login');
  }

  const { identifier, email, password } = req.body;
  const loginIdentifier = (identifier || email || '').trim();
  const user = User.findByEmailOrNim(loginIdentifier);

  if (!user) {
    req.flash('error', 'Email atau NIM tidak terdaftar.');
    return res.redirect('/login');
  }

  if (user.status !== 'active') {
    req.flash('error', 'Akun Anda tidak aktif. Hubungi administrator.');
    return res.redirect('/login');
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    req.flash('error', 'Password salah.');
    return res.redirect('/login');
  }

  // Set session
  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    photo: user.photo
  };

  // Update last login
  User.updateLastLogin(user.id);

  // Audit log
  logAction(user.id, ACTIONS.LOGIN, `User ${user.email} logged in`, req.ip);

  req.flash('success', `Selamat datang, ${user.name}!`);
  res.redirect('/');
};

exports.register = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array().map(e => e.msg).join(', '));
    return res.redirect('/register');
  }

  const { name, username, email, password, role, nim, nidn, nip, phone, faculty, department, class_year } = req.body;

  // Check if email already exists
  if (User.findByEmail(email)) {
    req.flash('error', 'Email sudah terdaftar.');
    return res.redirect('/register');
  }

  // Check if username already exists
  if (username && User.findByUsername(username)) {
    req.flash('error', 'Username sudah digunakan.');
    return res.redirect('/register');
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    const userId = User.create({
      name,
      username: username || null,
      email,
      password: hashedPassword,
      role,
      nim: nim || null,
      nidn: nidn || null,
      nip: nip || null,
      phone: phone || null,
      faculty: faculty || null,
      department: department || null,
      class_year: class_year ? parseInt(class_year) : null
    });

    logAction(Number(userId), ACTIONS.REGISTER, `New user registered: ${email}`, req.ip);

    req.flash('success', 'Registrasi berhasil! Silakan login.');
    res.redirect('/login');
  } catch (err) {
    console.error('Register error:', err);
    req.flash('error', 'Terjadi kesalahan saat registrasi.');
    res.redirect('/register');
  }
};

exports.logout = (req, res) => {
  const userId = req.session.user ? req.session.user.id : null;
  logAction(userId, ACTIONS.LOGOUT, `User logged out`, req.ip);

  req.session.destroy((err) => {
    if (err) console.error('Session destroy error:', err);
    res.redirect('/login');
  });
};
