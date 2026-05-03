"use client";

import type { FullAnalysisResult } from "@/types";

interface ResultsPanelProps {
  results: FullAnalysisResult | null;
  loading: boolean;
}

function BulletList({ items, color = "violet" }: { items: string[]; color?: string }) {
  const dot: Record<string, string> = {
    violet: "bg-violet-500",
    green:  "bg-green-500",
    red:    "bg-red-400",
    blue:   "bg-blue-500",
    amber:  "bg-amber-500",
    teal:   "bg-teal-500",
  };
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dot[color] ?? dot.violet}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ResultsPanel({ results, loading }: ResultsPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
        <span className="ml-3 text-gray-600">Analyzing your image...</span>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center p-8 text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p className="text-sm">Upload or capture a photo to get personalized recommendations</p>
      </div>
    );
  }

  const { analysis, recommendations } = results;

  const isUnknown = (val: string) =>
    !val || val.toLowerCase() === "unknown" || val.toLowerCase() === "n/a" || val === "-";

  const allUnknown =
    isUnknown(analysis.face_shape) &&
    isUnknown(analysis.skin_tone) &&
    isUnknown(analysis.body_type);

  if (allUnknown) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-800">Image could not be analyzed</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs">
            We couldn&apos;t detect a face or body in your photo. Please upload a clear, well-lit photo of yourself and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Analysis Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-violet-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-0.5">Face Shape</p>
          <p className="font-semibold capitalize text-violet-800">{analysis.face_shape}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-0.5">Skin Tone</p>
          <p className="font-semibold text-amber-800">{analysis.skin_tone}</p>
        </div>
        <div className="bg-teal-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-0.5">Body Type</p>
          <p className="font-semibold capitalize text-teal-800">{analysis.body_type}</p>
        </div>
      </div>

      {/* Color Palette */}
      {recommendations.color_palette?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Your Color Palette
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {recommendations.color_palette.map((color) => (
              <span key={color} className="px-3 py-1 bg-green-50 text-green-800 border border-green-200 rounded-full text-xs font-medium">
                {color}
              </span>
            ))}
          </div>
          {recommendations.colors_to_avoid?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5 font-medium">Colors to avoid:</p>
              <div className="flex flex-wrap gap-2">
                {recommendations.colors_to_avoid.map((color) => (
                  <span key={color} className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-medium">
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Outfit Styles */}
      {recommendations.outfit_styles?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Recommended Outfit Styles
          </h3>
          <BulletList items={recommendations.outfit_styles} color="blue" />
        </div>
      )}

      {/* Occasion & Weather */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recommendations.occasion_items?.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              For This Occasion
            </h3>
            <BulletList items={recommendations.occasion_items} color="violet" />
          </div>
        )}
        {(recommendations.weather_additions?.length > 0 || recommendations.weather_removals?.length > 0) && (
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Weather Tips
            </h3>
            {recommendations.weather_additions?.length > 0 && (
              <>
                <p className="text-xs text-gray-500 font-medium mb-1.5">Add:</p>
                <BulletList items={recommendations.weather_additions} color="teal" />
              </>
            )}
            {recommendations.weather_removals?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 font-medium mb-1.5">Avoid:</p>
                <BulletList items={recommendations.weather_removals} color="red" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Necklines & Accessories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recommendations.neckline_suggestions?.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              Necklines
            </h3>
            <BulletList items={recommendations.neckline_suggestions} color="teal" />
          </div>
        )}
        {recommendations.accessory_suggestions?.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Accessories
            </h3>
            <BulletList items={recommendations.accessory_suggestions} color="amber" />
          </div>
        )}
      </div>

      {/* Budget Tier */}
      {recommendations.budget_tier && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <svg className="w-5 h-5 text-violet-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-xs text-violet-600 font-medium">Budget Range</p>
            <p className="text-sm font-semibold text-violet-800 capitalize">{recommendations.budget_tier}</p>
          </div>
        </div>
      )}
    </div>
  );
}
