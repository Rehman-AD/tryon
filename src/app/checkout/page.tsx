"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { getCart, clearCart } from "@/lib/cart";
import { getProduct, decrementStock } from "@/lib/products";
import { createOrder } from "@/lib/orders";
import { logActivity } from "@/lib/activityLog";
import type { CartItem, Product, OrderItem } from "@/types";

function CheckoutContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<(CartItem & { product: Product })[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState({ line1: "", line2: "", city: "", phone: "" });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const cartItems = await getCart(user.uid);
      const withProducts = await Promise.all(
        cartItems.map(async (item) => ({ ...item, product: (await getProduct(item.productId))! }))
      );
      setItems(withProducts.filter((i) => i.product));
      setLoading(false);
    };
    load();
  }, [user]);

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || items.length === 0) return;
    setPlacing(true);
    try {
      const orderItems: OrderItem[] = items.map((i) => ({
        productId: i.productId,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        imageThumbnail: i.product.imageThumbnail,
      }));
      await createOrder(user.uid, orderItems, total, address);
      // Decrement stock for each ordered item
      await Promise.all(
        items.map((i) => decrementStock(i.productId, i.quantity))
      );
      await clearCart(user.uid);
      logActivity(user.uid, "analysis_complete", { type: "order_placed", total, items: items.length });
      router.push("/orders?success=1");
    } catch (err) {
      console.error("Order failed:", err);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipping Form */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Shipping Address</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address Line 1</label>
                  <input type="text" required value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} placeholder="Street address" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address Line 2 (optional)</label>
                  <input type="text" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} placeholder="Apartment, suite, etc." className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                    <input type="text" required value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="Lahore" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <input type="tel" required value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="0333-1234567" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 h-fit">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate mr-2">{item.product.name} x{item.quantity}</span>
                    <span className="font-medium text-gray-900 flex-shrink-0">Rs. {(item.product.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-900 pt-1">
                  <span>Total</span>
                  <span>Rs. {total.toLocaleString()}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={placing || items.length === 0}
                className="w-full mt-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
              >
                {placing ? "Placing Order..." : (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Place Order</>
                )}
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">Cash on Delivery</p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return <AuthGuard><CheckoutContent /></AuthGuard>;
}
