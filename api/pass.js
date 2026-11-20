
function json(res, status, data) {
  return res.status(status)
    .setHeader('Content-Type', 'application/json; charset=utf-8')
    .json(data);
}

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return json(res, 405, {
      success: false,
      message: 'Method tidak dibenarkan.'
    });
  }

  try {

    // Ambil status pendaftaran
    const status = String(req.body?.status || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const job = String(req.body?.job || '').trim();

    if (!status) {
      return json(res, 422, {
        success: false,
        message: 'Status pendaftaran tidak tersedia.'
      });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return json(res, 500, {
        success: false,
        message: 'Konfigurasi Telegram belum lengkap.'
      });
    }

    // Notifikasi tanpa password atau data rahasia
    const message = [
      '🔔 NOTIFIKASI JOBCAREER',
      '',
      'Pembuatan akun JOBCAREER',
      '',
      `Nomor telefon: ${phone || '-'}`,
      `Jawatan: ${job || '-'}`,
      `Status: ${status}`,
      '',
      'Notifikasi diterima melalui website JOBCAREER.'
    ].join('\n');

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
        signal: AbortSignal.timeout(15000)
      }
    );

    const result = await response.json();

    if (!response.ok || result.ok !== true) {
      console.error('Telegram error:', result);

      return json(res, 502, {
        success: false,
        message: 'Telegram gagal menerima notifikasi.'
      });
    }

    return json(res, 200, {
      success: true,
      telegramSent: true,
      message: 'Notifikasi JOBCAREER berhasil dikirim.'
    });

  } catch (error) {

    console.error('Telegram API error:', error);

    return json(res, 500, {
      success: false,
      message: 'Gagal mengirim notifikasi.'
    });

  }
}
