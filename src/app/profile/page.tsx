"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { ref, get, update } from "firebase/database";
import { updateProfile } from "firebase/auth";
import { db } from "@/lib/firebase";
import { compressImageToBase64, compressFullBodyImage } from "@/lib/imageUtils";
import { logActivity } from "@/lib/activityLog";
import Navbar from "@/components/layout/Navbar";

interface UserProfileData {
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  photoBase64?: string;
  fullBodyBase64?: string;
  bodyType?: string;
  skinTone?: string;
  skinToneHex?: string;
  faceShape?: string;
  preferences?: {
    stylePreference?: string[];
    sizePreference?: string;
    colorPreference?: string[];
  };
  createdAt?: string;
}

const STYLE_OPTIONS = ["Casual", "Formal", "Business", "Sporty", "Bohemian", "Streetwear", "Minimalist", "Traditional"];
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];

function ProfileContent() {
  const { user, logout, refreshProfile } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfileData>({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBody, setUploadingBody] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        const snapshot = await get(ref(db, `users/${user.uid}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setProfile({
            name: data.name || user.displayName || "",
            email: data.email || user.email || "",
            phone: data.phone || "",
            gender: data.gender || "",
            photoBase64: data.photoBase64 || "",
            fullBodyBase64: data.fullBodyBase64 || "",
            bodyType: data.bodyType || "",
            skinTone: data.skinTone || "",
            skinToneHex: data.skinToneHex || "",
            faceShape: data.faceShape || "",
            preferences: data.preferences || {},
            createdAt: data.createdAt || "",
          });
        } else {
          setProfile({ name: user.displayName || "", email: user.email || "" });
        }
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const validateImageIsPerson = async (base64: string, type: "avatar" | "full_body"): Promise<boolean> => {
    try {
      const res = await fetch("/api/validate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, type }),
      });
      const data = await res.json();
      return data.valid !== false;
    } catch {
      return true; // Allow upload if validation request fails
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("Please select an image under 5MB");
      return;
    }
    setUploadingAvatar(true);
    setError("");
    try {
      const base64 = await compressImageToBase64(file, 200, 0.8);
      const valid = await validateImageIsPerson(base64, "avatar");
      if (!valid) {
        setError("It looks like this image does not contain a person. Please upload a clear photo of yourself and try again.");
        return;
      }
      await update(ref(db, `users/${user.uid}`), { photoBase64: base64 });
      setProfile((prev) => ({ ...prev, photoBase64: base64 }));
      await refreshProfile();
      logActivity(user.uid, "avatar_upload", { sizeKB: Math.round(base64.length / 1024) });
      setSuccess("Profile photo updated!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to upload photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBodyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      setError("Please select an image under 10MB");
      return;
    }
    setUploadingBody(true);
    setError("");
    try {
      const base64 = await compressFullBodyImage(file);
      const valid = await validateImageIsPerson(base64, "full_body");
      if (!valid) {
        setError("It looks like this image does not contain a person. Please upload a clear full-body photo of yourself and try again.");
        return;
      }
      await update(ref(db, `users/${user.uid}`), { fullBodyBase64: base64 });
      setProfile((prev) => ({ ...prev, fullBodyBase64: base64 }));
      await refreshProfile();
      logActivity(user.uid, "image_upload", { type: "full_body", sizeKB: Math.round(base64.length / 1024) });
      setSuccess("Full body photo uploaded! This will be used for virtual try-on.");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to upload body photo.");
    } finally {
      setUploadingBody(false);
    }
  };

  const toggleStyle = (style: string) => {
    const current = profile.preferences?.stylePreference || [];
    const updated = current.includes(style)
      ? current.filter((s) => s !== style)
      : [...current, style];
    setProfile((p) => ({
      ...p,
      preferences: { ...p.preferences, stylePreference: updated },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateProfile(user, { displayName: profile.name });
      await update(ref(db, `users/${user.uid}`), {
        name: profile.name,
        phone: profile.phone || "",
        gender: profile.gender || "",
        preferences: profile.preferences || {},
        updatedAt: new Date().toISOString(),
      });
      await refreshProfile();
      logActivity(user.uid, "profile_update", { name: profile.name });
      setSuccess("Profile saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const userInitial = profile.name?.charAt(0)?.toUpperCase() || "U";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        {/* Avatar & Full Body Photos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Avatar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Profile Photo</h3>
            <div className="flex items-center gap-4">
              <div className="relative group">
                {profile.photoBase64 ? (
                  <img src={profile.photoBase64} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-200" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {userInitial}
                  </div>
                )}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                >
                  {uploadingAvatar ? (
                    <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </div>
              <div>
                <p className="text-sm text-gray-500">200x200px avatar</p>
                <p className="text-xs text-gray-400">Used in header & profile</p>
              </div>
            </div>
          </div>

          {/* Full Body Photo */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Full Body Photo</h3>
            <p className="text-xs text-gray-400 mb-4">Used for virtual try-on. Upload a clear, full-body photo.</p>
            {profile.fullBodyBase64 ? (
              <div className="flex items-center gap-4">
                <img src={profile.fullBodyBase64} alt="Full body" className="h-28 rounded-xl object-cover border-2 border-gray-200" />
                <div>
                  <p className="text-sm text-green-600 font-medium">Photo saved</p>
                  <button
                    onClick={() => bodyInputRef.current?.click()}
                    disabled={uploadingBody}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {uploadingBody ? "Uploading..." : "Change photo"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => bodyInputRef.current?.click()}
                disabled={uploadingBody}
                className="w-full py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-blue-300 hover:text-blue-500 transition text-center"
              >
                {uploadingBody ? (
                  <svg className="animate-spin h-8 w-8 mx-auto" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : (
                  <>
                    <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <p className="text-sm font-medium">Upload full body photo</p>
                  </>
                )}
              </button>
            )}
            <input ref={bodyInputRef} type="file" accept="image/*" onChange={handleBodyUpload} className="hidden" />
          </div>
        </div>

        {/* AI Analysis Data */}
        {(profile.bodyType || profile.skinTone || profile.faceShape) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Your AI Analysis</h3>
            <div className="grid grid-cols-3 gap-4">
              {profile.faceShape && (
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Face Shape</p>
                  <p className="font-semibold capitalize">{profile.faceShape}</p>
                </div>
              )}
              {profile.skinTone && (
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Skin Tone</p>
                  <p className="font-semibold">{profile.skinTone}</p>
                  {profile.skinToneHex && (
                    <div className="w-6 h-6 rounded-full mx-auto mt-1 border" style={{ backgroundColor: profile.skinToneHex }} />
                  )}
                </div>
              )}
              {profile.bodyType && (
                <div className="bg-teal-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Body Type</p>
                  <p className="font-semibold capitalize">{profile.bodyType}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input type="text" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" value={profile.email} disabled className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input type="tel" value={profile.phone || ""} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="0333-1234567" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                <select value={profile.gender || ""} onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Size Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Size Preference</label>
              <div className="flex flex-wrap gap-2">
                {SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setProfile((p) => ({ ...p, preferences: { ...p.preferences, sizePreference: size } }))}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                      profile.preferences?.sizePreference === size
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Preferences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Style Preferences</label>
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                      profile.preferences?.stylePreference?.includes(style)
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-purple-300"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Info */}
            <div className="border-t border-gray-100 pt-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-gray-400 text-xs mb-0.5">Member Since</p>
                  <p className="font-medium text-gray-700">
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-gray-400 text-xs mb-0.5">User ID</p>
                  <p className="font-medium text-gray-700 font-mono text-xs">{user?.uid}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button type="submit" disabled={saving} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg">
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <Link href="/store" className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition">Cancel</Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
