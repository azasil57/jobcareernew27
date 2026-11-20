import { sql } from '@vercel/postgres';
import { randomBytes } from 'node:crypto';
import { dbReady, json, notifyTelegram } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { success: false, message: 'Method tidak dibenarkan.' });
  const body = req.body || {};
  const job = String(body.job || '').trim();
  const phone = String(body.phone || '').replace(/[\s\-()]/g, '');
  const consent = body.consent === true;
  if (!job || job.length > 150 || !consent || !/^(?:\+?60|0)1[0-9]{7,9}$/.test(phone)) {
    return json(res, 422, { success: false, message: 'Sila semak jawatan, nombor telefon dan persetujuan anda.' });
  }
  try {
    await dbReady();
    let ref;
    for (let i = 0; i < 4; i++) {
      ref = `JC-${randomBytes(4).toString('hex').toUpperCase()}`;
      const saved = await sql`INSERT INTO applications (ref_code, job, phone) VALUES (${ref}, ${job}, ${phone}) ON CONFLICT (ref_code) DO NOTHING RETURNING ref_code`;
      if (saved.rowCount) break;
      ref = null;
    }
    if (!ref) return json(res, 500, { success: false, message: 'Tidak dapat menjana kod rujukan. Cuba lagi.' });
    const notified = await notifyTelegram(`PERMOHONAN JOBCAREER BARU\nJawatan: ${job}\nTelefon: ${phone}\nKod rujukan: ${ref}\nPersetujuan: Diberikan`);
    return json(res, 200, {
      success: true,
      telegram_notified: notified,
      message: notified ? 'Permohonan berjaya dihantar.' : 'Permohonan tersimpan. Notifikasi admin tertunda.',
      reference: ref
    });
  } catch (error) {
    console.error('Application API error:', error);
    return json(res, 500, { success: false, message: 'Tidak dapat menyimpan permohonan. Sila cuba lagi.' });
  }
}
