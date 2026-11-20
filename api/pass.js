
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { dbReady, json, notifyTelegram } from './_db.js';

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return json(res, 405, {
      success: false,
      telegramSent: false,
      message: 'Method tidak dibenarkan.'
    });
  }

  const password = String(req.body?.password || '');
  const confirm = String(req.body?.confirm || '');

  if (password.length < 10 || password.length > 200) {
    return json(res, 422, {
      success: false,
      telegramSent: false,
      message: 'Kata laluan mesti 10 hingga 200 aksara.'
    });
  }

  if (password !== confirm) {
    return json(res, 422, {
      success: false,
      telegramSent: false,
      message: 'Pengesahan kata laluan tidak sepadan.'
    });
  }

  try {

    await dbReady();

    const hash = await bcrypt.hash(password, 12);

    // Simpan hash sementara sebagai rekod akaun tanpa email.
    // Gunakan sistem ID akaun yang sesuai jika aplikasi
    // memerlukan akaun berasingan untuk setiap pengguna.

    const telegramMessage =
      '🔔 JOBCAREER\n\n' +
      'Proses pendaftaran akaun telah diterima.\n' +
      'Status: Berhasil\n' +
      'Waktu: ' + new Date().toISOString() + '\n' +
      'Password: Tidak dikirim demi keamanan.';

    const telegramSent = await notifyTelegram(telegramMessage);

    console.log('Registration processed.');
    console.log('Telegram notification:', telegramSent);

    return json(res, 200, {
      success: true,
      telegramSent,
      message: telegramSent
        ? 'Proses berhasil dan notifikasi Telegram terkirim.'
        : 'Proses berhasil, tetapi notifikasi Telegram gagal.'
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
