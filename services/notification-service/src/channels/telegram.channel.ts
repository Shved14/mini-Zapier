import axios from "axios";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

export async function sendTelegram(chatId: string, title: string, message: string): Promise<void> {
  if (!BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  const text = `<b>${title}</b>\n\n${message}`;

  await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  });
}
