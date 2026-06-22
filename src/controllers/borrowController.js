const Borrowing = require('../models/Borrowing');
const Book = require('../models/Book');
const Notification = require('../models/Notification');
const { ACTIONS, BORROW_DAYS, NOTIF_TYPES, BORROW_STATUS } = require('../config/constants');
const { logAction } = require('../middlewares/logger');
const { calculateFine } = require('../utils/fineCalculator');
const { addDays, today, formatDateShort } = require('../utils/helpers');

exports.create = (req, res) => {
  try {
    const { book_id } = req.body;
    const userId = req.session.user.id;
    const book = Book.findById(book_id);

    if (!book) {
      req.flash('error', 'Buku tidak ditemukan.');
      return res.redirect('/books');
    }

    if (book.available <= 0) {
      req.flash('error', 'Stok buku habis.');
      return res.redirect(`/books/${book_id}`);
    }

    // Check if user already has this book borrowed
    const userBorrows = Borrowing.findByUser(userId, { status: 'borrowed' });
    const alreadyBorrowed = userBorrows.data.find(b => b.book_id === parseInt(book_id));
    if (alreadyBorrowed) {
      req.flash('error', 'Anda sudah meminjam buku ini.');
      return res.redirect(`/books/${book_id}`);
    }

    const borrowDate = today();
    const dueDate = addDays(new Date(), BORROW_DAYS).toISOString().split('T')[0];

    Borrowing.create(userId, book_id, borrowDate, dueDate);
    Book.updateAvailable(book_id, -1);

    // Send notification
    Notification.create(userId, 'Peminjaman Berhasil', `Anda berhasil meminjam "${book.title}". Tenggat pengembalian: ${formatDateShort(dueDate)}`, NOTIF_TYPES.SUCCESS);

    logAction(userId, ACTIONS.BORROW, `Borrowed: ${book.title}`, req.ip);

    req.flash('success', `Buku "${book.title}" berhasil dipinjam. Tenggat: ${formatDateShort(dueDate)}`);
    res.redirect('/borrow/history');
  } catch (err) {
    console.error('Borrow create error:', err);
    req.flash('error', 'Gagal meminjam buku.');
    res.redirect('/books');
  }
};

exports.history = (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const status = req.query.status || null;
    const isAdmin = req.session.user.role === 'admin';

    if (isAdmin) {
      // Admin sees all borrows - use Borrowing.recent for simplicity, or all
      const result = Borrowing.findByUser(0, { page, limit: 20, status });
      // For admin, get all borrowings differently
      const db = require('../../database/db');
      const offset = (page - 1) * 20;
      let where = '';
      let params = [];
      if (status) { where = 'WHERE br.status = ?'; params.push(status); }
      const data = db.prepare(`
        SELECT br.*, b.title as book_title, b.author as book_author, u.name as user_name
        FROM borrowings br
        LEFT JOIN books b ON br.book_id = b.id
        LEFT JOIN users u ON br.user_id = u.id
        ${where}
        ORDER BY br.created_at DESC LIMIT 20 OFFSET ?
      `).all(...params, offset);
      const total = db.prepare(`SELECT COUNT(*) as count FROM borrowings br ${where}`).get(...params).count;
      const totalPages = Math.ceil(total / 20);
      const baseUrl = `/borrow/history?status=${status || ''}`;

      return res.render('borrow/history', {
        title: 'Riwayat Peminjaman',
        borrowings: data, currentPage: page, totalPages, baseUrl,
        selectedStatus: status, isAdmin: true
      });
    }

    const result = Borrowing.findByUser(req.session.user.id, { page, limit: 20, status });
    const totalPages = Math.ceil(result.total / 20);
    const baseUrl = `/borrow/history?status=${status || ''}`;

    res.render('borrow/history', {
      title: 'Peminjaman Saya',
      borrowings: result.data, currentPage: page, totalPages, baseUrl,
      selectedStatus: status, isAdmin: false
    });
  } catch (err) {
    console.error('History error:', err);
    req.flash('error', 'Gagal memuat riwayat.');
    res.redirect('/');
  }
};

exports.returnBook = (req, res) => {
  try {
    const borrowing = Borrowing.findById(req.params.id);
    if (!borrowing) {
      req.flash('error', 'Data peminjaman tidak ditemukan.');
      return res.redirect('/borrow/history');
    }

    // Only owner or admin can return
    if (req.session.user.role !== 'admin' && borrowing.user_id !== req.session.user.id) {
      req.flash('error', 'Akses ditolak.');
      return res.redirect('/borrow/history');
    }

    if (borrowing.status === 'returned') {
      req.flash('error', 'Buku sudah dikembalikan.');
      return res.redirect('/borrow/history');
    }

    const returnDate = today();
    const { daysLate, fine } = calculateFine(borrowing.due_date, returnDate);

    Borrowing.updateReturn(borrowing.id, returnDate, fine);
    Book.updateAvailable(borrowing.book_id, 1);

    // Notification
    const msg = fine > 0
      ? `Buku "${borrowing.book_title}" dikembalikan. Terlambat ${daysLate} hari. Denda: Rp${fine.toLocaleString('id-ID')}`
      : `Buku "${borrowing.book_title}" berhasil dikembalikan tepat waktu.`;
    Notification.create(borrowing.user_id, 'Pengembalian Buku', msg, fine > 0 ? NOTIF_TYPES.WARNING : NOTIF_TYPES.SUCCESS);

    logAction(req.session.user.id, ACTIONS.RETURN, `Returned: ${borrowing.book_title}`, req.ip);

    req.flash('success', msg);
    res.redirect('/borrow/history');
  } catch (err) {
    console.error('Return error:', err);
    req.flash('error', 'Gagal mengembalikan buku.');
    res.redirect('/borrow/history');
  }
};

exports.overdue = (req, res) => {
  try {
    Borrowing.markOverdue();
    const page = parseInt(req.query.page) || 1;
    const result = Borrowing.findOverdue(page);
    const totalPages = Math.ceil(result.total / 20);
    res.render('borrow/overdue', { title: 'Peminjaman Terlambat', overdueList: result.data, currentPage: page, totalPages });
  } catch (err) {
    console.error('Overdue error:', err);
    req.flash('error', 'Gagal memuat data.');
    res.redirect('/dashboard');
  }
};
