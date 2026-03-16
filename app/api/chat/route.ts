import { NextRequest } from "next/server";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const encoder = new TextEncoder();

function buildRequestBody(messages: ChatMessage[], model: string) {
  return {
    model,
    stream: true,
    messages
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return new Response("Missing OPENAI_API_KEY.", { status: 500 });
  }

  const { messages } = (await request.json()) as { messages?: ChatMessage[] };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response("Request must include a non-empty messages array.", {
      status: 400
    });
  }

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildRequestBody(messages, model))
  });

  if (!upstream.ok || !upstream.body) {
    const errorText = await upstream.text();
    return new Response(errorText || "OpenAI request failed.", {
      status: upstream.status || 500
    });
  }

  const reader = upstream.body.getReader();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();

          if (!trimmed.startsWith("data:")) {
            continue;
          }

          const payload = trimmed.replace(/^data:\s*/, "");

          if (payload === "[DONE]") {
            controller.close();
            return;
          }

          try {
            const parsed = JSON.parse(payload) as {
              choices?: Array<{
                delta?: {
                  content?: string;
                };
              }>;
            };
            const token = parsed.choices?.[0]?.delta?.content;

            if (token) {
              controller.enqueue(encoder.encode(token));
            }
          } catch {
            // Ignore malformed chunks from the upstream stream.
          }
        }
      }

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform"
    }
  });
}
