import { sql } from '@vercel/postgres';

let initialized;

export async function dbReady() {

  if (!initialized) {

    initialized = (async () => {

      await sql`
        CREATE TABLE IF NOT EXISTS applications (
          id BIGSERIAL PRIMARY KEY,
          ref_code VARCHAR(20) UNIQUE NOT NULL,
          job VARCHAR(150) NOT NULL,
          phone VARCHAR(30) NOT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'Baru',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS accounts (
          id BIGSERIAL PRIMARY KEY,
          email VARCHAR(190) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

    })().catch(error => {
      initialized = undefined;
      throw error;
    });

  }

  return initialized;
}

export function json(res, status, body) {

  return res
    .status(status)
    .setHeader(
      'Content-Type',
      'application/json; charset=utf-8'
    )
    .send(body);

}

export async function notifyTelegram(message) {

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error('Telegram token atau chat ID belum dikonfigurasi.');
    return false;
  }

  try {

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

    const data = await response.json();

    if (!response.ok || data.ok !== true) {
      console.error('Telegram API error:', data);
      return false;
    }

    console.log('Telegram message successfully sent.');

    return true;

  } catch (error) {

    console.error(
      'Telegram notification failed:',
      error?.message || error
    );

    return false;
  }
}