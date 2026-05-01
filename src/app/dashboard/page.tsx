"use client";

import { useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/context/AuthContext";
import CameraCapture from "@/components/camera/CameraCapture";
import ResultsPanel from "@/components/recommendations/ResultsPanel";
import ChatWidget from "@/components/chat/ChatWidget";
import { getRecommendations } from "@/lib/api";
import { logActivity } from "@/lib/activityLog";
import type { FullAnalysisResult, UserPreferences } from "@/types";

function DashboardContent() {
  const { user } = useAuth();
  const [results, setResults] = useState<FullAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    occasion: "casual",
    weather: "moderate",
    budget: "medium",
  });

  const handleAnalyze = async (file: File) => {
    setLoading(true);
    setError(null);
    setResults(null);
    const uid = user?.uid;
    if (uid) logActivity(uid, "analysis_start", { occasion: preferences.occasion, weather: preferences.weather, budget: preferences.budget });
    try {
      const data = await getRecommendations(
        file,
        preferences.occasion,
        preferences.weather,
        preferences.budget
      );
      setResults(data);
      if (uid) logActivity(uid, "analysis_complete", { faceShape: data.analysis?.face_shape, bodyType: data.analysis?.body_type, skinTone: data.analysis?.skin_tone });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed. Please try again.";
      setError(msg);
      if (uid) logActivity(uid, "analysis_error", { error: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Camera & Preferences */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Capture or Upload
              </h2>
              <CameraCapture onImageReady={handleAnalyze} />
            </div>

            {/* Preference Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Preferences
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Occasion</label>
                  <select
                    value={preferences.occasion}
                    onChange={(e) => setPreferences((p) => ({ ...p, occasion: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="casual">Casual</option>
                    <option value="formal">Formal</option>
                    <option value="business">Business</option>
                    <option value="party">Party</option>
                    <option value="sport">Sport</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Weather</label>
                  <select
                    value={preferences.weather}
                    onChange={(e) => setPreferences((p) => ({ ...p, weather: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="hot">Hot</option>
                    <option value="moderate">Moderate</option>
                    <option value="cold">Cold</option>
                    <option value="rainy">Rainy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Budget</label>
                  <select
                    value={preferences.budget}
                    onChange={(e) => setPreferences((p) => ({ ...p, budget: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="low">Budget</option>
                    <option value="medium">Mid-Range</option>
                    <option value="high">Premium</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Your Recommendations
              </h2>
              <a
                href="/tryon"
                className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-100 transition"
              >
                Virtual Try-On
              </a>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 text-sm">
                <p className="font-medium mb-1">Analysis Error</p>
                <p>{error}</p>
              </div>
            )}
            <ResultsPanel results={results} loading={loading} />
          </div>
        </div>
      </main>

      {/* Chatbot */}
      <ChatWidget />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
