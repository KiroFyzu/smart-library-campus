const Book = require('../models/Book');
const Category = require('../models/Category');
const User = require('../models/User');
const Borrowing = require('../models/Borrowing');

exports.index = (req, res) => {
  try {
    // Mark overdue items
    Borrowing.markOverdue();

    const stats = {
      totalBooks: Book.countAll(),
      totalCategories: Category.countAll(),
      totalUsers: User.countActive(),
      activeBorrows: Borrowing.countByStatus('borrowed'),
      overdueCount: Borrowing.countByStatus('overdue'),
      returnedCount: Borrowing.countByStatus('returned')
    };

    const recentBorrowings = Borrowing.recent(10);
    const monthlyStats = Borrowing.monthlyStats();

    res.render('dashboard/index', {
      title: 'Dashboard',
      stats,
      recentBorrowings,
      monthlyStats: JSON.stringify(monthlyStats)
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.render('dashboard/index', {
      title: 'Dashboard',
      stats: { totalBooks: 0, totalCategories: 0, totalUsers: 0, activeBorrows: 0, overdueCount: 0, returnedCount: 0 },
      recentBorrowings: [],
      monthlyStats: '[]'
    });
  }
};
