require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcryptjs');

console.log('Seeding database...');

// Seed admin user
const adminPassword = bcrypt.hashSync('admin123', 10);
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (name, username, email, password, role, nip, phone, faculty, department, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertUser.run('Administrator', 'admin', 'admin@uin-alauddin.ac.id', adminPassword, 'admin', 'NIP001', '081234567890', 'Fakultas Teknik', 'Informatika', 'active');

// Seed sample lecturer
const lecturerPassword = bcrypt.hashSync('dosen123', 10);
insertUser.run('Dr. Budi Santoso', 'budi.santoso', 'budi@uin-alauddin.ac.id', lecturerPassword, 'lecturer', 'NIDN001', '081234567891', 'Fakultas Teknik', 'Informatika', 'active');

// Seed sample student
const studentPassword = bcrypt.hashSync('mahasiswa123', 10);
insertUser.run('Andi Pratama', 'andi.pratama', 'andi@student.ac.id', studentPassword, 'student', '2024001', '081234567892', 'Fakultas Teknik', 'Informatika', 'active');

// Seed categories
const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)
`);

const categories = [
  ['Pemrograman', 'Buku-buku tentang programming dan software development'],
  ['Jaringan Komputer', 'Buku tentang networking, TCP/IP, dan infrastruktur IT'],
  ['Basis Data', 'Buku tentang database, SQL, dan data management'],
  ['Kecerdasan Buatan', 'Buku tentang AI, machine learning, dan deep learning'],
  ['Matematika', 'Buku tentang matematika, statistik, dan aljabar'],
  ['Manajemen', 'Buku tentang manajemen bisnis dan organisasi'],
  ['Bahasa Inggris', 'Buku tentang English language learning'],
  ['Fiksi', 'Novel, cerpen, dan karya sastra']
];

categories.forEach(([name, desc]) => insertCategory.run(name, desc));

// Seed sample books
const insertBook = db.prepare(`
  INSERT OR IGNORE INTO books (title, author, isbn, category_id, stock, available, description)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const books = [
  ['Belajar Node.js untuk Pemula', 'Abdul Kadir', '978-602-001-001', 1, 5, 5, 'Panduan lengkap belajar Node.js dari dasar hingga mahir'],
  ['Pemrograman Web dengan React', 'Rinaldi Munir', '978-602-001-002', 1, 3, 3, 'Membangun aplikasi web modern dengan React.js'],
  ['Jaringan Komputer dan Internet', 'Andrew S. Tanenbaum', '978-602-001-003', 2, 4, 4, 'Buku teks komprehensif tentang jaringan komputer'],
  ['Sistem Basis Data', 'Fathansyah', '978-602-001-004', 3, 6, 6, 'Konsep dan implementasi sistem basis data relasional'],
  ['Artificial Intelligence: A Modern Approach', 'Stuart Russell', '978-602-001-005', 4, 2, 2, 'Textbook standar untuk kecerdasan buatan'],
  ['Matematika Diskrit', 'Rinaldi Munir', '978-602-001-006', 5, 8, 8, 'Matematika diskrit untuk ilmu komputer'],
  ['Clean Code', 'Robert C. Martin', '978-602-001-007', 1, 3, 3, 'A Handbook of Agile Software Craftsmanship'],
  ['Manajemen Proyek IT', 'Pressman', '978-602-001-008', 6, 4, 4, 'Software Engineering: A Practitioner Approach']
];

books.forEach(book => insertBook.run(...book));

console.log('Seeding completed successfully.');
console.log('Default accounts:');
console.log('  Admin     -> admin@uin-alauddin.ac.id / admin123');
console.log('  Lecturer  -> budi@uin-alauddin.ac.id / dosen123');
console.log('  Student   -> andi@student.ac.id / mahasiswa123');
db.close();
