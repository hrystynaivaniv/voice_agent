export interface Env {
  OPENAI_API_KEY: string;
  ACCESS_CODE: string;
  ALLOWED_ORIGIN: string;
  RATE_LIMIT_KV?: KVNamespace;
}

const MAX_INPUT_LENGTH = 2000;
const RATE_LIMIT_PER_HOUR = 30;

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function checkRateLimit(env: Env, ip: string): Promise<boolean> {
  if (!env.RATE_LIMIT_KV) return true;

  const key = `rl:${ip}`;
  const current = await env.RATE_LIMIT_KV.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= RATE_LIMIT_PER_HOUR) return false;

  await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 3600 });
  return true;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN;

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders(origin) });
    }

    let body: {
      accessCode?: string;
      model?: string;
      voice?: string;
      input?: string;
      instructions?: string;
    };

    try {
      body = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400, headers: corsHeaders(origin) });
    }

    if (!body.accessCode || body.accessCode !== env.ACCESS_CODE) {
      return new Response("Forbidden", { status: 403, headers: corsHeaders(origin) });
    }

    const input = (body.input || "").trim();
    if (!input) {
      return new Response("Missing input text", { status: 400, headers: corsHeaders(origin) });
    }
    if (input.length > MAX_INPUT_LENGTH) {
      return new Response(`Text too long (max ${MAX_INPUT_LENGTH} chars)`, {
        status: 400,
        headers: corsHeaders(origin),
      });
    }

    const ip = req.headers.get("CF-Connecting-IP") || "unknown";
    const allowed = await checkRateLimit(env, ip);
    if (!allowed) {
      return new Response("Rate limit exceeded, try again later", {
        status: 429,
        headers: corsHeaders(origin),
      });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: body.model || "gpt-4o-mini-tts",
        voice: body.voice || "nova",
        input,
        instructions: body.instructions || undefined,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return new Response(`OpenAI error: ${errText}`, {
        status: openaiRes.status,
        headers: corsHeaders(origin),
      });
    }

    return new Response(openaiRes.body, {
      headers: {
        ...corsHeaders(origin),
        "Content-Type": "audio/mpeg",
      },
    });
  },
};
