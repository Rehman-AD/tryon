"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/activityLog";

const STYLE_OPTIONS = ["Casual", "Formal", "Business", "Sporty", "Bohemian", "Streetwear", "Minimalist", "Traditional"];
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s+\-()]{7,15}$/;

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [sizePreference, setSizePreference] = useState("");
  const [stylePreference, setStylePreference] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string; email?: string; phone?: string; password?: string; confirmPassword?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  const toggleStyle = (style: string) => {
    setStylePreference((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
      const { auth } = await import("@/lib/firebase");

      console.log("[Signup] Creating account for:", email);
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      console.log("[Signup] Auth account created:", cred.user.uid);

      try {
        await updateProfile(cred.user, { displayName: name });
      } catch (profileErr) {
        console.warn("[Signup] Failed to set display name:", profileErr);
      }

      try {
        const { ref, set } = await import("firebase/database");
        const { db } = await import("@/lib/firebase");
        await set(ref(db, `users/${cred.user.uid}`), {
          name,
          email,
          phone: phone || "",
          gender: gender || "",
          role: "user",
          preferences: {
            stylePreference: stylePreference.length > 0 ? stylePreference : [],
            sizePreference: sizePreference || "",
          },
          createdAt: new Date().toISOString(),
        });
        console.log("[Signup] User profile saved to RTDB");
      } catch (dbErr) {
        console.warn("[Signup] RTDB write failed:", dbErr);
      }

      try {
        logActivity(cred.user.uid, "signup", { email, name });
      } catch {
        // Silent fail
      }

      router.push("/store");
    } catch (err: unknown) {
      console.error("[Signup] Failed:", err);
      if (err && typeof err === "object" && "code" in err) {
        const code = (err as { code: string }).code;
        const message = "message" in err ? (err as { message: string }).message : "";
        switch (code) {
          case "auth/email-already-in-use":
            setError("This email is already registered. Try signing in.");
            break;
          case "auth/weak-password":
            setError("Password is too weak. Use at least 6 characters.");
            break;
          case "auth/invalid-email":
            setError("Please enter a valid email address.");
            break;
          case "auth/operation-not-allowed":
            setError("Email/password signup is not enabled. Check Firebase Console.");
            break;
          default:
            setError(`Signup failed: ${code}. ${message}`);
        }
      } else {
        const errStr = err instanceof Error ? err.message : String(err);
        setError(`Signup failed: ${errStr}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white flex-col justify-center px-16">
        <h1 className="text-5xl font-bold mb-4">
          Glam<span className="text-purple-200">Verse</span>
        </h1>
        <p className="text-xl text-purple-100 mb-6">
          Your AI-Powered Fashion Store
        </p>
        <div className="space-y-4 text-purple-100">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <p>AI-powered face, skin & body type analysis</p>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <p>Virtual try-on — see clothes on you before buying</p>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <p>Personalized recommendations for your body & style</p>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <p>AI chatbot that knows your style preferences</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6 py-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-3xl font-bold">
              Glam<span className="text-blue-600">Verse</span>
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
            <p className="text-gray-500 mb-4">
              Step {step} of 2 — {step === 1 ? "Account Details" : "Style Preferences"}
            </p>

            {/* Step indicators */}
            <div className="flex gap-2 mb-6">
              <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-gradient-to-r from-violet-600 to-purple-600" : "bg-gray-200"}`} />
              <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-gradient-to-r from-violet-600 to-purple-600" : "bg-gray-200"}`} />
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {step === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: undefined })); }}
                      placeholder="Salman Rashid"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${fieldErrors.name ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                    />
                    {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
                      placeholder="you@example.com"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${fieldErrors.email ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                    />
                    {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setFieldErrors((p) => ({ ...p, phone: undefined })); }}
                      placeholder="0333-1234567"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${fieldErrors.phone ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                    />
                    {fieldErrors.phone && <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined, confirmPassword: undefined })); }}
                      placeholder="At least 6 characters"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${fieldErrors.password ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                    />
                    {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                      placeholder="Re-enter your password"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${fieldErrors.confirmPassword ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                    />
                    {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const errors: typeof fieldErrors = {};
                      if (!name.trim() || name.trim().length < 2) {
                        errors.name = "Name must be at least 2 characters.";
                      } else if (/\d/.test(name)) {
                        errors.name = "Name should not contain numbers.";
                      }
                      if (!email.trim()) {
                        errors.email = "Email is required.";
                      } else if (!EMAIL_REGEX.test(email)) {
                        errors.email = "Enter a valid email address.";
                      }
                      if (phone && !PHONE_REGEX.test(phone)) {
                        errors.phone = "Enter a valid phone number.";
                      }
                      if (!password) {
                        errors.password = "Password is required.";
                      } else if (password.length < 6) {
                        errors.password = "Password must be at least 6 characters.";
                      }
                      if (!confirmPassword) {
                        errors.confirmPassword = "Please confirm your password.";
                      } else if (password !== confirmPassword) {
                        errors.confirmPassword = "Passwords do not match.";
                      }
                      if (Object.keys(errors).length > 0) {
                        setFieldErrors(errors);
                        setError("");
                        return;
                      }
                      setFieldErrors({});
                      setError("");
                      setStep(2);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Next — Style Preferences
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Size</label>
                    <div className="flex flex-wrap gap-2">
                      {SIZE_OPTIONS.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSizePreference(size)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                            sizePreference === size
                              ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Style Preferences (select all that apply)</label>
                    <div className="flex flex-wrap gap-2">
                      {STYLE_OPTIONS.map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => toggleStyle(style)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                            stylePreference.includes(style)
                              ? "bg-purple-600 text-white border-purple-600"
                              : "bg-white text-gray-700 border-gray-300 hover:border-purple-300"
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          Creating...
                        </span>
                      ) : "Create Account"}
                    </button>
                  </div>
                </>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-blue-600 font-medium hover:text-blue-700">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Secured by Firebase Authentication
          </p>
        </div>
      </div>
    </div>
  );
}
