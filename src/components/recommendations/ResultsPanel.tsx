"use client";

import type { FullAnalysisResult } from "@/types";

interface ResultsPanelProps {
  results: FullAnalysisResult | null;
  loading: boolean;
}

export default function ResultsPanel({ results, loading }: ResultsPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-600">Analyzing your image...</span>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>Upload or capture an image to get personalized recommendations</p>
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
    <div className="space-y-6">
      {/* Analysis Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Face Shape</p>
          <p className="text-lg font-semibold capitalize">{analysis.face_shape}</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Skin Tone</p>
          <p className="text-lg font-semibold">{analysis.skin_tone}</p>
        </div>
        <div className="bg-teal-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Body Type</p>
          <p className="text-lg font-semibold capitalize">{analysis.body_type}</p>
        </div>
      </div>

      {/* Color Palette */}
      <div>
        <h3 className="font-semibold text-lg mb-2">Your Color Palette</h3>
        <div className="flex flex-wrap gap-2">
          {recommendations.color_palette.map((color) => (
            <span key={color} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {color}
            </span>
          ))}
        </div>
        {recommendations.colors_to_avoid.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Avoid:</span>
            {recommendations.colors_to_avoid.map((color) => (
              <span key={color} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                {color}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Outfit Styles */}
      <div>
        <h3 className="font-semibold text-lg mb-2">Recommended Outfits</h3>
        <div className="flex flex-wrap gap-2">
          {recommendations.outfit_styles.map((style) => (
            <span key={style} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {style}
            </span>
          ))}
        </div>
      </div>

      {/* Necklines & Accessories */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Necklines</h3>
          <ul className="space-y-1">
            {recommendations.neckline_suggestions.map((item) => (
              <li key={item} className="text-sm text-gray-700">- {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Accessories</h3>
          <ul className="space-y-1">
            {recommendations.accessory_suggestions.map((item) => (
              <li key={item} className="text-sm text-gray-700">- {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
