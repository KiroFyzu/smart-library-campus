const db = require('../../database/db');

const Log = {
  create(user_id, action, details, ip_address) {
    const result = db.prepare(`
      INSERT INTO audit_logs (user_id, action, details, ip_address)
      VALUES (?, ?, ?, ?)
    `).run(user_id, action, details, ip_address);
    return result.lastInsertRowid;
  },

  findAll({ page = 1, limit = 50, action = null, user_id = null } = {}) {
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];

    if (action) {
      conditions.push('l.action = ?');
      params.push(action);
    }
    if (user_id) {
      conditions.push('l.user_id = ?');
      params.push(user_id);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    return {
      data: db.prepare(`
        SELECT l.*, u.name as user_name, u.email as user_email
        FROM audit_logs l
        LEFT JOIN users u ON l.user_id = u.id
        ${where}
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, limit, offset),
      total: db.prepare(`SELECT COUNT(*) as count FROM audit_logs l ${where}`).get(...params).count
    };
  }
};

module.exports = Log;
