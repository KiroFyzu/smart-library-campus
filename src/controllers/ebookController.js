const Ebook = require('../models/Ebook');
const Book = require('../models/Book');
const { ACTIONS, BUCKETS } = require('../config/constants');
const { logAction } = require('../middlewares/logger');
const { uploadFile, deleteFile, getPresignedUrl } = require('../config/minio');
const path = require('path');

exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = Ebook.findAll(page, 20);
    const totalPages = Math.ceil(result.total / 20);

    // Get presigned URLs for covers
    const ebooks = await Promise.all(result.data.map(async (eb) => {
      if (eb.cover_image) {
        eb.cover_url = await getPresignedUrl(BUCKETS.COVERS, eb.cover_image);
      }
      return eb;
    }));

    const books = Book.findAll({ limit: 100 });
    res.render('ebooks/index', { title: 'E-Book', ebooks, books: books.data, currentPage: page, totalPages });
  } catch (err) {
    console.error('Ebook list error:', err);
    res.render('ebooks/index', { title: 'E-Book', ebooks: [], books: [], currentPage: 1, totalPages: 0 });
  }
};

exports.upload = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Pilih file e-book.');
      return res.redirect('/ebooks');
    }

    const bookId = req.params.bookId;
    const book = Book.findById(bookId);
    if (!book) {
      req.flash('error', 'Buku tidak ditemukan.');
      return res.redirect('/ebooks');
    }

    const ext = path.extname(req.file.originalname) || '.pdf';
    const objectName = `ebook_${bookId}_${Date.now()}${ext}`;
    await uploadFile(BUCKETS.EBOOKS, objectName, req.file.buffer, req.file.mimetype);

    const format = ext.replace('.', '').toLowerCase();
    Ebook.create(bookId, objectName, req.file.originalname, req.file.size, format);

    logAction(req.session.user.id, ACTIONS.EBOOK_UPLOAD, `Uploaded ebook for: ${book.title}`, req.ip);
    req.flash('success', `E-book untuk "${book.title}" berhasil diupload.`);
    res.redirect('/ebooks');
  } catch (err) {
    console.error('Ebook upload error:', err);
    req.flash('error', 'Gagal mengupload e-book.');
    res.redirect('/ebooks');
  }
};

exports.read = async (req, res) => {
  try {
    const ebook = Ebook.findById(req.params.id);
    if (!ebook) {
      req.flash('error', 'E-book tidak ditemukan.');
      return res.redirect('/ebooks');
    }

    const url = await getPresignedUrl(BUCKETS.EBOOKS, ebook.file_path, 3600);
    res.render('ebooks/reader', { title: ebook.book_title, ebook, pdfUrl: url });
  } catch (err) {
    console.error('Ebook read error:', err);
    req.flash('error', 'Gagal membuka e-book.');
    res.redirect('/ebooks');
  }
};

exports.download = async (req, res) => {
  try {
    const ebook = Ebook.findById(req.params.id);
    if (!ebook) {
      req.flash('error', 'E-book tidak ditemukan.');
      return res.redirect('/ebooks');
    }

    const url = await getPresignedUrl(BUCKETS.EBOOKS, ebook.file_path, 3600);
    res.redirect(url);
  } catch (err) {
    console.error('Ebook download error:', err);
    req.flash('error', 'Gagal mengunduh e-book.');
    res.redirect('/ebooks');
  }
};

exports.delete = async (req, res) => {
  try {
    const ebook = Ebook.findById(req.params.id);
    if (ebook) {
      try { await deleteFile(BUCKETS.EBOOKS, ebook.file_path); } catch {}
      Ebook.delete(req.params.id);
      logAction(req.session.user.id, ACTIONS.EBOOK_DELETE, `Deleted ebook: ${ebook.file_name}`, req.ip);
      req.flash('success', 'E-book berhasil dihapus.');
    }
  } catch (err) {
    req.flash('error', 'Gagal menghapus e-book.');
  }
  res.redirect('/ebooks');
};
