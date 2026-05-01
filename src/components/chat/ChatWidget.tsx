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
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={key} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={key} className="italic">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={key} className="bg-gray-100 px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
      }
      return <span key={key}>{part}</span>;
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed === "") {
      flushList();
      elements.push(<div key={`gap-${idx}`} className="h-1.5" />);
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <p key={`h3-${idx}`} className="font-semibold text-sm mt-1.5 mb-0.5">
          {renderInline(trimmed.slice(4), `h3-${idx}`)}
        </p>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <p key={`h2-${idx}`} className="font-bold text-sm mt-2 mb-0.5">
          {renderInline(trimmed.slice(3), `h2-${idx}`)}
        </p>
      );
      return;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <p key={`h1-${idx}`} className="font-bold text-base mt-2 mb-1">
          {renderInline(trimmed.slice(2), `h1-${idx}`)}
        </p>
      );
      return;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      const content = trimmed.slice(2);
      listBuffer.push(
        <li key={`li-${idx}`} className="flex gap-1.5">
          <span className="text-blue-500 mt-0.5 shrink-0">&#8226;</span>
          <span>{renderInline(content, `li-${idx}`)}</span>
        </li>
      );
      return;
    }

    flushList();
    elements.push(
      <p key={`p-${idx}`} className="my-0.5">
        {renderInline(trimmed, `p-${idx}`)}
      </p>
    );
  });

  flushList();
  return elements;
}

// Strip markdown for clean TTS reading
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
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastReplyRef = useRef<string>("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check browser support for STT/TTS
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSttSupported(!!SpeechRecognition);
    setTtsSupported("speechSynthesis" in window);
  }, []);

  // Text-to-Speech
  const speak = useCallback((text: string) => {
    if (!ttsSupported || !voiceEnabled) {
      lastReplyRef.current = text; // Store for later if user unmutes
      return;
    }
    window.speechSynthesis.cancel();
    lastReplyRef.current = text;
    const utterance = new SpeechSynthesisUtterance(stripMarkdown(text));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = "en-US";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [ttsSupported, voiceEnabled]);

  // Speech-to-Text
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);

      // Auto-send on final result
      if (event.results[event.results.length - 1].isFinal) {
        setIsListening(false);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    if (user) logActivity(user.uid, "voice_input");
  };

  const sendMessage = async (overrideInput?: string) => {
    const text = overrideInput || input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    if (user) logActivity(user.uid, "chat_message", { message: text.slice(0, 100) });

    // Stop any ongoing TTS
    if (ttsSupported) window.speechSynthesis.cancel();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
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

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, timestamp: Date.now() },
      ]);

      // Read response aloud if voice is enabled
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition flex items-center justify-center z-50"
        title="Chat with AI Stylist"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[520px] bg-white rounded-xl shadow-2xl flex flex-col border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-xl">
        <div>
          <span className="font-semibold text-white">GlamVerse Stylist</span>
          <p className="text-xs text-blue-100">AI Fashion Assistant</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Voice Toggle */}
          {ttsSupported && (
            <button
              onClick={() => {
                if (voiceEnabled) {
                  // Muting: pause current speech
                  window.speechSynthesis.pause();
                  setIsSpeaking(false);
                  setVoiceEnabled(false);
                } else {
                  // Unmuting: resume if paused, or replay last reply
                  setVoiceEnabled(true);
                  if (window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                    setIsSpeaking(true);
                  } else if (lastReplyRef.current) {
                    // Replay the last bot response
                    const utterance = new SpeechSynthesisUtterance(stripMarkdown(lastReplyRef.current));
                    utterance.rate = 1.0;
                    utterance.pitch = 1.0;
                    utterance.lang = "en-US";
                    utterance.onstart = () => setIsSpeaking(true);
                    utterance.onend = () => setIsSpeaking(false);
                    utterance.onerror = () => setIsSpeaking(false);
                    window.speechSynthesis.speak(utterance);
                  }
                }
              }}
              className={`p-1.5 rounded-lg transition ${voiceEnabled ? "bg-white/20" : "bg-white/5 opacity-50"} ${isSpeaking ? "animate-pulse" : ""}`}
              title={voiceEnabled ? "Voice ON - click to mute" : "Voice OFF - click to enable"}
            >
              {voiceEnabled ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>
          )}
          <button onClick={() => setIsOpen(false)} className="hover:opacity-75 text-white text-lg">
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-3">
              Ask me anything about fashion and styling!
            </p>
            {sttSupported && (
              <p className="text-gray-400 text-xs mb-3">
                Use the mic button to speak your question
              </p>
            )}
            <div className="flex flex-wrap gap-2 justify-center">
              {["What colors suit dark skin?", "Outfit for a wedding?", "Style tips for pear body"].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-lg text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white text-black border border-gray-200 shadow-sm rounded-bl-none"
              }`}
            >
              {msg.role === "assistant" ? formatMessage(msg.content) : msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm text-gray-500 shadow-sm rounded-bl-none">
              Typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 p-3 border-t border-gray-200 bg-white rounded-b-xl">
        {/* Mic Button (STT) */}
        {sttSupported && (
          <button
            onClick={toggleListening}
            className={`p-2 rounded-lg transition flex-shrink-0 ${
              isListening
                ? "bg-red-100 text-red-600 animate-pulse"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
            title={isListening ? "Listening... click to stop" : "Click to speak"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={isListening ? "Listening..." : "Ask about fashion..."}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
