# VOA PLBN Aruk - Sistem Pelayanan Visa On Arrival

Aplikasi ini dibangun menggunakan Next.js 14 (App Router), Tailwind CSS, Drizzle ORM, dan Neon Serverless PostgreSQL.

## 🚀 Panduan Deployment ke Vercel

Sistem ini sangat mudah di-deploy ke Vercel secara gratis. Berikut langkah-langkahnya:

### 1. Persiapkan Environment Variables
Sebelum deploy, pastikan Anda sudah memiliki kredensial dari Neon DB Anda.

Di halaman **Project Vercel > Settings > Environment Variables**, tambahkan variabel berikut:

- `DATABASE_URL` = (Contoh: `postgresql://neondb_owner:***@ep-***.us-east-2.aws.neon.tech/neondb?sslmode=require`)
- `SESSION_SECRET` = (Isi dengan password rahasia panjang minimal 32 karakter untuk enkripsi session cookie)
- `NEXT_PUBLIC_APP_URL` = (Isi dengan domain Vercel Anda, contoh: `https://voa-aruk.vercel.app`)

### 2. Push Schema Database (Jika DB Masih Kosong)
Vercel hanya bertugas menjalankan aplikasi (menjalankan `npm run build` dan start). Struktur tabel Drizzle Anda harus dikirim ke Neon DB melalui komputer lokal (Terminal) terlebih dahulu:

1. Pastikan Anda punya `.env` di komputer Anda yang berisi `DATABASE_URL`.
2. Jalankan perintah ini di lokal untuk mendorong tabel dan mengisi akun default (`admin` & `petugas1`):
```bash
npm run db:push
npm run db:seed
```

### 3. Deploy
1. Push kode Anda ke repository Github.
2. Buka dashboard Vercel, pilih **Add New Project**, dan hubungkan dengan repository Github Anda.
3. Vercel secara otomatis akan mendeteksi *framework* Next.js.
4. Klik **Deploy**! (Skrip build `npm run build` akan dieksekusi otomatis oleh Vercel).

---

Selesai! Aplikasi VOA Anda kini online dan siap digunakan di seluruh PLBN Aruk. 🇮🇩
