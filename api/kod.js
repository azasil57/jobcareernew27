import { sql } from '@vercel/postgres';
import { dbReady, json, notifyTelegram } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { success: false, message: 'Method tidak dibenarkan.' });
  const ref = String(req.body?.reference || '').trim().toUpperCase();
  if (!/^JC-[A-F0-9]{8}$/.test(ref)) return json(res, 422, { success: false, message: 'Format kod rujukan tidak sah.' });
  try {
    await dbReady();
    const result = await sql`SELECT job, status FROM applications WHERE ref_code = ${ref} LIMIT 1`;
    if (!result.rowCount) return json(res, 404, { success: false, message: 'Kod rujukan tidak ditemui. Sila semak semula.' });
    await notifyTelegram(`SEMAKAN RUJUKAN JOBCAREER\nRujukan: ${ref}\nStatus: berjaya disemak`);
    const app = result.rows[0];
    return json(res, 200, { success: true, message: `Rujukan sah. Jawatan: ${app.job} | Status: ${app.status}.` });
  } catch (error) {
    console.error('Reference API error:', error);
    return json(res, 500, { success: false, message: 'Ralat server semasa menyemak rujukan.' });
  }
}
