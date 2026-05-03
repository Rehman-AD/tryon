"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { compressFullBodyImage, compressImageToBase64 } from "@/lib/imageUtils";
import ChatWidget from "@/components/chat/ChatWidget";

// ─── Style Suggestion Logic ───────────────────────────────────────────

interface Suggestion {
  title: string;
  description: string;
  tags: string[];
}

const FEMALE_SUGGESTIONS: Record<string, Suggestion[]> = {
  Casual: [
    { title: "Maxi Wrap Dress", description: "Flowy, comfortable maxi in floral or solid prints — perfect for everyday wear.", tags: ["dress", "summer"] },
    { title: "Casual Kurti + Jeans", description: "A relaxed cotton kurti paired with slim jeans for a chic, everyday look.", tags: ["top", "bottom"] },
    { title: "Blouse + Wide-Leg Pants", description: "Light blouse tucked into wide-leg trousers — breezy and stylish.", tags: ["top", "bottom"] },
  ],
  Formal: [
    { title: "Evening Gown", description: "Structured floor-length gown in silk or velvet for galas and formal events.", tags: ["dress", "formal"] },
    { title: "Formal Shalwar Kameez", description: "Embroidered or embellished kameez with matching dupatta for ceremonies.", tags: ["traditional"] },
    { title: "Palazzo + Silk Top", description: "High-waist palazzo paired with a solid silk blouse — elegant and modern.", tags: ["top", "bottom"] },
  ],
  Business: [
    { title: "Blazer + Trousers", description: "Tailored blazer over a fitted blouse with straight-leg trousers.", tags: ["formal", "office"] },
    { title: "Pencil Skirt + Button-Down", description: "Classic pencil skirt with a crisp button-down shirt for boardroom confidence.", tags: ["top", "bottom"] },
    { title: "Formal Kurti Suit", description: "Structured kurta with matching slim trousers — professional yet cultural.", tags: ["traditional", "office"] },
  ],
  Sporty: [
    { title: "Leggings + Sports Top", description: "High-waist leggings with a breathable sports top for workouts.", tags: ["activewear"] },
    { title: "Tracksuit Set", description: "Matching jogger + hoodie set in soft fleece — athleisure at its best.", tags: ["activewear"] },
    { title: "Flared Workout Skirt", description: "Tennis-style flared skirt with built-in shorts — active and feminine.", tags: ["activewear"] },
  ],
  Bohemian: [
    { title: "Flowy Boho Maxi", description: "Printed maxi with tiered hem and relaxed silhouette — free-spirited style.", tags: ["dress", "summer"] },
    { title: "Embroidered Kurti", description: "Handcrafted embroidery on loose cotton kurti with mirror-work detailing.", tags: ["traditional"] },
    { title: "Wrap Skirt + Crochet Top", description: "Patterned wrap skirt with a light crochet top — beach-to-street look.", tags: ["top", "bottom"] },
  ],
  Streetwear: [
    { title: "Crop Top + High-Waist Jeans", description: "Fitted crop top with high-waist skinny jeans and chunky sneakers.", tags: ["casual", "trendy"] },
    { title: "Oversized Hoodie Dress", description: "Longline oversized hoodie worn as a mini dress with bike shorts.", tags: ["casual"] },
    { title: "Cargo Pants + Graphic Tee", description: "Relaxed cargo pants paired with a statement graphic tee.", tags: ["casual", "trendy"] },
  ],
  Minimalist: [
    { title: "Monochrome Dress", description: "Clean-line solid dress in neutral tones — understated and sophisticated.", tags: ["dress"] },
    { title: "Crisp White Shirt + Trousers", description: "Minimal white button-down tucked into well-cut straight trousers.", tags: ["top", "bottom"] },
    { title: "Slip Dress + Blazer", description: "Satin slip dress layered under an oversized blazer for effortless chic.", tags: ["dress", "layering"] },
  ],
  Traditional: [
    { title: "Embroidered Sharara", description: "Flared sharara set with intricately embroidered kameez and dupatta.", tags: ["traditional", "formal"] },
    { title: "Lehenga Choli", description: "Bridal or festive lehenga with mirror or zari embellishment.", tags: ["traditional", "party"] },
    { title: "Anarkali Dress", description: "Floor-length Anarkali with gathered skirt — timeless and regal.", tags: ["traditional", "formal"] },
  ],
};

const MALE_SUGGESTIONS: Record<string, Suggestion[]> = {
  Casual: [
    { title: "Polo + Slim Jeans", description: "Classic polo shirt in a solid color paired with dark slim-fit jeans.", tags: ["top", "bottom"] },
    { title: "Linen Shirt + Chinos", description: "Breathable linen shirt with chino trousers — relaxed summer staple.", tags: ["top", "bottom"] },
    { title: "Kurta + Pyjama", description: "Casual printed kurta with matching pyjama — comfortable traditional-casual.", tags: ["traditional"] },
  ],
  Formal: [
    { title: "3-Piece Suit", description: "Well-tailored three-piece suit in navy or charcoal — classic formal power look.", tags: ["formal", "office"] },
    { title: "Sherwani", description: "Embroidered sherwani with churidar for weddings and formal ceremonies.", tags: ["traditional", "formal"] },
    { title: "Dress Shirt + Formal Trousers", description: "Pressed dress shirt with tailored trousers and leather Oxford shoes.", tags: ["formal", "office"] },
  ],
  Business: [
    { title: "Blazer + Dress Trousers", description: "Structured blazer over a button-down shirt with pressed dress trousers.", tags: ["formal", "office"] },
    { title: "Waistcoat + Chinos", description: "A fitted waistcoat over a shirt paired with chinos — smart casual.", tags: ["office"] },
    { title: "Premium Kurta Suit", description: "Structured kurta with matching slim-fit churidar — cultural yet professional.", tags: ["traditional", "office"] },
  ],
  Sporty: [
    { title: "Joggers + Gym Tee", description: "Performance joggers with a moisture-wicking graphic tee.", tags: ["activewear"] },
    { title: "Track Suit Set", description: "Matching track jacket and pants in breathable fleece for active days.", tags: ["activewear"] },
    { title: "Shorts + Hoodie", description: "Relaxed athletic shorts with a pullover hoodie — athleisure essential.", tags: ["activewear", "casual"] },
  ],
  Bohemian: [
    { title: "Linen Pants + Loose Shirt", description: "Relaxed linen trousers with a flowing open-collar shirt in earthy tones.", tags: ["casual", "summer"] },
    { title: "Printed Kurta", description: "Block-printed or ikat kurta in natural cotton — artisan and expressive.", tags: ["traditional", "casual"] },
    { title: "Patchwork Jacket + Jeans", description: "Artsy patchwork jacket over simple jeans — uniquely layered.", tags: ["layering", "trendy"] },
  ],
  Streetwear: [
    { title: "Baggy Jeans + Oversized Tee", description: "Wide-leg baggy jeans with a dropped-shoulder graphic tee.", tags: ["casual", "trendy"] },
    { title: "Hoodie + Cargo Pants", description: "Chunky hoodie with multi-pocket cargo pants and sneakers.", tags: ["casual"] },
    { title: "Bomber Jacket + Joggers", description: "Sleek bomber jacket over tapered joggers — street style done right.", tags: ["trendy", "layering"] },
  ],
  Minimalist: [
    { title: "Plain Tee + Slim Chinos", description: "Solid white or grey tee with slim chinos and clean sneakers — effortless.", tags: ["casual", "clean"] },
    { title: "Solid Kurta", description: "Single-color premium kurta in cream, black, or navy — simple and sharp.", tags: ["traditional", "casual"] },
    { title: "Crew-Neck Sweater + Trousers", description: "Fine-knit crew-neck layered over a collar shirt with neat trousers.", tags: ["formal", "layering"] },
  ],
  Traditional: [
    { title: "Shalwar Kameez", description: "Classic shalwar kameez in cotton or lawn — versatile for all occasions.", tags: ["traditional"] },
    { title: "Sherwani + Khussa", description: "Embroidered sherwani paired with traditional khussa shoes for weddings.", tags: ["traditional", "formal"] },
    { title: "Waistcoat Kurta Set", description: "Printed kurta with embroidered waistcoat — festive and cultural.", tags: ["traditional", "party"] },
  ],
};

const BODY_TYPE_TIPS: Record<string, Record<string, string>> = {
  female: {
    hourglass: "Your balanced proportions suit wrap styles, belted fits, and V-necks that highlight your waist.",
    pear: "Structured shoulders and A-line silhouettes balance your curves beautifully.",
    apple: "Empire waist and flowy tops elongate your torso; V-necks add length.",
    rectangle: "Add dimension with peplum tops, ruffles, and belted waistlines.",
    inverted_triangle: "Wide-leg trousers and A-line skirts balance your broader shoulders.",
  },
  male: {
    hourglass: "Slim-fit shirts and tailored trousers complement your proportions perfectly.",
    pear: "Structured blazers and wide-shoulder designs draw attention upward.",
    apple: "Vertical stripes and V-neck shirts create a slimming elongated look.",
    rectangle: "Layering — blazers, waistcoats — adds visual depth and structure.",
    inverted_triangle: "Straight-leg trousers and relaxed shirts balance your broader upper body.",
  },
};

const DEFAULT_FEMALE = FEMALE_SUGGESTIONS["Casual"];
const DEFAULT_MALE = MALE_SUGGESTIONS["Casual"];

function getGenderLabel(gender: string) {
  if (gender === "male") return "Men's";
  if (gender === "female") return "Women's";
  return "Unisex";
}

function StyleSuggestionsPanel() {
  const { userProfile } = useAuth();

  if (!userProfile) return null;

  const gender = userProfile.gender || "";
  const styles = userProfile.preferences?.stylePreference || [];
  const bodyType = userProfile.bodyType || "";
  const hasPreferences = gender || styles.length > 0;

  if (!hasPreferences) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Set your preferences for personalized suggestions</p>
            <p className="text-xs text-amber-700 mt-1">Add your gender and style preferences in your profile to get outfit ideas tailored for you.</p>
            <Link href="/profile" className="inline-block mt-2 text-xs font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700">
              Go to Profile →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Build suggestions list: merge all selected styles, deduplicated
  const isMale = gender === "male";
  const pool = isMale ? MALE_SUGGESTIONS : FEMALE_SUGGESTIONS;

  let suggestions: Suggestion[] = [];
  for (const s of styles) {
    if (pool[s]) suggestions.push(...pool[s]);
  }
  if (suggestions.length === 0) {
    suggestions = isMale ? DEFAULT_MALE : DEFAULT_FEMALE;
  }
  // Deduplicate by title and cap at 6
  const seen = new Set<string>();
  suggestions = suggestions.filter((s) => {
    if (seen.has(s.title)) return false;
    seen.add(s.title);
    return true;
  }).slice(0, 6);

  const bodyTip = bodyType && BODY_TYPE_TIPS[isMale ? "male" : "female"]?.[bodyType];
  const styleLabels = styles.length > 0 ? styles.join(", ") : "Casual";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Style Suggestions For You
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {getGenderLabel(gender)} · {styleLabels}
            {bodyType && <span> · <span className="capitalize">{bodyType}</span> body type</span>}
          </p>
        </div>
        <Link href="/profile" className="text-xs text-purple-600 font-medium hover:text-purple-700">
          Edit preferences
        </Link>
      </div>

      {/* Body type tip */}
      {bodyTip && (
        <div className="bg-purple-50 rounded-xl px-4 py-3 text-xs text-purple-800 flex items-start gap-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span><strong>Body type tip:</strong> {bodyTip}</span>
        </div>
      )}

      {/* Suggestion Cards */}
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">You might like wearing:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((s) => (
          <div key={s.title} className="border border-gray-100 rounded-xl p-3 hover:border-purple-200 hover:bg-purple-50/30 transition">
            <p className="text-sm font-semibold text-gray-800">{s.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {s.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400">Upload a garment photo above to virtually try on any of these styles.</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────

function CustomTryOnContent() {
  const { user, fullBodyBase64, refreshProfile } = useAuth();
  const personInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);

  const [personImage, setPersonImage] = useState<string | null>(fullBodyBase64 || null);
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [validatingImage, setValidatingImage] = useState(false);

  // Always refresh profile on mount so preferences are never stale
  useEffect(() => { refreshProfile(); }, []);

  const validatePerson = async (b64: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/validate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: b64, type: "full_body" }),
      });
      const data = await res.json();
      return data.valid !== false;
    } catch {
      return true;
    }
  };

  const handlePersonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setValidatingImage(true);
    try {
      const b64 = await compressFullBodyImage(file);
      const valid = await validatePerson(b64);
      if (!valid) {
        setUploadError("Please add an image of yourself or a person, not an irrelevant image.");
        return;
      }
      setPersonImage(b64);
      setResultImage(null);
      setDescription("");
    } finally {
      setValidatingImage(false);
    }
  };

  const handleGarmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await compressImageToBase64(file, 400, 0.8);
    setGarmentImage(b64);
    setResultImage(null);
    setDescription("");
  };

  const handleGenerate = async () => {
    if (!personImage || !garmentImage || !user) return;
    setGenerating(true);
    setError("");
    setResultImage(null);
    setDescription("");

    try {
      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userImage: personImage, productImage: garmentImage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Try-on failed");
        return;
      }
      if (data.image) setResultImage(data.image);
      if (data.description) setDescription(data.description);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Try-on failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 text-center">
          <h1 className="text-3xl font-bold mb-2">Custom Virtual Try-On</h1>
          <p className="text-purple-200">Upload your photo and any garment to see how it looks on you</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Person Image */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Add Your Own Photo</h3>
            <p className="text-xs text-gray-400 mb-3">Must be a direct photo of yourself — not a banner, poster, or graphic.</p>
            {validatingImage ? (
              <div className="w-full aspect-[3/4] border-2 border-dashed border-purple-200 rounded-xl flex flex-col items-center justify-center gap-3 text-purple-500">
                <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                <p className="text-sm font-medium">Validating image...</p>
              </div>
            ) : personImage ? (
              <div className="space-y-3">
                <img src={personImage} alt="You" className="w-full max-h-80 object-contain rounded-xl bg-gray-50" />
                <button onClick={() => { personInputRef.current?.click(); setUploadError(""); }} className="text-sm text-purple-600 font-medium hover:text-purple-700">
                  Change photo
                </button>
              </div>
            ) : (
              <button
                onClick={() => { personInputRef.current?.click(); setUploadError(""); }}
                className={`w-full aspect-[3/4] border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition cursor-pointer ${uploadError ? "border-red-300 text-red-400 bg-red-50" : "border-gray-200 text-gray-400 hover:border-purple-300 hover:text-purple-500"}`}
              >
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <p className="font-medium text-sm">Add your own photo</p>
                <p className="text-xs mt-1">Direct photo only — no banners or graphics</p>
              </button>
            )}
            {uploadError && (
              <p className="mt-2 text-xs text-red-500 flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {uploadError}
              </p>
            )}
            <input ref={personInputRef} type="file" accept="image/*" onChange={handlePersonUpload} className="hidden" />
          </div>

          {/* Garment Image */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Garment Photo</h3>
            {garmentImage ? (
              <div className="space-y-3">
                <img src={garmentImage} alt="Garment" className="w-full max-h-80 object-contain rounded-xl bg-gray-50" />
                <button onClick={() => garmentInputRef.current?.click()} className="text-sm text-purple-600 font-medium hover:text-purple-700">
                  Change garment
                </button>
              </div>
            ) : (
              <button
                onClick={() => garmentInputRef.current?.click()}
                className="w-full aspect-[3/4] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-purple-300 hover:text-purple-500 transition cursor-pointer"
              >
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="font-medium text-sm">Upload a garment image</p>
              </button>
            )}
            <input ref={garmentInputRef} type="file" accept="image/*" onChange={handleGarmentUpload} className="hidden" />
          </div>
        </div>

        {/* Generate Button */}
        <div className="text-center">
          <button
            onClick={handleGenerate}
            disabled={!personImage || !garmentImage || generating}
            className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xl shadow-purple-500/20"
          >
            {generating ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Generating Try-On...
              </span>
            ) : "Generate Virtual Try-On"}
          </button>
          {!personImage && !garmentImage && (
            <p className="text-sm text-gray-400 mt-3">Upload both images to start</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-lg mx-auto bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm">
            {error}
          </div>
        )}

        {/* Result */}
        {(resultImage || description) && (
          <div className="space-y-6">
            {resultImage && (
              <div className="bg-white rounded-2xl border-2 border-purple-200 p-6 max-w-lg mx-auto shadow-lg">
                <h3 className="font-semibold text-center text-gray-900 mb-3">AI Try-On Result</h3>
                <img src={resultImage} alt="Try-on result" className="w-full rounded-xl" />
              </div>
            )}
            {description && (
              <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">AI Stylist Says</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
              </div>
            )}
            <div className="text-center">
              <button onClick={handleGenerate} className="px-6 py-3 border-2 border-purple-200 text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition">
                Regenerate
              </button>
            </div>
          </div>
        )}

        {/* Preferences-based Style Suggestions */}
        <StyleSuggestionsPanel />
      </main>

      <ChatWidget />
    </div>
  );
}

export default function TryOnPage() {
  return <AuthGuard><CustomTryOnContent /></AuthGuard>;
}
