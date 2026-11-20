import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { dbReady, json } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { success: false, message: 'Method tidak dibenarkan.' });
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const confirm = String(req.body?.confirm || '');
  if (email.length > 190 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 422, { success: false, message: 'Alamat e-mel tidak sah.' });
  if (password.length < 10 || password.length > 200) return json(res, 422, { success: false, message: 'Kata laluan mesti 10 hingga 200 aksara.' });
  if (password !== confirm) return json(res, 422, { success: false, message: 'Pengesahan kata laluan tidak sepadan.' });
  try {
    await dbReady();
    const hash = await bcrypt.hash(password, 12);
    const result = await sql`INSERT INTO accounts (email, password_hash) VALUES (${email}, ${hash}) ON CONFLICT (email) DO NOTHING RETURNING id`;
    if (!result.rowCount) return json(res, 409, { success: false, message: 'E-mel ini sudah mempunyai akaun.' });
    return json(res, 200, { success: true, message: 'Akaun JOBCAREER berjaya didaftarkan. Kata laluan disimpan dengan selamat.' });
  } catch (error) {
    console.error('Account API error:', error);
    return json(res, 500, { success: false, message: 'Pendaftaran tidak dapat diproses.' });
  }
}
