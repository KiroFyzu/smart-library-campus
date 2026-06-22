const db = require('../../database/db');

const Borrowing = {
  create(user_id, book_id, borrow_date, due_date) {
    const result = db.prepare(`
      INSERT INTO borrowings (user_id, book_id, borrow_date, due_date)
      VALUES (?, ?, ?, ?)
    `).run(user_id, book_id, borrow_date, due_date);
    return result.lastInsertRowid;
  },

  findByUser(user_id, { page = 1, limit = 20, status = null } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE br.user_id = ?';
    const params = [user_id];

    if (status) {
      where += ' AND br.status = ?';
      params.push(status);
    }

    return {
      data: db.prepare(`
        SELECT br.*, b.title as book_title, b.author as book_author, b.cover_image
        FROM borrowings br
        LEFT JOIN books b ON br.book_id = b.id
        ${where}
        ORDER BY br.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, limit, offset),
      total: db.prepare(`SELECT COUNT(*) as count FROM borrowings br ${where}`).get(...params).count
    };
  },

  findById(id) {
    return db.prepare(`
      SELECT br.*, b.title as book_title, b.author as book_author, u.name as user_name, u.email as user_email
      FROM borrowings br
      LEFT JOIN books b ON br.book_id = b.id
      LEFT JOIN users u ON br.user_id = u.id
      WHERE br.id = ?
    `).get(id);
  },

  updateReturn(id, return_date, fine_amount) {
    db.prepare(`
      UPDATE borrowings SET return_date = ?, fine_amount = ?, status = 'returned'
      WHERE id = ?
    `).run(return_date, fine_amount, id);
  },

  findOverdue(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const today = new Date().toISOString().split('T')[0];
    return {
      data: db.prepare(`
        SELECT br.*, b.title as book_title, u.name as user_name, u.email as user_email
        FROM borrowings br
        LEFT JOIN books b ON br.book_id = b.id
        LEFT JOIN users u ON br.user_id = u.id
        WHERE br.status = 'borrowed' AND br.due_date < ?
        ORDER BY br.due_date ASC
        LIMIT ? OFFSET ?
      `).all(today, limit, offset),
      total: db.prepare("SELECT COUNT(*) as count FROM borrowings WHERE status = 'borrowed' AND due_date < ?").get(today).count
    };
  },

  countByStatus(status) {
    return db.prepare('SELECT COUNT(*) as count FROM borrowings WHERE status = ?').get(status).count;
  },

  countAll() {
    return db.prepare('SELECT COUNT(*) as count FROM borrowings').get().count;
  },

  recent(limit = 10) {
    return db.prepare(`
      SELECT br.*, b.title as book_title, u.name as user_name
      FROM borrowings br
      LEFT JOIN books b ON br.book_id = b.id
      LEFT JOIN users u ON br.user_id = u.id
      ORDER BY br.created_at DESC
      LIMIT ?
    `).all(limit);
  },

  monthlyStats() {
    return db.prepare(`
      SELECT
        strftime('%Y-%m', borrow_date) as month,
        COUNT(*) as count
      FROM borrowings
      GROUP BY strftime('%Y-%m', borrow_date)
      ORDER BY month DESC
      LIMIT 12
    `).all().reverse();
  },

  markOverdue() {
    const today = new Date().toISOString().split('T')[0];
    db.prepare("UPDATE borrowings SET status = 'overdue' WHERE status = 'borrowed' AND due_date < ?").run(today);
  }
};

module.exports = Borrowing;
