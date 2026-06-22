const db = require('../../database/db');

const Book = {
  create({ title, author, isbn, category_id, stock, available, description, cover_image }) {
    const stmt = db.prepare(`
      INSERT INTO books (title, author, isbn, category_id, stock, available, description, cover_image)
      VALUES (@title, @author, @isbn, @category_id, @stock, @available, @description, @cover_image)
    `);
    const result = stmt.run({ title, author, isbn, category_id, stock: stock || 0, available: available || 0, description, cover_image });
    return result.lastInsertRowid;
  },

  findAll({ page = 1, limit = 12, search = '', category_id = null } = {}) {
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];

    if (search) {
      conditions.push('(b.title LIKE ? OR b.author LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s);
    }
    if (category_id) {
      conditions.push('b.category_id = ?');
      params.push(category_id);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    return {
      data: db.prepare(`
        SELECT b.*, c.name as category_name
        FROM books b
        LEFT JOIN categories c ON b.category_id = c.id
        ${where}
        ORDER BY b.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, limit, offset),
      total: db.prepare(`SELECT COUNT(*) as count FROM books b ${where}`).get(...params).count
    };
  },

  findById(id) {
    return db.prepare(`
      SELECT b.*, c.name as category_name
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `).get(id);
  },

  update(id, fields) {
    const keys = Object.keys(fields);
    const sets = keys.map(k => `${k} = @${k}`).join(', ');
    const stmt = db.prepare(`UPDATE books SET ${sets} WHERE id = @id`);
    return stmt.run({ id, ...fields });
  },

  delete(id) {
    db.prepare('DELETE FROM books WHERE id = ?').run(id);
  },

  updateAvailable(id, delta) {
    db.prepare('UPDATE books SET available = available + ? WHERE id = ? AND available + ? >= 0').run(delta, id, delta);
  },

  countAll() {
    return db.prepare('SELECT COUNT(*) as count FROM books').get().count;
  }
};

module.exports = Book;
