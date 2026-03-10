const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key];
  if (value === undefined || value === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: parseInt(getEnv("PORT", "4000"), 10),
  DATABASE_URL: getEnv("DATABASE_URL"),
  REDIS_HOST: getEnv("REDIS_HOST", "localhost"),
  REDIS_PORT: parseInt(getEnv("REDIS_PORT", "6379"), 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_DEFAULT_CHAT_ID: process.env.TELEGRAM_DEFAULT_CHAT_ID,
   SMTP_HOST: process.env.SMTP_HOST,
   SMTP_PORT: process.env.SMTP_PORT
    ? parseInt(process.env.SMTP_PORT, 10)
    : undefined,
   SMTP_USER: process.env.SMTP_USER,
   SMTP_PASS: process.env.SMTP_PASS,
   SMTP_FROM: process.env.SMTP_FROM,
};

