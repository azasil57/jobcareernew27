# JOBCAREER — versi Vercel

Versi ini menggantikan endpoint PHP dan SQLite dengan Vercel Functions (Node.js) serta PostgreSQL.

## Kandungan
- `index.html` — senarai kerja dan borang permohonan
- `success.html` — paparan kod rujukan permohonan
- `kod.html` — semakan kod rujukan
- `Password.html` — pendaftaran akaun JOBCAREER sendiri
- `api/apply.js` — simpan permohonan dan hantar notifikasi Telegram
- `api/kod.js` — semak kod rujukan
- `api/pass.js` — simpan akaun dengan bcrypt hash
- `api/_db.js` — sambungan PostgreSQL dan helper Telegram

## Deploy ke Vercel
1. Buat database PostgreSQL melalui Vercel Storage/Marketplace (contohnya Neon) dan sambungkan ke projek Vercel. Pastikan environment variable `POSTGRES_URL` disediakan.
2. Upload folder ini ke GitHub, atau import repository ke Vercel.
3. Di Vercel, pilih **Add New → Project**, import repository, Framework Preset **Other**, Build Command kosong, Output Directory `.`.
4. Di **Project → Settings → Environment Variables**, tambah:
   - `POSTGRES_URL` — connection string PostgreSQL yang diberikan penyedia database.
   - `TELEGRAM_BOT_TOKEN` — token bot Telegram.
   - `TELEGRAM_CHAT_ID` — chat ID admin.
5. Pilih Production (dan Preview jika diperlukan), simpan, kemudian redeploy.
6. Uji borang permohonan, halaman `kod.html`, dan `Password.html`.

## Catatan penting
- Jangan menulis token Telegram atau connection string ke file HTML/JavaScript atau commit ke GitHub.
- Database dibuat automatik oleh API pada permintaan pertama. Database mesti tersedia melalui `POSTGRES_URL`.
- Tidak perlu `vercel.json`; Vercel mengesan fungsi di folder `api/` secara automatik.
- `Password.html` hanya mendaftarkan akun JOBCAREER sendiri. Password di-hash dan tidak dikirim ke Telegram. Sistem ini belum menyediakan login/reset password.
- `kod.html` memeriksa kode referensi `JC-XXXXXXXX`, bukan OTP atau kode verifikasi akun pihak ketiga.
- Permohonan hanya mengirim nomor telepon ke admin Telegram setelah pengguna memberi persetujuan pada formulir.
- Pertimbangkan kebijakan privasi, masa retensi data, rate limiting, dan perlindungan spam sebelum penggunaan publik.
