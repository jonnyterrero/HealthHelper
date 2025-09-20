import { NextResponse } from "next/server";

export const runtime = "edge"; // better streaming latency

// Types coming from the client
interface ClientMessage { role: "user" | "assistant" | "system"; content: string }

function buildSystemPrompt() {
  return `You are MindTrack, a supportive mental health assistant embedded in a personal health tracker.
- Be concise, warm, and practical.
- Prefer small steps: sleep hygiene, breathing, light movement, journaling.
- Never provide diagnoses or emergency instructions. If the user mentions self-harm or crisis, encourage contacting local emergency services or hotlines.
- You can reference recent metrics when the user shares them (mood, stress, sleep).`;
}

function chooseProvider(explicit?: string) {
  const p = (explicit || "").toLowerCase();
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  if (p === "openai" && hasOpenAI) return "openai" as const;
  if (p === "anthropic" && hasAnthropic) return "anthropic" as const;
  // default preference order
  if (hasOpenAI) return "openai" as const;
  if (hasAnthropic) return "anthropic" as const;
  return null;
}

async function streamOpenAI(messages: ClientMessage[], model?: string) {
  const apiKey = process.env.OPENAI_API_KEY!;
  const sys = buildSystemPrompt();
  // Map to OpenAI format
  const payload = {
    model: model || "gpt-4o-mini",
    stream: true,
    messages: [
      { role: "system", content: sys },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    temperature: 0.3,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok || !res.body) throw new Error("openai_failed");

  // Convert SSE -> raw text stream
  const transform = new TransformStream();
  const writer = transform.writable.getWriter();
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  (async () => {
    let buffer = "";
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const chunk of parts) {
          for (const line of chunk.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                await writer.write(new TextEncoder().encode(delta));
              }
            } catch {}
          }
        }
      }
    } finally {
      await writer.close();
    }
  })();

  return new Response(transform.readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function streamAnthropic(messages: ClientMessage[], model?: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const sys = buildSystemPrompt();

  // Anthropic Messages API with streaming
  // We'll concatenate multi-turn context as an array as-is (Anthropic supports role user/assistant)
  const payload = {
    model: model || "claude-3-5-haiku-latest",
    max_tokens: 1024,
    temperature: 0.3,
    stream: true,
    system: sys,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  } as any;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok || !res.body) throw new Error("anthropic_failed");

  const transform = new TransformStream();
  const writer = transform.writable.getWriter();
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  (async () => {
    let buffer = "";
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const evt of events) {
          for (const line of evt.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              // Look for text deltas
              if (json.type === "content_block_delta" && json.delta?.type === "text_delta" && json.delta.text) {
                await writer.write(new TextEncoder().encode(json.delta.text));
              }
            } catch {}
          }
        }
      }
    } finally {
      await writer.close();
    }
  })();

  return new Response(transform.readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = (body?.messages || []) as { role: string; content: string }[];
    const provider = body?.provider as string | undefined;
    const model = body?.model as string | undefined;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages_required" }, { status: 400 });
    }

    const chosen = chooseProvider(provider);
    if (!chosen) {
      return NextResponse.json({ error: "no_provider_configured" }, { status: 400 });
    }

    const safeMessages: ClientMessage[] = messages
      .filter((m) => m && m.role && m.content)
      .map((m) => ({ role: m.role as any, content: String(m.content) }))
      .slice(-30); // cap history

    if (chosen === "openai") {
      return await streamOpenAI(safeMessages, model);
    } else {
      return await streamAnthropic(safeMessages, model);
    }
  } catch (e) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}