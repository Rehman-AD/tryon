"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import ProductSheet from "@/components/store/ProductSheet";
import { useAuth } from "@/context/AuthContext";
import { getProducts } from "@/lib/products";
import { getWishlist, toggleWishlist } from "@/lib/wishlist";
import { seedDummyProducts } from "@/lib/seedProducts";
import ChatWidget from "@/components/chat/ChatWidget";
import type { Product } from "@/types";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "dress", label: "Dresses" },
  { key: "top", label: "Tops" },
  { key: "bottom", label: "Bottoms" },
  { key: "accessory", label: "Accessories" },
];

export default function StorePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        let prods = await getProducts();

        if (prods.length === 0 && user) {
          setSeeding(true);
          console.log("[Store] No products — auto-seeding...");
          try {
            await seedDummyProducts(user.uid);
            prods = await getProducts();
            console.log(`[Store] Seeded ${prods.length} products`);
          } catch (seedErr) {
            console.warn("[Store] Auto-seed failed:", seedErr);
          }
          setSeeding(false);
        }

        const wl = user ? await getWishlist(user.uid) : [];
        setProducts(prods);
        setWishlist(wl);
      } catch (err) {
        console.error("Failed to load store:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!user) return;
    const isNowWished = await toggleWishlist(user.uid, productId);
    setWishlist((prev) =>
      isNowWished ? [...prev, productId] : prev.filter((id) => id !== productId)
    );
  };

  const handleTagClick = (tag: string) => {
    setSearch(tag);
    setActiveCategory("all");
  };

  const filtered = products.filter((p) => {
    const matchCategory = activeCategory === "all" || p.category === activeCategory;
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-10 text-center">
          <h1 className="text-3xl font-black mb-2">
            Shop the <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Collection</span>
          </h1>
          <p className="text-white/40 text-base max-w-lg mx-auto">
            AI-curated fashion. Try any outfit on you before buying.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  activeCategory === cat.key
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products or #tags..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* Loading / Seeding */}
        {(loading || seeding) ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">{seeding ? "Setting up store with demo products..." : "Loading..."}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-500 text-lg">
              {products.length === 0 ? "No products yet." : "No products match your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((product) => (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 cursor-pointer"
              >
                {/* Image */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  {product.imageThumbnail ? (
                    <img
                      src={product.imageThumbnail}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                  {product.featured && (
                    <span className="absolute top-3 left-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                      Featured
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
                      <p className="text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mt-1">
                        Rs. {product.price?.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleWishlist(e, product.id)}
                      className="flex-shrink-0 p-1"
                    >
                      {wishlist.includes(product.id) ? (
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-300 hover:text-red-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                      )}
                    </button>
                  </div>
                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          onClick={(e) => { e.stopPropagation(); handleTagClick(tag); }}
                          className="text-[10px] text-purple-500 hover:text-purple-700 cursor-pointer font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <p className="text-center text-sm text-gray-400 mt-8">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </p>
        )}
      </main>

      {/* Product Sheet */}
      {selectedProduct && (
        <ProductSheet
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onTagClick={handleTagClick}
        />
      )}

      <ChatWidget />
    </div>
  );
}
