"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { getProduct } from "@/lib/products";
import { addToCart } from "@/lib/cart";
import { logActivity } from "@/lib/activityLog";
import { compressFullBodyImage } from "@/lib/imageUtils";
import type { Product } from "@/types";

function TryOnContent() {
  const params = useParams();
  const router = useRouter();
  const { user, fullBodyBase64 } = useAuth();
  const productId = params.productId as string;
  const uploadRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [validatingImage, setValidatingImage] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [userImage, setUserImage] = useState<string | null>(fullBodyBase64 || null);

  useEffect(() => {
    getProduct(productId).then((p) => {
      setProduct(p);
      setLoading(false);
    });
  }, [productId]);

  useEffect(() => {
    if (fullBodyBase64 && !userImage) setUserImage(fullBodyBase64);
  }, [fullBodyBase64]);

  useEffect(() => {
    if (!product || !userImage || generating || resultImage) return;
    generateTryOn();
  }, [product, userImage]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setValidatingImage(true);
    try {
      const b64 = await compressFullBodyImage(file);
      const res = await fetch("/api/validate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: b64, type: "full_body" }),
      });
      const data = await res.json();
      if (data.valid === false) {
        setUploadError("Please add an image of yourself or a person, not an irrelevant image.");
        return;
      }
      setUserImage(b64);
      setResultImage(null);
      setDescription("");
    } catch {
      // On validation error allow the upload
      const b64 = await compressFullBodyImage(file);
      setUserImage(b64);
      setResultImage(null);
      setDescription("");
    } finally {
      setValidatingImage(false);
    }
  };

  const generateTryOn = async () => {
    if (!product || !userImage || !user) return;
    setGenerating(true);
    setError("");

    logActivity(user.uid, "tryon_upload", { productId: product.id, productName: product.name });

    try {
      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userImage: userImage,
          productImage: product.imageMedium,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Try-on failed");
        return;
      }

      if (data.image) {
        setResultImage(data.image);
      }
      if (data.description) {
        setDescription(data.description);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Try-on failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user || !product) return;
    await addToCart(user.uid, product.id, product.sizes?.[0] || "M", product.colors?.[0] || "Default");
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-16">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 text-lg">Product not found</p>
          <Link href="/store" className="text-blue-600 font-medium mt-2 inline-block">Back to Store</Link>
        </div>
      </div>
    );
  }

  // No redirect — inline upload handled below

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/store" className="hover:text-gray-600">Store</Link>
          <span>/</span>
          <Link href={`/store/${product.id}`} className="hover:text-gray-600 truncate">{product.name}</Link>
          <span>/</span>
          <span className="text-gray-700">Virtual Try-On</span>
        </nav>
      </div>

      <main className="max-w-6xl mx-auto px-4 pb-16">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Virtual Try-On</h1>
          <p className="text-gray-500">{product.name}</p>
        </div>

        {/* Upload Section (if no user image) */}
        {!userImage && !generating && (
          <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-100 p-8 text-center mb-8">
            {validatingImage ? (
              <div className="flex flex-col items-center gap-3 py-4 text-purple-500">
                <svg className="animate-spin h-10 w-10" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                <p className="text-sm font-medium">Validating image...</p>
              </div>
            ) : (
              <>
                <svg className="w-16 h-16 text-purple-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Photo</h3>
                <p className="text-gray-500 text-sm mb-2">We need your full-body photo to show you wearing this outfit</p>
                {uploadError && (
                  <p className="text-red-500 text-sm mb-4 flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {uploadError}
                  </p>
                )}
                <div className="flex items-center justify-center gap-2 mt-4">
                  {fullBodyBase64 ? (
                    <>
                      <button
                        onClick={() => { setUserImage(fullBodyBase64); setResultImage(null); setDescription(""); setUploadError(""); }}
                        className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition shadow-md flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Use Profile Photo
                      </button>
                      <button
                        onClick={() => { uploadRef.current?.click(); setUploadError(""); }}
                        className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition"
                        title="Upload a different photo"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { uploadRef.current?.click(); setUploadError(""); }}
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition shadow-md flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Upload Photo
                    </button>
                  )}
                </div>
              </>
            )}
            <input ref={uploadRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>
        )}

        {/* Generating State */}
        {generating && (
          <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating your try-on...</h3>
            <p className="text-gray-500 text-sm">Our AI is creating a preview of you wearing this outfit. This may take 10-20 seconds.</p>
          </div>
        )}

        {/* Error */}
        {error && !generating && (
          <div className="max-w-lg mx-auto">
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm mb-4">
              <p className="font-medium mb-1">Try-on failed</p>
              <p>{error}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={generateTryOn} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition">
                Try Again
              </button>
              <Link href={`/store/${product.id}`} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition">
                Back to Product
              </Link>
            </div>
          </div>
        )}

        {/* Results */}
        {!generating && !error && (resultImage || description) && (
          <div className="space-y-8">
            {/* Side-by-side comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Your Photo */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase text-center">Your Photo</div>
                <div className="aspect-[3/4]">
                  <img src={userImage!} alt="You" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Result */}
              <div className="bg-white rounded-2xl border-2 border-purple-200 overflow-hidden shadow-lg">
                <div className="bg-purple-50 px-4 py-2 text-xs font-semibold text-purple-700 uppercase text-center">AI Try-On Result</div>
                <div className="aspect-[3/4]">
                  {resultImage ? (
                    <img src={resultImage} alt="Try-on result" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-6">
                      <p className="text-sm text-gray-600 text-center leading-relaxed">{description.slice(0, 200)}...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Product */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase text-center">Product</div>
                <div className="aspect-[3/4]">
                  {product.imageMedium ? (
                    <img src={product.imageMedium} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">No image</div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Description */}
            {description && (
              <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Stylist Says
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <button
                onClick={handleAddToCart}
                className="px-8 py-3.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition shadow-md"
              >
                {addedToCart ? "Added!" : "Add to Cart"}
              </button>
              <button
                onClick={generateTryOn}
                className="px-8 py-3.5 border-2 border-purple-200 text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition"
              >
                Regenerate
              </button>
              <Link
                href="/store"
                className="px-8 py-3.5 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                Browse More
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function TryOnPage() {
  return <AuthGuard><TryOnContent /></AuthGuard>;
}
