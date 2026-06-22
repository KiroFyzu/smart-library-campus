# Sistem Perpustakaan Digital

Sistem Perpustakaan Digital adalah aplikasi web untuk mengelola koleksi buku, e-book, peminjaman, pengembalian, notifikasi, dan profil pengguna di lingkungan kampus. Aplikasi ini dibuat dengan Express.js, EJS, SQLite, dan MinIO untuk penyimpanan file seperti sampul buku, e-book, dan foto profil.

## Fitur utama

- Login pengguna menggunakan email atau NIM.
- Role pengguna: admin, mahasiswa, dosen, dan staff.
- Dashboard admin berisi ringkasan data perpustakaan.
- Manajemen buku dan kategori.
- Upload sampul buku ke MinIO.
- Manajemen e-book, termasuk upload, baca, dan download.
- Peminjaman dan pengembalian buku.
- Riwayat peminjaman dengan tampilan mobile yang lebih nyaman.
- Deteksi peminjaman terlambat dan denda.
- Notifikasi pengguna.
- Edit profil, upload foto profil, ganti foto, dan hapus foto profil.
- Tampilan dengan tema kampus UIN dan layout responsif.

## Teknologi

- Node.js
- Express.js
- EJS dan express-ejs-layouts
- Bootstrap 5
- SQLite dengan better-sqlite3
- express-session dan connect-sqlite3
- MinIO object storage
- Multer untuk upload file
- bcryptjs untuk hashing password

## Struktur folder

```text
.
|-- app.js
|-- package.json
|-- database/
|   |-- db.js
|   |-- migrate.js
|   `-- seed.js
|-- src/
|   |-- config/
|   |-- controllers/
|   |-- middlewares/
|   |-- models/
|   |-- public/
|   |   |-- css/
|   |   `-- js/
|   |-- routes/
|   |-- utils/
|   `-- views/
`-- .env.example
```

## Persiapan

Pastikan sudah terpasang:

- Node.js
- npm
- MinIO, jika ingin memakai fitur upload file secara penuh

Install dependency:

```bash
npm install
```

Salin file environment:

```bash
cp .env.example .env
```

Di Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Sesuaikan isi `.env`, terutama:

```env
PORT=5000
SESSION_SECRET=your-secret-key-change-in-production
DB_PATH=./database/library.db

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=your-minio-access-key
MINIO_SECRET_KEY=your-minio-secret-key
MINIO_USE_SSL=false

MINIO_BUCKET_COVERS=book-covers
MINIO_BUCKET_EBOOKS=ebooks
MINIO_BUCKET_PHOTOS=user-photos

FINE_PER_DAY=1000
BORROW_DAYS=7
```

## Database

Jalankan migration:

```bash
npm run migrate
```

Isi data awal:

```bash
npm run seed
```

Atau jalankan keduanya sekaligus:

```bash
npm run setup
```

## Menjalankan aplikasi

Mode biasa:

```bash
npm start
```

Mode development dengan watch:

```bash
npm run dev
```

Secara default aplikasi berjalan di port yang diatur pada `.env`. Jika memakai `.env.example`, buka:

```text
http://localhost:5000
```

Jika `PORT` tidak terbaca, aplikasi memakai port `3000`.

## Akun default

Setelah menjalankan `npm run seed`, tersedia akun berikut:

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@uin-alauddin.ac.id | admin123 |
| Dosen | budi@uin-alauddin.ac.id | dosen123 |
| Mahasiswa | andi@student.ac.id | mahasiswa123 |

Mahasiswa juga dapat login menggunakan NIM jika data NIM tersedia di database.

## Catatan MinIO

Fitur upload sampul buku, e-book, dan foto profil membutuhkan MinIO. Jika MinIO belum berjalan atau kredensial belum benar, aplikasi tetap bisa berjalan, tetapi fitur upload file dapat gagal.

Bucket default:

- `book-covers`
- `ebooks`
- `user-photos`

Pada saat startup, aplikasi mencoba memastikan bucket tersebut tersedia.

## Perintah npm

| Perintah | Fungsi |
| --- | --- |
| `npm start` | Menjalankan aplikasi |
| `npm run dev` | Menjalankan aplikasi dengan watch mode |
| `npm run migrate` | Membuat atau memperbarui struktur database |
| `npm run seed` | Mengisi data awal |
| `npm run setup` | Menjalankan migration dan seed |

## Catatan pengembangan

- File view berada di `src/views`.
- Asset CSS dan JavaScript berada di `src/public`.
- Routing berada di `src/routes`.
- Logic halaman berada di `src/controllers`.
- Query database berada di `src/models`.
- Database SQLite tersimpan di folder `database`.

Untuk produksi, ubah `SESSION_SECRET`, pastikan MinIO aman, dan jangan gunakan kredensial default.
