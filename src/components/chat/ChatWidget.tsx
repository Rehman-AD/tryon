"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/activityLog";

function formatMessage(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: React.ReactNode[] = [];
  let listKey = 0;

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="ml-3 my-1 space-y-0.5">
          {listBuffer}
        </ul>
      );
      listBuffer = [];
    }
  };

  const renderInline = (str: string, keyPrefix: string): React.ReactNode[] => {
    const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      const key = `${keyPrefix}-${i}`;
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={key} className="font-semibold">{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={key} className="italic">{part.slice(1, -1)}</em>;
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={key} className="bg-purple-100 text-purple-700 px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
      return <span key={key}>{part}</span>;
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed === "") {
      flushList();
      elements.push(<div key={`gap-${idx}`} className="h-1" />);
      return;
    }
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(<p key={`h3-${idx}`} className="font-semibold text-sm mt-1.5 mb-0.5">{renderInline(trimmed.slice(4), `h3-${idx}`)}</p>);
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(<p key={`h2-${idx}`} className="font-bold text-sm mt-2 mb-0.5">{renderInline(trimmed.slice(3), `h2-${idx}`)}</p>);
      return;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(<p key={`h1-${idx}`} className="font-bold text-base mt-2 mb-1">{renderInline(trimmed.slice(2), `h1-${idx}`)}</p>);
      return;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      listBuffer.push(
        <li key={`li-${idx}`} className="flex gap-1.5">
          <span className="text-purple-400 mt-0.5 shrink-0">&#8226;</span>
          <span>{renderInline(trimmed.slice(2), `li-${idx}`)}</span>
        </li>
      );
      return;
    }
    flushList();
    elements.push(<p key={`p-${idx}`} className="my-0.5">{renderInline(trimmed, `p-${idx}`)}</p>);
  });

  flushList();
  return elements;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,3}\s/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[-•]\s/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, ". ");
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const QUICK_QUESTIONS = [
  "What colors suit me?",
  "Outfit for a wedding?",
  "Tips for my body type",
  "Trending styles 2025",
];

export default function ChatWidget() {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastReplyRef = useRef<string>("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSttSupported(!!SR);
    setTtsSupported("speechSynthesis" in window);
  }, []);

  const speak = useCallback((text: string) => {
    if (!ttsSupported || !voiceEnabled) { lastReplyRef.current = text; return; }
    window.speechSynthesis.cancel();
    lastReplyRef.current = text;
    const u = new SpeechSynthesisUtterance(stripMarkdown(text));
    u.rate = 1.0; u.pitch = 1.0; u.lang = "en-US";
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [ttsSupported, voiceEnabled]);

  const toggleListening = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setInput(t);
      if (e.results[e.results.length - 1].isFinal) setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    if (user) logActivity(user.uid, "voice_input");
  };

  const sendMessage = async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    if (user) logActivity(user.uid, "chat_message", { message: text.slice(0, 100) });
    if (ttsSupported) window.speechSynthesis.cancel();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          userContext: userProfile ? {
            name: userProfile.name,
            bodyType: userProfile.bodyType,
            skinTone: userProfile.skinTone,
            faceShape: userProfile.faceShape,
            gender: userProfile.gender,
            sizePreference: userProfile.preferences?.sizePreference,
            stylePreference: userProfile.preferences?.stylePreference,
          } : undefined,
        }),
      });
      const data = await res.json();
      const reply = data.reply;
      setMessages((prev) => [...prev, { role: "assistant", content: reply, timestamp: Date.now() }]);
      speak(reply);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again.", timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const firstName = userProfile?.name?.split(" ")[0] || "";

  /* ── FAB ── */
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 group"
        title="Chat with AI Stylist"
      >
        <span className="absolute inset-0 rounded-full bg-violet-500 opacity-30 animate-ping group-hover:opacity-0" />
        <span className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-600 rounded-full shadow-lg shadow-violet-500/40 hover:shadow-violet-500/60 transition-all duration-200 hover:scale-105">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </span>
      </button>
    );
  }

  /* ── Chat Window ── */
  return (
    <div className="fixed bottom-6 right-6 w-[400px] h-[600px] flex flex-col rounded-2xl shadow-2xl shadow-violet-200/60 border border-violet-100 bg-white z-50 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm leading-tight">GlamVerse Stylist</p>
            <p className="text-violet-200 text-xs">{isSpeaking ? "Speaking..." : "Online · AI Fashion Assistant"}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {ttsSupported && (
            <button
              onClick={() => {
                if (voiceEnabled) {
                  window.speechSynthesis.pause();
                  setIsSpeaking(false);
                  setVoiceEnabled(false);
                } else {
                  setVoiceEnabled(true);
                  if (window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                    setIsSpeaking(true);
                  } else if (lastReplyRef.current) {
                    speak(lastReplyRef.current);
                  }
                }
              }}
              title={voiceEnabled ? "Mute voice" : "Unmute voice"}
              className={`p-1.5 rounded-lg transition ${voiceEnabled ? "bg-white/20 text-white" : "bg-white/10 text-white/40"} ${isSpeaking ? "animate-pulse" : ""}`}
            >
              {voiceEnabled ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-slate-50 to-white">

        {/* Empty / Welcome state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center pt-4 pb-2 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-300/50">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">
                {firstName ? `Hey ${firstName}, I'm your AI Stylist!` : "Hi! I'm your AI Stylist!"}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Ask me anything about fashion, outfits, or styling tips.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center w-full">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-3 py-1.5 bg-white border border-violet-200 text-violet-700 rounded-full text-xs font-medium hover:bg-violet-50 hover:border-violet-400 transition shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>

            {/* AI avatar */}
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 mb-1">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            )}

            <div className={`flex flex-col gap-0.5 max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-br-sm shadow-md shadow-violet-200"
                    : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm"
                }`}
              >
                {msg.role === "assistant" ? formatMessage(msg.content) : msg.content}
              </div>
              <span className="text-[10px] text-gray-400 px-1">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-3 py-3 border-t border-gray-100 bg-white flex items-center gap-2">
        {sttSupported && (
          <button
            onClick={toggleListening}
            title={isListening ? "Listening — click to stop" : "Speak your question"}
            className={`p-2.5 rounded-xl transition shrink-0 ${
              isListening
                ? "bg-red-50 text-red-500 animate-pulse ring-2 ring-red-200"
                : "bg-gray-100 text-gray-500 hover:bg-violet-50 hover:text-violet-600"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder={isListening ? "Listening..." : "Ask about fashion..."}
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition disabled:opacity-60"
        />

        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="p-2.5 bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-xl shadow-sm shadow-violet-300 hover:shadow-violet-400 hover:scale-105 disabled:opacity-40 disabled:scale-100 disabled:shadow-none transition-all duration-150 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
