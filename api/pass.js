
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { dbReady, json, notifyTelegram } from './_db.js';

export default async function handler(req, res) {

  // Periksa metode request
  if (req.method !== 'POST') {
    return json(res, 405, {
      success: false,
      telegramSent: false,
      message: 'Method tidak dibenarkan.'
    });
  }

  // Ambil data form
  const email = String(req.body?.email || '')
    .trim()
    .toLowerCase();

  const password = String(req.body?.password || '');
  const confirm = String(req.body?.confirm || '');

  // Validasi email
  if (
    email.length > 190 ||
   !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return json(res, 422, {
      success: false,
      telegramSent: false,
      message: 'Alamat e-mel tidak sah.'
    });
  }

  // Validasi password
  if (password.length < 10 || password.length > 200) {
    return json(res, 422, {
      success: false,
      telegramSent: false,
      message: 'Kata laluan mesti 10 hingga 200 aksara.'
    });
  }

  // Periksa konfirmasi password
  if (password !== confirm) {
    return json(res, 422, {
      success: false,
      telegramSent: false,
      message: 'Pengesahan kata laluan tidak sepadan.'
    });
  }

  try {

    // Sambungkan database
    await dbReady();

    // Hash password
    const hash = await bcrypt.hash(password, 12);

    // Simpan akun
    const result = await sql`
      INSERT INTO accounts (email, password_hash)
      VALUES (${email}, ${hash})
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;

    // Periksa akun duplikat
    if (!result.rowCount) {
      return json(res, 409, {
        success: false,
        telegramSent: false,
        message: 'E-mel ini sudah mempunyai akaun.'
      });
    }

    // Kirim notifikasi Telegram
    const telegramSent = await notifyTelegram(
      'JOBCAREER\n' +
      'Notifikasi pendaftaran akaun baru.\n' +
      'Status: Berhasil.'
    );

    // Respons API
    return json(res, 200, {
      success: true,
      telegramSent,
      message: telegramSent
        ? 'Pendaftaran berhasil dan notifikasi Telegram terkirim.'
        : 'Pendaftaran berhasil, tetapi notifikasi Telegram gagal.'
    });

  } catch (error) {

    console.error('Account API error:', error);

    return json(res, 500, {
      success: false,
      telegramSent: false,
      message: 'Pendaftaran tidak dapat diproses.'
    });
  }
}
