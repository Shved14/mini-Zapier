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
};

