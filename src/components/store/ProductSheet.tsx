"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { addToCart } from "@/lib/cart";
import type { Product } from "@/types";

interface ProductSheetProps {
  product: Product;
  onClose: () => void;
  onTagClick?: (tag: string) => void;
}

export default function ProductSheet({ product, onClose, onTagClick }: ProductSheetProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async () => {
    if (!user || !selectedSize || !selectedColor) return;
    setAdding(true);
    try {
      await addToCart(user.uid, product.id, selectedSize, selectedColor);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error("Add to cart failed:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleTryOn = () => {
    onClose();
    router.push(`/store/${product.id}/tryon`);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-3/4 lg:w-2/3 xl:w-[60%] bg-white z-50 shadow-2xl overflow-y-auto animate-slide-in-right">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Left: Image */}
          <div className="bg-gray-50 flex items-center justify-center p-8">
            {product.imageMedium ? (
              <img
                src={product.imageMedium}
                alt={product.name}
                className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-lg"
              />
            ) : (
              <div className="w-64 h-80 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="p-8 flex flex-col">
            <div className="flex-1 space-y-5">
              {/* Category */}
              <p className="text-sm font-medium text-purple-600 capitalize">
                {product.category}{product.subcategory ? ` / ${product.subcategory}` : ""}
              </p>

              {/* Name & Price */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
                <p className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Rs. {product.price?.toLocaleString()}
                </p>
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => { onClose(); onTagClick?.(tag); }}
                      className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full hover:bg-purple-100 transition font-medium"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Size</label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[48px] px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition ${
                          selectedSize === size
                            ? "border-purple-600 bg-purple-600 text-white"
                            : "border-gray-200 text-gray-700 hover:border-purple-300"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Color: <span className="font-normal text-gray-500">{selectedColor}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition ${
                          selectedColor === color
                            ? "border-purple-600 bg-purple-50"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-sm text-gray-500">
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-6 border-t border-gray-100 mt-6">
              <button
                onClick={handleAddToCart}
                disabled={adding || product.stock <= 0}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
              >
                {added ? (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Added!</>
                ) : adding ? "Adding..." : (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg> Add to Cart</>
                )}
              </button>
              <button
                onClick={handleTryOn}
                className="w-full py-3.5 border-2 border-purple-200 text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Virtual Try-On
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
