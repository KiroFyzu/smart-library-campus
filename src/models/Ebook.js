const db = require('../../database/db');

const Ebook = {
  create(book_id, file_path, file_name, file_size, format = 'pdf') {
    const result = db.prepare(`
      INSERT INTO ebooks (book_id, file_path, file_name, file_size, format)
      VALUES (?, ?, ?, ?, ?)
    `).run(book_id, file_path, file_name, file_size, format);
    return result.lastInsertRowid;
  },

  findByBookId(book_id) {
    return db.prepare(`
      SELECT e.*, b.title as book_title
      FROM ebooks e
      LEFT JOIN books b ON e.book_id = b.id
      WHERE e.book_id = ?
    `).all(book_id);
  },

  findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return {
      data: db.prepare(`
        SELECT e.*, b.title as book_title, b.author as book_author, b.cover_image
        FROM ebooks e
        LEFT JOIN books b ON e.book_id = b.id
        ORDER BY e.created_at DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset),
      total: db.prepare('SELECT COUNT(*) as count FROM ebooks').get().count
    };
  },

  findById(id) {
    return db.prepare(`
      SELECT e.*, b.title as book_title, b.author as book_author
      FROM ebooks e
      LEFT JOIN books b ON e.book_id = b.id
      WHERE e.id = ?
    `).get(id);
  },

  delete(id) {
    db.prepare('DELETE FROM ebooks WHERE id = ?').run(id);
  }
};

module.exports = Ebook;
