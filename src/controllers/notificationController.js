const Notification = require('../models/Notification');

exports.list = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const result = Notification.findByUser(req.session.user.id, page, 20);
  const totalPages = Math.ceil(result.total / 20);
  res.render('notifications/index', {
    title: 'Notifikasi',
    notifications: result.data,
    currentPage: page,
    totalPages
  });
};

exports.markRead = (req, res) => {
  Notification.markRead(req.params.id);
  res.json({ success: true });
};

exports.markAllRead = (req, res) => {
  Notification.markAllRead(req.session.user.id);
  req.flash('success', 'Semua notifikasi telah ditandai sebagai dibaca.');
  res.redirect('/notifications');
};
