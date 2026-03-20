import OpenAI from "openai";
import { logger } from "../utils/logger";

interface AiExplanation {
  explanation: string;
  fix: string;
}

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export async function explainError(
  error: string,
  nodeType: string,
  config: Record<string, unknown>
): Promise<AiExplanation> {
  const client = getClient();

  if (!client) {
    logger.info("[aiService] No OPENAI_API_KEY set, using fallback");
    return fallbackExplanation(error, nodeType, config);
  }

  try {
    const prompt = buildPrompt(error, nodeType, config);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a developer assistant for a workflow automation platform (like Zapier).

Explain this error in simple terms and suggest a fix.

Respond ONLY with valid JSON in this exact format:

{
  "explanation": "...",
  "fix": "..."
}

Keep each field concise (under 250 characters). Be specific and actionable.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 400,
      response_format: { type: "json_object" },
    });

    const content = completion.choices?.[0]?.message?.content || "";

    try {
      const parsed = JSON.parse(content);
      return {
        explanation: parsed.explanation || "Unknown error occurred.",
        fix: parsed.fix || "Check your node configuration.",
      };
    } catch {
      logger.warn("[aiService] Failed to parse OpenAI JSON response, using raw text");
      return { explanation: content.slice(0, 300), fix: "Review the error details and node config." };
    }
  } catch (err: any) {
    logger.error(`[aiService] OpenAI API call failed: ${err.message}`);
    return fallbackExplanation(error, nodeType, config);
  }
}

function buildPrompt(error: string, nodeType: string, config: Record<string, unknown>): string {
  const safeConfig = Object.fromEntries(
    Object.entries(config).map(([k, v]) => {
      const val = String(v);
      if (k.toLowerCase().includes("pass") || k.toLowerCase().includes("secret") || k.toLowerCase().includes("token")) {
        return [k, "***"];
      }
      return [k, val.length > 100 ? val.slice(0, 100) + "..." : val];
    })
  );

  return `Node type: ${nodeType}\nConfig: ${JSON.stringify(safeConfig)}\nError: ${error}`;
}

function fallbackExplanation(
  error: string,
  nodeType: string,
  config: Record<string, unknown>
): AiExplanation {
  const errorLower = error.toLowerCase();

  // HTTP errors
  if (nodeType === "http") {
    if (!config.url || String(config.url).trim() === "") {
      return { explanation: "HTTP request failed because no URL was provided.", fix: "Add a valid URL in the node config (e.g. https://api.example.com/data)." };
    }
    if (errorLower.includes("enotfound") || errorLower.includes("getaddrinfo")) {
      return { explanation: `The domain "${config.url}" could not be resolved.`, fix: "Check the URL for typos and ensure the server is reachable." };
    }
    if (errorLower.includes("timeout")) {
      return { explanation: "The HTTP request timed out waiting for a response.", fix: "The target server may be slow or down. Try increasing the timeout or check the URL." };
    }
    if (errorLower.includes("401") || errorLower.includes("unauthorized")) {
      return { explanation: "The server rejected the request due to missing or invalid credentials.", fix: "Add an Authorization header with a valid API key or token." };
    }
    if (errorLower.includes("404")) {
      return { explanation: "The requested URL was not found on the server.", fix: "Double-check the URL path. The endpoint may have changed." };
    }
    if (errorLower.includes("500")) {
      return { explanation: "The target server returned an internal error.", fix: "This is a server-side issue. Try again later or contact the API provider." };
    }
  }

  // Email errors
  if (nodeType === "email") {
    if (!config.to || String(config.to).trim() === "") {
      return { explanation: "Email failed because no recipient address was provided.", fix: "Add a valid email address in the 'to' field." };
    }
    if (errorLower.includes("authentication") || errorLower.includes("530")) {
      return { explanation: "Email sending failed due to SMTP authentication error.", fix: "Check your SMTP credentials or use the Resend API key." };
    }
    if (errorLower.includes("resend")) {
      return { explanation: "Email sending via Resend API failed.", fix: "Verify your RESEND_API_KEY and ensure the 'from' address is authorized." };
    }
  }

  // Telegram errors
  if (nodeType === "telegram") {
    if (!config.chatId) {
      return { explanation: "Telegram message failed because no chat ID was set.", fix: "Add a valid chatId in node config." };
    }
    if (errorLower.includes("bot") || errorLower.includes("token")) {
      return { explanation: "Telegram bot token is invalid or missing.", fix: "Set a valid TELEGRAM_BOT_TOKEN in environment variables." };
    }
  }

  // Transform errors
  if (nodeType === "transform") {
    if (errorLower.includes("syntax") || errorLower.includes("unexpected")) {
      return { explanation: "The transform expression has a syntax error.", fix: "Check the JavaScript expression for typos or invalid syntax." };
    }
  }

  // Database errors
  if (nodeType === "db") {
    if (errorLower.includes("syntax")) {
      return { explanation: "SQL query has a syntax error.", fix: "Review the SQL query for missing keywords, commas, or quotes." };
    }
    if (errorLower.includes("connection")) {
      return { explanation: "Could not connect to the database.", fix: "Verify the database connection string and ensure the DB server is running." };
    }
  }

  // Generic
  return {
    explanation: `The ${nodeType} step failed with: ${error.slice(0, 150)}`,
    fix: "Review the error message and verify the node configuration is correct.",
  };
}
