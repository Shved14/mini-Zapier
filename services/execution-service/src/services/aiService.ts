import { logger } from "../utils/logger";

interface AiExplanation {
  explanation: string;
  suggestedFix: string;
}

export async function explainError(
  error: string,
  nodeType: string,
  config: Record<string, unknown>
): Promise<AiExplanation> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackExplanation(error, nodeType, config);
  }

  try {
    const prompt = buildPrompt(error, nodeType, config);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a workflow automation assistant. When given an error from a workflow step, explain what went wrong in simple terms and suggest a fix. Reply with JSON: { \"explanation\": \"...\", \"suggestedFix\": \"...\" }. Keep each under 200 characters.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      logger.error(`[aiService] OpenAI API error: ${response.status}`);
      return fallbackExplanation(error, nodeType, config);
    }

    const data = (await response.json()) as any;
    const content = data.choices?.[0]?.message?.content || "";

    try {
      const parsed = JSON.parse(content);
      return {
        explanation: parsed.explanation || "Unknown error occurred.",
        suggestedFix: parsed.suggestedFix || "Check your node configuration.",
      };
    } catch {
      return { explanation: content.slice(0, 300), suggestedFix: "Review the error details and node config." };
    }
  } catch (err: any) {
    logger.error(`[aiService] Failed to call OpenAI: ${err.message}`);
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
      return { explanation: "HTTP request failed because no URL was provided.", suggestedFix: "Add a valid URL in the node config (e.g. https://api.example.com/data)." };
    }
    if (errorLower.includes("enotfound") || errorLower.includes("getaddrinfo")) {
      return { explanation: `The domain "${config.url}" could not be resolved.`, suggestedFix: "Check the URL for typos and ensure the server is reachable." };
    }
    if (errorLower.includes("timeout")) {
      return { explanation: "The HTTP request timed out waiting for a response.", suggestedFix: "The target server may be slow or down. Try increasing the timeout or check the URL." };
    }
    if (errorLower.includes("401") || errorLower.includes("unauthorized")) {
      return { explanation: "The server rejected the request due to missing or invalid credentials.", suggestedFix: "Add an Authorization header with a valid API key or token." };
    }
    if (errorLower.includes("404")) {
      return { explanation: "The requested URL was not found on the server.", suggestedFix: "Double-check the URL path. The endpoint may have changed." };
    }
    if (errorLower.includes("500")) {
      return { explanation: "The target server returned an internal error.", suggestedFix: "This is a server-side issue. Try again later or contact the API provider." };
    }
  }

  // Email errors
  if (nodeType === "email") {
    if (!config.to || String(config.to).trim() === "") {
      return { explanation: "Email failed because no recipient address was provided.", suggestedFix: "Add a valid email address in the 'to' field." };
    }
    if (errorLower.includes("authentication") || errorLower.includes("530")) {
      return { explanation: "Email sending failed due to SMTP authentication error.", suggestedFix: "Check your SMTP credentials or use the Resend API key." };
    }
    if (errorLower.includes("resend")) {
      return { explanation: "Email sending via Resend API failed.", suggestedFix: "Verify your RESEND_API_KEY and ensure the 'from' address is authorized." };
    }
  }

  // Telegram errors
  if (nodeType === "telegram") {
    if (!config.chatId) {
      return { explanation: "Telegram message failed because no chat ID was set.", suggestedFix: "Add a valid chatId in node config." };
    }
    if (errorLower.includes("bot") || errorLower.includes("token")) {
      return { explanation: "Telegram bot token is invalid or missing.", suggestedFix: "Set a valid TELEGRAM_BOT_TOKEN in environment variables." };
    }
  }

  // Transform errors
  if (nodeType === "transform") {
    if (errorLower.includes("syntax") || errorLower.includes("unexpected")) {
      return { explanation: "The transform expression has a syntax error.", suggestedFix: "Check the JavaScript expression for typos or invalid syntax." };
    }
  }

  // Database errors
  if (nodeType === "db") {
    if (errorLower.includes("syntax")) {
      return { explanation: "SQL query has a syntax error.", suggestedFix: "Review the SQL query for missing keywords, commas, or quotes." };
    }
    if (errorLower.includes("connection")) {
      return { explanation: "Could not connect to the database.", suggestedFix: "Verify the database connection string and ensure the DB server is running." };
    }
  }

  // Generic
  return {
    explanation: `The ${nodeType} step failed with: ${error.slice(0, 150)}`,
    suggestedFix: "Review the error message and verify the node configuration is correct.",
  };
}
