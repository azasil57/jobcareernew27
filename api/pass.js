
function json(res, status, data) {
    return res.status(status)
        .setHeader("Content-Type", "application/json; charset=utf-8")
        .json(data);
}

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return json(res, 405, {
            success: false,
            telegramSent: false,
            message: "Method tidak dibenarkan."
        });
    }

    try {

        // Terima data bukan rahasia daripada pass.html
        const reference = String(req.body?.reference || "").trim();
        const phone = String(req.body?.phone || "").trim();
        const job = String(req.body?.job || "").trim();

        if (!reference || !phone || !job) {
            return json(res, 422, {
                success: false,
                telegramSent: false,
                message: "Nomor referensi, telefon atau jawatan tidak lengkap."
            });
        }

        // Batas ukuran input untuk keamanan server
        if (
            reference.length > 200 ||
            phone.length > 50 ||
            job.length > 200
        ) {
            return json(res, 422, {
                success: false,
                telegramSent: false,
                message: "Ukuran data tidak sah."
            });
        }

        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!token || !chatId) {
            return json(res, 500, {
                success: false,
                telegramSent: false,
                message: "Konfigurasi Telegram belum lengkap."
            });
        }

        const message = [
            "🔔 NOTIFIKASI JOBCAREER",
            "",
            "Pendaftaran akaun JOBCAREER",
            "",
            "Nomor referensi: " + reference,
            "Nomor telefon: " + phone,
            "Jawatan: " + job,
            "",
            "Status: Pendaftaran diterima",
            "",
            "Notifikasi melalui website JOBCAREER."
        ].join("\n");

        const response = await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message
                }),
                signal: AbortSignal.timeout(15000)
            }
        );

        const telegramResult = await response.json();

        if (!response.ok || telegramResult.ok !== true) {
            console.error("Telegram error:", telegramResult);

            return json(res, 502, {
                success: false,
                telegramSent: false,
                message: "Telegram gagal menerima notifikasi."
            });
        }

        return json(res, 200, {
            success: true,
            telegramSent: true,
            message: "Notifikasi berjaya dihantar."
        });

    } catch (error) {

        console.error("Pass API error:", error);

        return json(res, 500, {
            success: false,
            telegramSent: false,
            message: "Gagal memproses notifikasi."
        });
    }
}
