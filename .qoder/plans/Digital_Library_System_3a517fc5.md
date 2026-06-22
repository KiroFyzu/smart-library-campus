# Sistem Perpustakaan Kampus Digital

## Tech Stack
- **Backend**: Node.js + Express.js
- **Template Engine**: EJS (server-side rendering)
- **Database**: SQLite3 (local, via `better-sqlite3`)
- **Auth**: express-session + bcrypt
- **File Uploads**: MinIO Object Storage (via `minio` npm client) + `multer` (memory storage for buffering uploads before sending to MinIO)
  - MinIO Server: `http://127.0.0.1:9000` (API), `http://127.0.0.1:9001` (WebUI)
  - Buckets: `book-covers` (for cover images), `ebooks` (for e-book PDF files), `user-photos` (for user profile photos)
- **Styling**: Bootstrap 5 + vanilla CSS
- **Other**: express-validator, dotenv, morgan (logging)

## Project Structure
```
sistem-perpustakaan/
├── app.js                     # Entry point
├── package.json
├── .env
├── database/
│   ├── db.js                  # DB connection (better-sqlite3)
│   ├── migrate.js             # Schema creation script
│   └── seed.js                # Seed data (admin + sample books)
├── src/
│   ├── config/
│   │   ├── constants.js       # App constants (fine rate, etc.)
│   │   └── minio.js           # MinIO client initialization & helpers
│   ├── middlewares/
│   │   ├── auth.js            # isAuthenticated, isAdmin
│   │   ├── validator.js       # Validation middleware wrappers
│   │   └── logger.js          # Audit log middleware
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── profileController.js
│   │   ├── bookController.js
│   │   ├── categoryController.js
│   │   ├── borrowController.js
│   │   ├── ebookController.js
│   │   ├── notificationController.js
│   │   └── dashboardController.js
│   ├── routes/
│   │   ├── index.js           # Route aggregator
│   │   ├── auth.js
│   │   ├── profile.js
│   │   ├── books.js
│   │   ├── categories.js
│   │   ├── borrow.js
│   │   ├── ebooks.js
│   │   ├── notifications.js
│   │   └── dashboard.js
│   ├── models/                # DB query functions (no ORM, raw SQL)
│   │   ├── User.js
│   │   ├── Book.js
│   │   ├── Category.js
│   │   ├── Borrowing.js
│   │   ├── Ebook.js
│   │   ├── Notification.js
│   │   └── Log.js
│   ├── views/
│   │   ├── layouts/
│   │   │   └── main.ejs       # Base layout (navbar, sidebar, footer)
│   │   ├── partials/
│   │   │   ├── navbar.ejs
│   │   │   ├── sidebar.ejs
│   │   │   ├── flash.ejs      # Flash messages
│   │   │   └── pagination.ejs
│   │   ├── auth/
│   │   │   ├── login.ejs
│   │   │   └── register.ejs
│   │   ├── profile/
│   │   │   └── edit.ejs
│   │   ├── books/
│   │   │   ├── index.ejs      # Book list + search
│   │   │   ├── detail.ejs     # Book detail
│   │   │   ├── form.ejs       # Add/Edit form (admin)
│   │   │   └── categories.ejs
│   │   ├── borrow/
│   │   │   ├── create.ejs
│   │   │   ├── history.ejs
│   │   │   └── return.ejs
│   │   ├── ebooks/
│   │   │   ├── index.ejs
│   │   │   └── reader.ejs
│   │   ├── notifications/
│   │   │   └── index.ejs
│   │   └── dashboard/
│   │       └── index.ejs      # Admin dashboard with stats
│   ├── public/
│   │   ├── css/style.css
│   │   └── js/main.js
│   └── utils/
│       ├── fineCalculator.js   # Denda calculation logic
│       └── helpers.js          # Date formatting, etc.
```

## Database Schema

```sql
-- Users (campus roles: admin, lecturer, student, staff)
users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student',   -- 'admin' | 'lecturer' | 'student' | 'staff'

  -- Identity numbers (role-dependent)
  nim VARCHAR(30),           -- Student ID (for students)
  nidn VARCHAR(30),          -- Lecturer ID (for lecturers)
  nip VARCHAR(30),           -- Staff ID (for staff/admin)

  phone VARCHAR(20),
  address TEXT,
  faculty VARCHAR(100),
  department VARCHAR(100),
  class_year INT,            -- Enrollment year (for students)

  status VARCHAR(20) DEFAULT 'active',           -- 'active' | 'inactive' | 'suspended'
  photo TEXT,                -- MinIO object key (user-photos bucket)

  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Categories
categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT
)

-- Books
books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE,
  category_id INTEGER REFERENCES categories(id),
  stock INTEGER DEFAULT 0,
  available INTEGER DEFAULT 0,      -- tracks currently available copies
  description TEXT,
  cover_image TEXT,                 -- MinIO object key (book-covers bucket)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Borrowings
borrowings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  book_id INTEGER REFERENCES books(id),
  borrow_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE,
  status TEXT DEFAULT 'borrowed',   -- 'borrowed' | 'returned' | 'overdue'
  fine_amount REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- E-books
ebooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER REFERENCES books(id),
  file_path TEXT NOT NULL,          -- MinIO object key (ebooks bucket)
  file_name TEXT NOT NULL,
  file_size INTEGER,
  format TEXT DEFAULT 'pdf',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Notifications
notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',         -- 'info' | 'warning' | 'success'
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Audit Logs
audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,             -- 'LOGIN', 'BORROW', 'RETURN', etc.
  details TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## Implementation Tasks

### Task 1: Project Initialization
- Run `npm init -y`
- Install dependencies:
  - `express`, `ejs`, `express-ejs-layouts`, `better-sqlite3`
  - `express-session`, `connect-sqlite3`, `bcrypt`
  - `multer` (memoryStorage), `minio`, `express-validator`, `dotenv`, `morgan`
  - `bootstrap`, `express-flash`
- Create `app.js` with Express setup, middleware registration, EJS config, session config
- Create `.env` with PORT, SESSION_SECRET, DB_PATH, MINIO_ENDPOINT, MINIO_PORT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_USE_SSL
- Create `src/config/constants.js` (FINE_PER_DAY = 1000, BORROW_DAYS = 7)

### Task 2: Database & MinIO Layer
- Create `database/db.js` -- initialize better-sqlite3 connection
- Create `database/migrate.js` -- run all CREATE TABLE IF NOT EXISTS statements
- Create `database/seed.js` -- seed admin user + sample categories + sample books
- Create `src/config/minio.js` -- initialize MinIO client, create buckets if not exist (`book-covers`, `ebooks`, `user-photos`), set bucket policies, helper functions: `uploadFile(bucket, objectName, buffer, contentType)`, `getPresignedUrl(bucket, objectName)`, `deleteFile(bucket, objectName)`
- Create all model files (`src/models/*.js`) with raw SQL query functions:
  - `User.js`: create, findByEmail, findByUsername, findById, findByNim, update, updateLastLogin, updatePhoto, countActive, countByRole, listByRole
  - `Book.js`: create, findAll (with search/filter/pagination), findById, update, delete, updateAvailable
  - `Category.js`: create, findAll, findById, update, delete
  - `Borrowing.js`: create, findByUser, findById, updateReturn, findOverdue, countByStatus
  - `Ebook.js`: create, findByBookId, findAll
  - `Notification.js`: create, findByUser, markRead, markAllRead, countUnread
  - `Log.js`: create, findAll (with pagination)

### Task 3: Auth System (FR-1)
- `src/routes/auth.js` -- GET/POST `/login`, GET/POST `/register`, POST `/logout`
- `src/controllers/authController.js` -- register (validate, hash password, create user with role-based identity fields), login (verify, create session, update last_login_at), logout
- `src/middlewares/auth.js` -- `isAuthenticated` (redirect to login if not), `isAdmin` (check role === 'admin'), `isLecturerOrAdmin`, `isGuest` (redirect to home if already logged in)
- `src/views/auth/login.ejs` and `register.ejs` -- forms with Bootstrap styling; register form includes role selection and conditional fields (NIM for student, NIDN for lecturer, NIP for staff)
- Audit logging on login/logout

### Task 4: Layout and Shared Views
- `src/views/layouts/main.ejs` -- HTML5 boilerplate with Bootstrap 5 CDN, includes navbar, sidebar (role-based), flash messages, footer
- `src/views/partials/navbar.ejs` -- top navbar with user name, notification badge, logout
- `src/views/partials/sidebar.ejs` -- sidebar links (conditional by role: admin sees Dashboard, Manage Books, Categories, Manage Users; lecturer/student/staff see Browse, My Borrowings, E-books)
- `src/views/partials/flash.ejs` -- success/error flash messages
- `src/views/partials/pagination.ejs` -- reusable pagination component
- `src/public/css/style.css` -- custom styles
- `src/public/js/main.js` -- client-side helpers (confirm dialogs, search)

### Task 5: User Profile (FR-2)
- `src/routes/profile.js` -- GET/POST `/profile`, POST `/profile/photo`
- `src/controllers/profileController.js` -- get profile, update profile fields (name, email, phone, address, faculty, department, class_year for students), upload photo to MinIO `user-photos` bucket
- `src/views/profile/edit.ejs` -- profile form with role-aware fields (e.g. NIM shown for students, NIDN for lecturers, NIP for staff)
- `src/views/profile/view.ejs` -- read-only profile view

### Task 6: Book and Category Management (FR-3, FR-4, FR-5)
- `src/routes/categories.js` -- CRUD routes for `/categories` (admin only)
- `src/controllers/categoryController.js` -- list, create, edit, delete categories
- `src/routes/books.js`:
  - `GET /books` -- public book list with search (query, author, category filter) + pagination
  - `GET /books/:id` -- book detail page
  - `GET /books/create` + `POST /books` -- admin add book (with cover upload)
  - `GET /books/:id/edit` + `POST /books/:id` -- admin edit book
  - `POST /books/:id/delete` -- admin delete book
- `src/controllers/bookController.js` -- all CRUD logic; cover image uploaded via multer (memory), then sent to MinIO `book-covers` bucket; store MinIO object key in DB
- `src/views/books/index.ejs` -- book grid/list with search bar and category filter
- `src/views/books/detail.ejs` -- book info, availability, borrow button
- `src/views/books/form.ejs` -- admin add/edit form with file upload
- `src/views/books/categories.ejs` -- category management page (admin)

### Task 7: Borrowing and Returns (FR-6, FR-7, FR-8, FR-10)
- `src/routes/borrow.js`:
  - `POST /borrow` -- create borrowing (check stock, create record, decrement available, send notification)
  - `GET /borrow/history` -- user borrowing history with status filter
  - `POST /borrow/:id/return` -- return book (set return_date, calculate fine, increment available, send notification)
  - `GET /borrow/overdue` -- admin view of overdue loans
- `src/controllers/borrowController.js` -- borrowing logic
- `src/utils/fineCalculator.js` -- calculate fine: `max(0, daysOverdue) * FINE_PER_DAY`
- `src/views/borrow/create.ejs` -- borrow confirmation page
- `src/views/borrow/history.ejs` -- history table with status badges
- `src/views/borrow/return.ejs` -- return confirmation with fine display

### Task 8: E-book Access (FR-9)
- `src/routes/ebooks.js`:
  - `GET /ebooks` -- list all e-books
  - `POST /ebooks/:bookId` -- admin upload e-book file (multer memory -> MinIO `ebooks` bucket)
  - `GET /ebooks/:id/read` -- in-browser PDF reader (iframe or PDF.js)
  - `GET /ebooks/:id/download` -- download e-book file
  - `POST /ebooks/:id/delete` -- admin delete e-book
- `src/controllers/ebookController.js` -- upload to MinIO, generate presigned URLs for read/download, delete from MinIO
- `src/views/ebooks/index.ejs` -- e-book list with read/download buttons
- `src/views/ebooks/reader.ejs` -- in-browser reader page

### Task 9: Notifications (FR-11)
- `src/routes/notifications.js`:
  - `GET /notifications` -- list user notifications
  - `POST /notifications/:id/read` -- mark as read
  - `POST /notifications/read-all` -- mark all as read
- `src/controllers/notificationController.js` -- notification logic
- `src/middlewares/notification.js` -- middleware to attach unread count to all views
- In-app notifications triggered by:
  - Borrowing created (confirmation)
  - Due date approaching (scheduled check via `node-cron` or on-request check)
  - Return completed (confirmation)
  - Fine applied (warning)
- `src/views/notifications/index.ejs` -- notification list with read/unread styling

### Task 10: Admin Dashboard (FR-12)
- `src/routes/dashboard.js` -- `GET /dashboard` (admin only)
- `src/controllers/dashboardController.js` -- aggregate stats:
  - Total books, total categories, total users
  - Active borrowings, overdue count
  - Recent borrowings (last 10)
  - Monthly borrowing trend (for chart)
- `src/views/dashboard/index.ejs` -- stat cards, recent activity table, Chart.js bar chart for monthly trends

### Task 11: Audit Logging (NFR-10)
- `src/middlewares/logger.js` -- middleware that logs important actions to `audit_logs` table
- Log events: LOGIN, LOGOUT, REGISTER, BORROW, RETURN, BOOK_CREATE, BOOK_UPDATE, BOOK_DELETE, PROFILE_UPDATE
- Attach logger as middleware or call directly in controllers

### Task 12: Final Polish and Security (NFR-3, NFR-5, NFR-6)
- Ensure all passwords are hashed with bcrypt
- Add CSRF protection via `csurf` or manual token
- Validate all inputs with `express-validator`
- Responsive layout with Bootstrap 5 (desktop + mobile)
- Test all flows end-to-end
- Add proper error handling middleware (404, 500 pages)

## NFR Coverage Summary
| NFR | How Addressed |
|-----|--------------|
| Performance (=3s) | SQLite local, server-side rendering (fast), indexed queries |
| Availability (99%) | Simple Node.js process, can add PM2 for production |
| Security | bcrypt hashing, session auth, input validation, CSRF |
| Scalability | Stateless session, DB queries optimized; SQLite fine for moderate scale |
| Usability | Bootstrap 5 responsive UI, clear navigation, flash messages |
| Compatibility | Bootstrap 5 responsive design works on desktop and mobile browsers |
| Reliability | SQLite WAL mode for concurrent reads, transactions for write operations |
| Maintainability | MVC-like structure, separated models/routes/controllers |
| Backup & Recovery | SQLite file-based (easy to copy/backup), seed script for re-seeding |
| Audit & Logging | audit_logs table + morgan HTTP logs |
