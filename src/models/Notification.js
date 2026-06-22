const db = require('../../database/db');

const Notification = {
  create(user_id, title, message, type = 'info') {
    const result = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).run(user_id, title, message, type);
    return result.lastInsertRowid;
  },

  findByUser(user_id, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return {
      data: db.prepare(`
        SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(user_id, limit, offset),
      total: db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?').get(user_id).count
    };
  },

  markRead(id) {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  },

  markAllRead(user_id) {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(user_id);
  },

  countUnread(user_id) {
    return db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(user_id).count;
  }
};

module.exports = Notification;
