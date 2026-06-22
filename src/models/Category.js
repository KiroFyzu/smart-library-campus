const db = require('../../database/db');

const Category = {
  create(name, description) {
    const result = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(name, description);
    return result.lastInsertRowid;
  },

  findAll() {
    return db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  },

  findById(id) {
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  },

  update(id, name, description) {
    db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?').run(name, description, id);
  },

  delete(id) {
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  },

  countAll() {
    return db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  }
};

module.exports = Category;
