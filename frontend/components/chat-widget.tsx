"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { useMemo, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey! Ask me about projects, skills, or experience.",
    },
  ]);

  const sessionId = useMemo(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `session-${Date.now()}`;
  }, []);

  async function sendMessage() {
    const message = input.trim();
    if (!message || loading) return;

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: message }, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${API_BASE}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to stream response");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let pendingSources: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const evt of events) {
          const lines = evt.split("\n");
          const event = lines.find((line) => line.startsWith("event:"))?.replace("event:", "").trim();
          const data = lines.filter((line) => line.startsWith("data:")).map((line) => line.replace("data:", "").trim()).join("\n");

          if (event === "token") {
            setMessages((prev) => {
              const copy = [...prev];
              const idx = copy.length - 1;
              copy[idx] = {
                ...copy[idx],
                content: copy[idx].content + data,
              };
              return copy;
            });
          }

          if (event === "sources") {
            try {
              pendingSources = JSON.parse(data);
            } catch {
              pendingSources = [];
            }
            setMessages((prev) => {
              const copy = [...prev];
              const idx = copy.length - 1;
              copy[idx] = {
                ...copy[idx],
                sources: pendingSources,
              };
              return copy;
            });
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I hit an issue connecting to the AI backend. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-brand-500 p-4 text-white shadow-glow transition hover:scale-105"
        type="button"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[360px] max-w-[92vw] flex-col overflow-hidden rounded-2xl border border-white/20 bg-slate-950/80 backdrop-blur"
          >
            <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold">Portfolio AI Assistant</div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((msg, i) => (
                <div key={`${msg.role}-${i}`} className={msg.role === "user" ? "text-right" : "text-left"}>
                  <p
                    className={`inline-block max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                      msg.role === "user" ? "bg-brand-500 text-white" : "bg-white/10 text-slate-100"
                    }`}
                  >
                    {msg.content || (loading && i === messages.length - 1 ? "Thinking..." : "")}
                  </p>
                  {msg.sources && msg.sources.length > 0 && (
                    <p className="mt-1 text-xs text-slate-400">Sources: {msg.sources.join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-white/10 p-3">
              <input
                className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-400"
                value={input}
                placeholder="Ask about projects or skills..."
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void sendMessage()}
              />
              <button
                className="rounded-lg bg-brand-500 px-3 py-2 text-white disabled:opacity-50"
                onClick={() => void sendMessage()}
                disabled={loading}
                type="button"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
