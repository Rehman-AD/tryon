"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { getCart, updateCartQuantity, removeFromCart } from "@/lib/cart";
import { getProduct } from "@/lib/products";
import type { CartItem, Product } from "@/types";

interface CartItemWithProduct extends CartItem {
  product: Product;
}

function CartContent() {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCart = async () => {
    if (!user) return;
    try {
      const cartItems = await getCart(user.uid);
      const withProducts = await Promise.all(
        cartItems.map(async (item) => {
          const product = await getProduct(item.productId);
          return { ...item, product: product! };
        })
      );
      setItems(withProducts.filter((i) => i.product));
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCart(); }, [user]);

  const handleQuantity = async (productId: string, qty: number) => {
    if (!user) return;
    await updateCartQuantity(user.uid, productId, qty);
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setItems((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
    }
  };

  const handleRemove = async (productId: string) => {
    if (!user) return;
    await removeFromCart(user.uid, productId);
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const total = items.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
            <Link href="/store" className="inline-block px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
                  <Link href={`/store/${item.productId}`} className="w-24 h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.product.imageThumbnail ? (
                      <img src={item.product.imageThumbnail} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/store/${item.productId}`} className="font-semibold text-gray-900 hover:text-blue-600 transition truncate block">
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {item.size} / {item.color}
                    </p>
                    <p className="font-bold text-gray-900 mt-1">Rs. {item.product.price?.toLocaleString()}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button onClick={() => handleQuantity(item.productId, item.quantity - 1)} className="px-3 py-1.5 text-gray-500 hover:text-gray-900 transition text-sm">-</button>
                        <span className="px-3 py-1.5 text-sm font-medium border-x border-gray-200">{item.quantity}</span>
                        <button onClick={() => handleQuantity(item.productId, item.quantity + 1)} className="px-3 py-1.5 text-gray-500 hover:text-gray-900 transition text-sm">+</button>
                      </div>
                      <button onClick={() => handleRemove(item.productId)} className="text-sm text-red-500 hover:text-red-700 transition">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 h-fit sticky top-20">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>Rs. {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg text-gray-900">
                  <span>Total</span>
                  <span>Rs. {total.toLocaleString()}</span>
                </div>
              </div>
              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 w-full mt-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition shadow-lg shadow-purple-500/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                Checkout
              </Link>
              <Link href="/store" className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-3 transition">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CartPage() {
  return <AuthGuard><CartContent /></AuthGuard>;
}
