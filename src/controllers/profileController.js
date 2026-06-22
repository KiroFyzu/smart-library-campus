const User = require('../models/User');
const { ACTIONS, BUCKETS } = require('../config/constants');
const { logAction } = require('../middlewares/logger');
const { uploadFile, deleteFile, getPresignedUrl } = require('../config/minio');
const path = require('path');

exports.viewProfile = async (req, res) => {
  try {
    const user = User.findById(req.session.user.id);
    if (!user) {
      req.flash('error', 'User tidak ditemukan.');
      return res.redirect('/');
    }

    let photoUrl = null;
    if (user.photo) {
      photoUrl = await getPresignedUrl(BUCKETS.PHOTOS, user.photo);
    }

    res.render('profile/edit', {
      title: 'Profil Saya',
      profile: user,
      photoUrl
    });
  } catch (err) {
    console.error('Profile view error:', err);
    req.flash('error', 'Gagal memuat profil.');
    res.redirect('/');
  }
};

exports.updateProfile = (req, res) => {
  try {
    const { name, email, phone, address, faculty, department, class_year } = req.body;
    const userId = req.session.user.id;

    // Check if email is already taken by someone else
    const existingUser = User.findByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      req.flash('error', 'Email sudah digunakan oleh akun lain.');
      return res.redirect('/profile');
    }

    const updateFields = { name, email, phone, address, faculty, department };
    if (class_year) updateFields.class_year = parseInt(class_year);

    User.update(userId, updateFields);

    // Update session
    req.session.user.name = name;
    req.session.user.email = email;

    logAction(userId, ACTIONS.PROFILE_UPDATE, `Profile updated`, req.ip);

    req.flash('success', 'Profil berhasil diperbarui.');
    res.redirect('/profile');
  } catch (err) {
    console.error('Profile update error:', err);
    req.flash('error', 'Gagal memperbarui profil.');
    res.redirect('/profile');
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Pilih file foto terlebih dahulu.');
      return res.redirect('/profile');
    }

    const userId = req.session.user.id;
    const user = User.findById(userId);

    // Delete old photo from MinIO if exists
    if (user.photo) {
      try { await deleteFile(BUCKETS.PHOTOS, user.photo); } catch {}
    }

    // Upload new photo
    const ext = path.extname(req.file.originalname) || '.jpg';
    const objectName = `user_${userId}_${Date.now()}${ext}`;
    await uploadFile(BUCKETS.PHOTOS, objectName, req.file.buffer, req.file.mimetype);

    User.updatePhoto(userId, objectName);
    req.session.user.photo = objectName;

    req.flash('success', 'Foto profil berhasil diperbarui.');
    res.redirect('/profile');
  } catch (err) {
    console.error('Photo upload error:', err);
    req.flash('error', 'Gagal mengupload foto.');
    res.redirect('/profile');
  }
};
