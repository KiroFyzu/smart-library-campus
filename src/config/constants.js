require('dotenv').config();

module.exports = {
  // Fine per day for late returns (IDR)
  FINE_PER_DAY: parseInt(process.env.FINE_PER_DAY) || 1000,

  // Default borrowing duration (days)
  BORROW_DAYS: parseInt(process.env.BORROW_DAYS) || 7,

  // Maximum renewals allowed
  MAX_RENEWALS: 2,

  // Pagination defaults
  ITEMS_PER_PAGE: 12,

  // User roles
  ROLES: {
    ADMIN: 'admin',
    LECTURER: 'lecturer',
    STUDENT: 'student',
    STAFF: 'staff'
  },

  // User statuses
  STATUSES: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended'
  },

  // Borrowing statuses
  BORROW_STATUS: {
    BORROWED: 'borrowed',
    RETURNED: 'returned',
    OVERDUE: 'overdue'
  },

  // Notification types
  NOTIF_TYPES: {
    INFO: 'info',
    WARNING: 'warning',
    SUCCESS: 'success',
    ERROR: 'error'
  },

  // MinIO bucket names
  BUCKETS: {
    COVERS: process.env.MINIO_BUCKET_COVERS || 'book-covers',
    EBOOKS: process.env.MINIO_BUCKET_EBOOKS || 'ebooks',
    PHOTOS: process.env.MINIO_BUCKET_PHOTOS || 'user-photos'
  },

  // Audit log actions
  ACTIONS: {
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    REGISTER: 'REGISTER',
    BORROW: 'BORROW',
    RETURN: 'RETURN',
    BOOK_CREATE: 'BOOK_CREATE',
    BOOK_UPDATE: 'BOOK_UPDATE',
    BOOK_DELETE: 'BOOK_DELETE',
    PROFILE_UPDATE: 'PROFILE_UPDATE',
    EBOOK_UPLOAD: 'EBOOK_UPLOAD',
    EBOOK_DELETE: 'EBOOK_DELETE',
    CATEGORY_CREATE: 'CATEGORY_CREATE',
    CATEGORY_UPDATE: 'CATEGORY_UPDATE',
    CATEGORY_DELETE: 'CATEGORY_DELETE'
  }
};
