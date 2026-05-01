"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

function useScrollAnimate() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    const el = ref.current;
    if (el) {
      el.querySelectorAll(".scroll-animate").forEach((child) => observer.observe(child));
    }
    return () => observer.disconnect();
  }, []);
  return ref;
}

export default function Home() {
  const { user } = useAuth();
  const containerRef = useScrollAnimate();

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-gray-950/90 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-extrabold tracking-tight">
            Glam<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Verse</span>
          </h1>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/store"
                className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-bold hover:opacity-90 transition shadow-lg shadow-purple-500/25"
              >
                Shop Now
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="px-4 py-2 text-white/70 hover:text-white text-sm font-semibold transition">
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-bold hover:opacity-90 transition shadow-lg shadow-purple-500/25"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ───── Section 1: Hero ───── */}
      <section className="min-h-screen flex items-center justify-center relative px-4">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/15 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-purple-300 text-sm font-medium px-5 py-2 rounded-full mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              AI-Powered Fashion E-Commerce
            </div>
          </div>
          <h1 className="animate-fade-up delay-100 text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight mb-8">
            Fashion Meets
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
              Intelligence
            </span>
          </h1>
          <p className="animate-fade-up delay-200 text-lg sm:text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
            Try clothes on virtually before you buy. Our AI analyzes your body type,
            skin tone, and style — then shows you exactly how any outfit looks on you.
          </p>
          <div className="animate-fade-up delay-300 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={user ? "/store" : "/auth/signup"}
              className="px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:opacity-90 transition shadow-2xl shadow-purple-500/30"
            >
              Start Shopping
            </Link>
            <a
              href="#how-it-works"
              className="px-10 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-lg hover:bg-white/10 transition backdrop-blur-sm"
            >
              How It Works
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ───── Section 2: Stats ───── */}
      <section className="py-16 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "7+", label: "AI Modules" },
            { value: "50+", label: "Fashion Items" },
            { value: "< 3s", label: "Analysis Speed" },
            { value: "100%", label: "Personalized" },
          ].map((stat, i) => (
            <div key={stat.label} className={`scroll-animate`} style={{ transitionDelay: `${i * 100}ms` }}>
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{stat.value}</p>
              <p className="text-sm text-white/40 mt-2 font-medium uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Section 3: How It Works ───── */}
      <section id="how-it-works" className="py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 scroll-animate">
            <p className="text-sm font-bold text-purple-400 uppercase tracking-[0.2em] mb-3">How It Works</p>
            <h2 className="text-4xl sm:text-5xl font-black">Three Simple Steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Browse & Pick", desc: "Explore our AI-curated collection. Filter by category, style, tags, or occasion.", gradient: "from-purple-500 to-violet-500" },
              { step: "02", title: "Virtual Try-On", desc: "Upload your photo once. Our AI generates realistic previews of you wearing any outfit.", gradient: "from-pink-500 to-rose-500" },
              { step: "03", title: "Shop Confidently", desc: "Add to cart and checkout. No guesswork, no returns — you see it on you first.", gradient: "from-orange-500 to-amber-500" },
            ].map((f, i) => (
              <div
                key={f.step}
                className="scroll-animate bg-white/[0.03] border border-white/5 rounded-3xl p-8 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500 group"
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${f.gradient} rounded-2xl flex items-center justify-center text-white font-black text-lg mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {f.step}
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Section 4: AI Modules ───── */}
      <section className="py-28 px-4 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-animate">
            <p className="text-sm font-bold text-purple-400 uppercase tracking-[0.2em] mb-3">Technology</p>
            <h2 className="text-4xl sm:text-5xl font-black">Powered by AI</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Face Detection", tech: "YOLO", gradient: "from-blue-500 to-cyan-500" },
              { name: "Skin Tone Analysis", tech: "CNN", gradient: "from-orange-500 to-amber-500" },
              { name: "Body Type Analysis", tech: "MediaPipe", gradient: "from-green-500 to-emerald-500" },
              { name: "Smart Recommendations", tech: "AI Engine", gradient: "from-purple-500 to-violet-500" },
              { name: "Virtual Try-On", tech: "Gemini AI", gradient: "from-pink-500 to-rose-500" },
              { name: "AI Chatbot", tech: "Claude", gradient: "from-indigo-500 to-blue-500" },
              { name: "Voice Interaction", tech: "Speech API", gradient: "from-teal-500 to-cyan-500" },
              { name: "E-Commerce Store", tech: "Full Stack", gradient: "from-violet-500 to-purple-500" },
            ].map((m, i) => (
              <div
                key={m.name}
                className="scroll-animate bg-white/[0.03] border border-white/5 p-5 rounded-2xl hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300"
                style={{ transitionDelay: `${(i % 4) * 100}ms` }}
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${m.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                  <span className="text-white text-xs font-black">{m.tech.slice(0, 2).toUpperCase()}</span>
                </div>
                <p className="font-bold text-white text-sm">{m.name}</p>
                <p className="text-xs text-white/30 mt-0.5">{m.tech}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Section 5: CTA ───── */}
      <section className="py-28 px-4">
        <div className="max-w-3xl mx-auto text-center scroll-animate">
          <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-[2.5rem] p-16 overflow-hidden shadow-2xl shadow-purple-500/20">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full blur-2xl" />
            <div className="relative">
              <h2 className="text-4xl sm:text-5xl font-black mb-5">Ready to Transform Your Style?</h2>
              <p className="text-white/70 mb-10 text-lg max-w-md mx-auto">
                Join GlamVerse and experience AI-powered fashion like never before.
              </p>
              <Link
                href={user ? "/store" : "/auth/signup"}
                className="inline-block px-10 py-4 bg-white text-gray-900 rounded-xl font-black text-lg hover:bg-gray-100 transition shadow-2xl"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-white/5 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white/40">
              Glam<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Verse</span>
            </p>
            <p className="text-xs text-white/20 mt-1">FYP by Salman Rashid & M.Zain Ul Hassan | LGU 2026</p>
          </div>
          <p className="text-xs text-white/20">
            Supervised by Mr. Mumtaz Ahmad
          </p>
        </div>
      </footer>
    </div>
  );
}
