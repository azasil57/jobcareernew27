
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
    const response = await fetch(
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
        signal: AbortSignal.timeout(12000)
      }
    );

    const result = await response.json();

    // Pastikan Telegram benar-benar menerima pesan
    if (!response.ok || result.ok !== true) {
      console.error(
        'Telegram delivery failed:',
        result.description || response.status
      );

      return json(res, 502, {
        success: false,
        message: 'Penghantaran gagal. Sila cuba lagi.'
      });
    }

    // Berhasil
    return json(res, 200, {
      success: true,
      telegram_notified: true,
      message: 'Permohonan berjaya dihantar.',
      reference: ref
    });

  } catch (error) {
    console.error(
      'Application API error:',
      error?.message || error
    );

    return json(res, 500, {
      success: false,
      message: 'Tidak dapat menghantar permohonan. Sila cuba lagi.'
    });
  }
}
