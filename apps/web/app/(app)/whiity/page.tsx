"use client";

import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
}

export default function WhiityPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const r = await fetch("/api/whiity/conversations");
      if (r.ok) {
        const data = await r.json();
        setConversations(data.conversations ?? []);
      }
    } catch {}
  }

  async function startConversation(convId: string) {
    const r = await fetch(`/api/whiity/conversations/${convId}`);
    if (r.ok) {
      const data = await r.json();
      setMessages(
        (data.messages ?? []).map((m: { id: string; role: string; content: string }) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      );
      setConversationId(convId);
      setShowHistory(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/whiity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          conversationId,
          language: "de",
          useMemory: true,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(typeof data.error === "string" ? data.error : "Fehler");
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        return;
      }

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message.content,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    } finally {
      setLoading(false);
    }
  }

  function newChat() {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }

  return (
    <div>
      <div className="page-header">
        <h1>
          Whiity <span>KI-Assistent</span>
        </h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-secondary" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? "Schließen" : "Verlauf"}
          </button>
          <button className="btn btn-secondary" onClick={newChat}>
            + Neu
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
        {/* Chat Area */}
        <div style={{ flex: 1 }}>
          <div
            className="card"
            style={{
              minHeight: "400px",
              maxHeight: "70vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {messages.length === 0 && !loading && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--whiite-text-soft)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🤖</div>
                <p style={{ fontSize: "1rem", marginBottom: "8px", fontWeight: 600 }}>Hallo, ich bin Whiity.</p>
                <p style={{ fontSize: "0.85rem" }}>
                  Frag mich anything — Texte, Bilder, Ideen, Strategie.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    maxWidth: "75%",
                    padding: "12px 16px",
                    borderRadius: "16px",
                    background:
                      msg.role === "user" ? "var(--whiite-dark)" : "var(--whiite-light)",
                    color: msg.role === "user" ? "white" : "var(--whiite-text)",
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    border: msg.role === "assistant" ? "1px solid var(--whiite-border)" : "none",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--whiite-gold)" }}>
                <div className="spinner" />
                <span style={{ fontSize: "0.9rem" }}>Whiity denkt...</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {error && <div className="error-msg" style={{ marginTop: "12px" }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ marginTop: "16px" }}>
            <div className="input-area">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Was kann ich für dich tun?"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as unknown as React.FormEvent);
                  }
                }}
              />
              <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
                Senden
              </button>
            </div>
          </form>
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <div
            style={{
              width: "240px",
              background: "var(--glass-bg)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--glass-border)",
              borderRadius: "18px",
              padding: "20px",
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "14px" }}>Verlauf</h3>
            {conversations.length === 0 && (
              <p style={{ fontSize: "0.8rem", color: "var(--whiite-silver)" }}>Noch keine Gespräche.</p>
            )}
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => startConversation(conv.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid",
                  borderColor: conversationId === conv.id ? "var(--whiite-dark)" : "var(--whiite-border)",
                  background: conversationId === conv.id ? "var(--whiite-dark)" : "var(--whiite)",
                  color: conversationId === conv.id ? "white" : "var(--whiite-text)",
                  cursor: "pointer",
                  marginBottom: "8px",
                  fontSize: "0.85rem",
                }}
              >
                {conv.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
