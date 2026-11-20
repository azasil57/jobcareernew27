import { randomBytes } from 'node:crypto';

function json(res, status, body) {
  res.setHeader(
    'Content-Type',
    'application/json; charset=utf-8'
  );
  return res.status(status).json(body);
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

    // Konfigurasi Telegram
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error('Telegram configuration missing.');
      return json(res, 500, {
        success: false,
        message: 'Konfigurasi Telegram belum lengkap.'
      });
    }

    // Generate reference
    const ref = 'JC-' + randomBytes(4).toString('hex').toUpperCase();

    // Susun pesan Telegram
    const message = [
      '📩 PERMOHONAN JOBCareer BARU',
      '',
      `Jawatan: ${job}`,
      `Telefon: ${phone}`,
      'Persetujuan: Diberikan',
      '',
      'Permohonan diterima melalui website JobCareer.',
      `No. Rujukan: ${ref}`
    ].join('\n');

    // Kirim ke Telegram
    const startedAt = Date.now();
    let response;

    try {
      response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

    // Baca respons Telegram
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
      elapsed: Date.now() - startedAt
    });

    if (!response.ok || result.ok !== true) {
      return json(res, 502, {
        success: false,
        message: 'Telegram gagal menerima permohonan. Sila cuba lagi.'
      });
    }

    // Berhasil dikirim
    return json(res, 200, {
      success: true,
      telegram_notified: true,
      message: 'Permohonan berjaya dihantar.',
      reference: ref
    });

  } catch (error) {
    console.error('Application API error:', error);
    return json(res, 500, {
      success: false,
      message: 'Tidak dapat menghantar permohonan. Sila cuba lagi.'
    });
  }
}
