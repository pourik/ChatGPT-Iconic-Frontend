"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const starters = [
  "Design a launch announcement for a new AI product.",
  "Explain recursion like I'm learning it for the first time.",
  "Outline a 30-day frontend interview prep plan.",
  "Turn a rough idea into a polished product brief."
];

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  async function sendMessage(promptOverride?: string) {
    const nextPrompt = (promptOverride ?? input).trim();

    if (!nextPrompt || isLoading) {
      return;
    }

    const userMessage: Message = {
      id: createId(),
      role: "user",
      content: nextPrompt
    };
    const assistantId = createId();

    setInput("");
    setIsLoading(true);
    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: "assistant", content: "" }
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((message) => ({
            role: message.role,
            content: message.content
          }))
        })
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch chat response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + chunk }
              : message
          )
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";

      setMessages((current) =>
        current.map((entry) =>
          entry.id === assistantId
            ? {
                ...entry,
                content: `I hit an error while responding: ${message}`
              }
            : entry
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">AI</div>
          <div>
            <p className="eyebrow">Built from the article</p>
            <h1>Iconic Frontend</h1>
          </div>
        </div>

        <button
          className="new-chat"
          onClick={() => {
            setMessages([]);
            setInput("");
          }}
          type="button"
        >
          New chat
        </button>

        <div className="sidebar-panel">
          <p className="panel-label">What this includes</p>
          <ul>
            <li>Streaming responses</li>
            <li>ChatGPT-inspired layout</li>
            <li>Responsive glassmorphism styling</li>
            <li>Drop-in OpenAI API wiring</li>
          </ul>
        </div>

        <div className="sidebar-panel muted">
          <p className="panel-label">Suggested prompts</p>
          {starters.map((starter) => (
            <button
              key={starter}
              className="starter"
              onClick={() => void sendMessage(starter)}
              type="button"
            >
              {starter}
            </button>
          ))}
        </div>
      </aside>

      <section className="chat-area">
        <header className="chat-header">
          <div>
            <p className="eyebrow">Conversational UI</p>
            <h2>How can I help you today?</h2>
          </div>
          <div className="status-pill">
            <span className="status-dot" />
            {isLoading ? "Streaming" : "Ready"}
          </div>
        </header>

        <div className="chat-viewport" ref={viewportRef}>
          {messages.length === 0 ? (
            <section className="hero-card">
              <p className="hero-label">Article-inspired implementation</p>
              <h3>A modern remake of the classic ChatGPT frontend tutorial.</h3>
              <p className="hero-copy">
                The original post walks through a minimal Next.js chat app. This
                version keeps that spirit, but gives it a more polished and
                product-ready interface.
              </p>
            </section>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className={`message message-${message.role}`}
              >
                <div className="avatar">
                  {message.role === "user" ? "You" : "AI"}
                </div>
                <div className="bubble">
                  {message.content || (
                    <span className="typing">
                      Thinking
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <label className="composer-shell">
            <textarea
              className="composer-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Message the model..."
              rows={1}
              value={input}
            />
            <button className="send-button" disabled={isLoading} type="submit">
              Send
            </button>
          </label>
          <p className="composer-caption">
            Add your `OPENAI_API_KEY` in `.env.local` and start chatting.
          </p>
        </form>
      </section>
    </main>
  );
}
