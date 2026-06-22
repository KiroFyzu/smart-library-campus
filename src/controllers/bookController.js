const Book = require('../models/Book');
const Category = require('../models/Category');
const { ACTIONS, BUCKETS, ITEMS_PER_PAGE } = require('../config/constants');
const { logAction } = require('../middlewares/logger');
const { uploadFile, deleteFile, getPresignedUrl } = require('../config/minio');
const path = require('path');

exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const categoryId = req.query.category ? parseInt(req.query.category) : null;

    const result = Book.findAll({ page, limit: ITEMS_PER_PAGE, search, category_id: categoryId });
    const categories = Category.findAll();
    const totalPages = Math.ceil(result.total / ITEMS_PER_PAGE);

    // Get cover URLs from MinIO
    const books = await Promise.all(result.data.map(async (book) => {
      if (book.cover_image) {
        book.cover_url = await getPresignedUrl(BUCKETS.COVERS, book.cover_image);
      }
      return book;
    }));

    const baseUrl = `/books?search=${encodeURIComponent(search)}&category=${categoryId || ''}`;

    res.render('books/index', {
      title: 'Koleksi Buku',
      books, categories, search, currentPage: page, totalPages, baseUrl,
      selectedCategory: categoryId
    });
  } catch (err) {
    console.error('Books list error:', err);
    req.flash('error', 'Gagal memuat daftar buku.');
    res.render('books/index', { title: 'Koleksi Buku', books: [], categories: [], search: '', currentPage: 1, totalPages: 0, baseUrl: '/books?', selectedCategory: null });
  }
};

exports.detail = async (req, res) => {
  try {
    const book = Book.findById(req.params.id);
    if (!book) {
      req.flash('error', 'Buku tidak ditemukan.');
      return res.redirect('/books');
    }
    let coverUrl = null;
    if (book.cover_image) {
      coverUrl = await getPresignedUrl(BUCKETS.COVERS, book.cover_image);
    }
    res.render('books/detail', { title: book.title, book, coverUrl });
  } catch (err) {
    console.error('Book detail error:', err);
    req.flash('error', 'Gagal memuat detail buku.');
    res.redirect('/books');
  }
};

exports.createForm = (req, res) => {
  const categories = Category.findAll();
  res.render('books/form', { title: 'Tambah Buku', categories, book: null, isEdit: false });
};

exports.create = async (req, res) => {
  try {
    const { title, author, isbn, category_id, stock, description } = req.body;
    let coverKey = null;

    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.jpg';
      coverKey = `cover_${Date.now()}${ext}`;
      await uploadFile(BUCKETS.COVERS, coverKey, req.file.buffer, req.file.mimetype);
    }

    const stockNum = parseInt(stock) || 0;
    Book.create({ title, author, isbn: isbn || null, category_id: category_id ? parseInt(category_id) : null, stock: stockNum, available: stockNum, description, cover_image: coverKey });
    logAction(req.session.user.id, ACTIONS.BOOK_CREATE, `Created book: ${title}`, req.ip);
    req.flash('success', `Buku "${title}" berhasil ditambahkan.`);
    res.redirect('/books');
  } catch (err) {
    console.error('Book create error:', err);
    req.flash('error', 'Gagal menambah buku.');
    res.redirect('/books/create');
  }
};

exports.editForm = async (req, res) => {
  try {
    const book = Book.findById(req.params.id);
    if (!book) {
      req.flash('error', 'Buku tidak ditemukan.');
      return res.redirect('/books');
    }
    const categories = Category.findAll();
    let coverUrl = null;
    if (book.cover_image) {
      coverUrl = await getPresignedUrl(BUCKETS.COVERS, book.cover_image);
    }
    res.render('books/form', { title: 'Edit Buku', categories, book, isEdit: true, coverUrl });
  } catch (err) {
    console.error('Edit form error:', err);
    res.redirect('/books');
  }
};

exports.update = async (req, res) => {
  try {
    const { title, author, isbn, category_id, stock, description } = req.body;
    const bookId = req.params.id;
    const oldBook = Book.findById(bookId);

    const updateFields = { title, author, isbn: isbn || null, category_id: category_id ? parseInt(category_id) : null, description };

    if (stock !== undefined) {
      const newStock = parseInt(stock) || 0;
      const stockDiff = newStock - (oldBook.stock || 0);
      updateFields.stock = newStock;
      updateFields.available = (oldBook.available || 0) + stockDiff;
    }

    if (req.file) {
      // Delete old cover
      if (oldBook.cover_image) {
        try { await deleteFile(BUCKETS.COVERS, oldBook.cover_image); } catch {}
      }
      const ext = path.extname(req.file.originalname) || '.jpg';
      const coverKey = `cover_${Date.now()}${ext}`;
      await uploadFile(BUCKETS.COVERS, coverKey, req.file.buffer, req.file.mimetype);
      updateFields.cover_image = coverKey;
    }

    Book.update(bookId, updateFields);
    logAction(req.session.user.id, ACTIONS.BOOK_UPDATE, `Updated book: ${title}`, req.ip);
    req.flash('success', `Buku "${title}" berhasil diperbarui.`);
    res.redirect(`/books/${bookId}`);
  } catch (err) {
    console.error('Book update error:', err);
    req.flash('error', 'Gagal memperbarui buku.');
    res.redirect(`/books/${req.params.id}/edit`);
  }
};

exports.delete = async (req, res) => {
  try {
    const book = Book.findById(req.params.id);
    if (book?.cover_image) {
      try { await deleteFile(BUCKETS.COVERS, book.cover_image); } catch {}
    }
    Book.delete(req.params.id);
    logAction(req.session.user.id, ACTIONS.BOOK_DELETE, `Deleted book: ${book?.title}`, req.ip);
    req.flash('success', 'Buku berhasil dihapus.');
  } catch (err) {
    req.flash('error', 'Gagal menghapus buku.');
  }
  res.redirect('/books');
};
