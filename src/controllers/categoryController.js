const Category = require('../models/Category');
const { ACTIONS } = require('../config/constants');
const { logAction } = require('../middlewares/logger');

exports.list = (req, res) => {
  const categories = Category.findAll();
  res.render('books/categories', { title: 'Kelola Kategori', categories });
};

exports.create = (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    req.flash('error', 'Nama kategori wajib diisi.');
    return res.redirect('/categories');
  }
  try {
    Category.create(name, description);
    logAction(req.session.user.id, ACTIONS.CATEGORY_CREATE, `Created category: ${name}`, req.ip);
    req.flash('success', `Kategori "${name}" berhasil ditambahkan.`);
  } catch (err) {
    req.flash('error', 'Gagal menambah kategori. Nama mungkin sudah ada.');
  }
  res.redirect('/categories');
};

exports.update = (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    req.flash('error', 'Nama kategori wajib diisi.');
    return res.redirect('/categories');
  }
  try {
    Category.update(req.params.id, name, description);
    logAction(req.session.user.id, ACTIONS.CATEGORY_UPDATE, `Updated category: ${name}`, req.ip);
    req.flash('success', 'Kategori berhasil diperbarui.');
  } catch (err) {
    req.flash('error', 'Gagal memperbarui kategori.');
  }
  res.redirect('/categories');
};

exports.delete = (req, res) => {
  try {
    const cat = Category.findById(req.params.id);
    Category.delete(req.params.id);
    logAction(req.session.user.id, ACTIONS.CATEGORY_DELETE, `Deleted category: ${cat?.name}`, req.ip);
    req.flash('success', 'Kategori berhasil dihapus.');
  } catch (err) {
    req.flash('error', 'Gagal menghapus kategori.');
  }
  res.redirect('/categories');
};
