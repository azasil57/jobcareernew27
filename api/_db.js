import { sql } from '@vercel/postgres';

let initialized;
export async function dbReady() {
  if (!initialized) {
    initialized = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS applications (
        id BIGSERIAL PRIMARY KEY,
        ref_code VARCHAR(20) UNIQUE NOT NULL,
        job VARCHAR(150) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'Baru',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS accounts (
        id BIGSERIAL PRIMARY KEY,
        email VARCHAR(190) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
    })();
  }
  return initialized;
}

export function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').send(body);
}

export async function notifyTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(12000)
    });
    const data = await response.json();
    return response.ok && data.ok === true;
  } catch (error) {
    console.error('Telegram notification failed:', error?.message || error);
    return false;
  }
}
