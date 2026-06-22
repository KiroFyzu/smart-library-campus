const db = require('../../database/db');

const User = {
  create({ name, username, email, password, role = 'student', nim, nidn, nip, phone, address, faculty, department, class_year }) {
    const stmt = db.prepare(`
      INSERT INTO users (name, username, email, password, role, nim, nidn, nip, phone, address, faculty, department, class_year)
      VALUES (@name, @username, @email, @password, @role, @nim, @nidn, @nip, @phone, @address, @faculty, @department, @class_year)
    `);
    const result = stmt.run({ name, username, email, password, role, nim, nidn, nip, phone, address, faculty, department, class_year });
    return result.lastInsertRowid;
  },

  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  findByEmailOrNim(identifier) {
    return db.prepare('SELECT * FROM users WHERE email = ? OR nim = ?').get(identifier, identifier);
  },

  findByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  findByNim(nim) {
    return db.prepare('SELECT * FROM users WHERE nim = ?').get(nim);
  },

  update(id, fields) {
    const keys = Object.keys(fields);
    const sets = keys.map(k => `${k} = @${k}`).join(', ');
    const stmt = db.prepare(`UPDATE users SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`);
    return stmt.run({ id, ...fields });
  },

  updateLastLogin(id) {
    db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  },

  updatePhoto(id, photoKey) {
    db.prepare('UPDATE users SET photo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(photoKey, id);
  },

  countActive() {
    return db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get().count;
  },

  countByRole(role) {
    return db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get(role).count;
  },

  listByRole(role, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return {
      data: db.prepare('SELECT id, name, username, email, role, nim, nidn, nip, faculty, department, status, created_at FROM users WHERE role = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(role, limit, offset),
      total: db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get(role).count
    };
  },

  findAll(page = 1, limit = 20, search = '') {
    const offset = (page - 1) * limit;
    let where = '';
    let params = [];
    if (search) {
      where = "WHERE name LIKE ? OR email LIKE ? OR nim LIKE ? OR username LIKE ?";
      const s = `%${search}%`;
      params = [s, s, s, s];
    }
    return {
      data: db.prepare(`SELECT id, name, username, email, role, nim, nidn, nip, faculty, department, status, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset),
      total: db.prepare(`SELECT COUNT(*) as count FROM users ${where}`).get(...params).count
    };
  },

  updateStatus(id, status) {
    db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  },

  delete(id) {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }
};

module.exports = User;
