
import { randomBytes } from 'node:crypto';

function json(res, status, body) {
  return res
    .status(status)
    .setHeader('Content-Type', 'application/json; charset=utf-8')
    .send(body);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, {
      success: false,
      message: 'Method tidak dibenarkan.'
    });
  }

  try {
    const body = req.body || {};

    const job = String(body.job || '').trim();
    const phone = String(body.phone || '')
      .replace(/[\s\-()]/g, '');
    const consent = body.consent === true;

    // Validasi formulir
    if (
      !job ||
      job.length > 150 ||
      !consent ||
      !/^(?:\+?60|0)1\d{7,9}$/.test(phone)
    ) {
      return json(res, 422, {
        success: false,
        message: 'Sila semak jawatan, nombor telefon dan persetujuan anda.'
      });
    }

    // Ambil konfigurasi Telegram
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error('Telegram environment variables are missing.');

      return json(res, 500, {
        success: false,
        message: 'Konfigurasi Telegram belum lengkap.'
      });
    }

    // Buat kod referensi tanpa database
    const ref = 'JC-' +
      randomBytes(4).toString('hex').toUpperCase();

    // Susun pesan lamaran
    const message = [
      '📩 PERMOHONAN JOBCareer BARU',
      '',
      `Jawatan: ${job}`,
      `Telefon: ${phone}`,
      `Kod rujukan: ${ref}`,
      'Persetujuan: Diberikan',
      '',
      'Permohonan diterima melalui website JobCareer.'
    ].join('\n');

    // Kirim langsung ke Telegram
    
// Kirim langsung ke Telegram
const startedAt = Date.now();

let response;

try {
  response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      }),
      signal: AbortSignal.timeout(20000)
    }
  );
} catch (error) {
  console.error('Telegram connection error:', {
    name: error?.name,
    message: error?.message,
    elapsed: Date.now() - startedAt
  });

  return json(res, 502, {
    success: false,
    message: 'Tidak dapat menghubungi Telegram. Sila cuba lagi.'
  });
}

let result;

try {
  result = await response.json();
} catch (error) {
  console.error('Invalid Telegram response:', error?.message);

  return json(res, 502, {
    success: false,
    message: 'Respons Telegram tidak dapat dibaca.'
  });
}

console.log('Telegram API result:', {
  status: response.status,
  success: result.ok === true,
  description: result.description,
  elapsed: Date.now() - startedAt
});

if (!response.ok || result.ok !== true) {
  return json(res, 502, {
    success: false,
    message: 'Telegram gagal menerima permohonan. Sila cuba lagi.'
  });
}

