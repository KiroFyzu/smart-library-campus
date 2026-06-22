require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const flash = require('express-flash');
const morgan = require('morgan');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize MinIO buckets on startup
const { initBuckets } = require('./src/config/minio');
initBuckets().catch(err => console.warn('MinIO init warning:', err.message));

// ─── View Engine ─────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Session configuration (SQLite-backed)
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, 'database') }),
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

app.use(flash());

// ─── Global Variables for Views ──────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.currentPath = req.path;
  res.locals.helpers = require('./src/utils/helpers');
  next();
});

// ─── Notification Middleware ─────────────────────────────────────────────────
app.use(async (req, res, next) => {
  if (req.session.user) {
    try {
      const Notification = require('./src/models/Notification');
      const count = Notification.countUnread(req.session.user.id);
      res.locals.unreadCount = count;
    } catch {
      res.locals.unreadCount = 0;
    }
  } else {
    res.locals.unreadCount = 0;
  }
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────
const routes = require('./src/routes');
app.use('/', routes);

// ─── Error Handling ──────────────────────────────────────────────────────────
// 404 handler
app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: '404 - Not Found',
    layout: 'layouts/main'
  });
});

// 500 handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).render('errors/500', {
    title: '500 - Server Error',
    layout: 'layouts/main',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// ─── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`📚 Server running at http://localhost:${PORT}`);
});


module.exports = app;
