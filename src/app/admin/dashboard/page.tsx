"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { seedDummyProducts } from "@/lib/seedProducts";
import { useAuth } from "@/context/AuthContext";
import type { Product, Order } from "@/types";

interface UserData {
  uid: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const { user, photoBase64 } = useAuth();
  const [stats, setStats] = useState({ products: 0, activeProducts: 0, orders: 0, users: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<{ uid: string; order: Order }[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserData[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");

  // Real-time listeners
  useEffect(() => {
    let loadedFlags = { products: false, orders: false, users: false };

    // Products listener
    const productsRef = ref(db, "products");
    const unsubProducts = onValue(productsRef, (snap) => {
      const products: Product[] = [];
      if (snap.exists()) {
        const data = snap.val();
        for (const [id, val] of Object.entries(data)) {
          products.push({ id, ...(val as Omit<Product, "id">) });
        }
      }
      const active = products.filter((p) => p.active !== false);
      setTopProducts(products.filter((p) => p.featured && p.active !== false).slice(0, 4));
      setStats((prev) => ({ ...prev, products: products.length, activeProducts: active.length }));
      loadedFlags.products = true;
      if (loadedFlags.products && loadedFlags.orders && loadedFlags.users) setLoading(false);
    });

    // Orders listener
    const ordersRef = ref(db, "orders");
    const unsubOrders = onValue(ordersRef, (snap) => {
      const allOrders: { uid: string; order: Order }[] = [];
      if (snap.exists()) {
        const data = snap.val();
        for (const [uid, userOrders] of Object.entries(data)) {
          for (const [id, val] of Object.entries(userOrders as Record<string, unknown>)) {
            allOrders.push({ uid, order: { id, ...(val as Omit<Order, "id">) } });
          }
        }
      }
      allOrders.sort((a, b) => (b.order.createdAt || "").localeCompare(a.order.createdAt || ""));
      const revenue = allOrders.reduce((sum, o) => sum + (o.order.total || 0), 0);
      setRecentOrders(allOrders.slice(0, 5));
      setStats((prev) => ({ ...prev, orders: allOrders.length, revenue }));
      loadedFlags.orders = true;
      if (loadedFlags.products && loadedFlags.orders && loadedFlags.users) setLoading(false);
    });

    // Users listener
    const usersRef = ref(db, "users");
    const unsubUsers = onValue(usersRef, (snap) => {
      const usersData: UserData[] = [];
      if (snap.exists()) {
        const data = snap.val();
        for (const [uid, val] of Object.entries(data)) {
          const u = val as Record<string, unknown>;
          usersData.push({
            uid,
            name: u.name as string,
            email: u.email as string,
            role: u.role as string,
            createdAt: u.createdAt as string,
          });
        }
      }
      usersData.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setRecentUsers(usersData.slice(0, 5));
      setStats((prev) => ({ ...prev, users: usersData.length }));
      loadedFlags.users = true;
      if (loadedFlags.products && loadedFlags.orders && loadedFlags.users) setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubUsers();
    };
  }, []);

  const handleSeed = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      const count = await seedDummyProducts(user.uid);
      setSeedMsg(`Seeded ${count} products!`);
      setTimeout(() => setSeedMsg(""), 3000);
    } catch (err) {
      setSeedMsg("Seed failed: " + String(err));
    } finally {
      setSeeding(false);
    }
  };

  const statCards = [
    { label: "Total Products", value: stats.products, sub: `${stats.activeProducts} active`, color: "from-blue-500 to-cyan-500", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
    { label: "Total Orders", value: stats.orders, sub: "all time", color: "from-green-500 to-emerald-500", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { label: "Total Users", value: stats.users, sub: "registered", color: "from-purple-500 to-violet-500", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { label: "Revenue", value: `Rs. ${stats.revenue.toLocaleString()}`, sub: "total earned", color: "from-amber-500 to-orange-500", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  const userInitial = user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "A";

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Live store overview — updates in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          {stats.products === 0 && (
            <button onClick={handleSeed} disabled={seeding} className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition shadow-md">
              {seeding ? "Seeding..." : "Seed Demo Products"}
            </button>
          )}
          <Link href="/admin/products/new" className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition">
            + Add Product
          </Link>
          {/* Profile icon */}
          <Link href="/profile" title="My Profile">
            {photoBase64 ? (
              <img src={photoBase64} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-200 hover:ring-purple-400 transition" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold hover:opacity-80 transition ring-2 ring-purple-200">
                {userInitial}
              </div>
            )}
          </Link>
        </div>
      </div>

      {seedMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">{seedMsg}</div>}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                </svg>
              </div>
              <span className="w-2 h-2 bg-green-400 rounded-full" title="Live" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/products" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-purple-200 transition group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Manage Products</p>
              <p className="text-xs text-gray-400">{stats.products} products</p>
            </div>
          </div>
        </Link>
        <Link href="/admin/orders" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-purple-200 transition group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Manage Orders</p>
              <p className="text-xs text-gray-400">{stats.orders} orders</p>
            </div>
          </div>
        </Link>
        <Link href="/store" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-purple-200 transition group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">View Store</p>
              <p className="text-xs text-gray-400">as customer sees it</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              Recent Orders
              <span className="w-2 h-2 bg-green-400 rounded-full" title="Live" />
            </h2>
            <Link href="/admin/orders" className="text-sm text-purple-600 hover:text-purple-700 font-medium">View All</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(({ order }) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">#{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">Rs. {order.total?.toLocaleString()}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              Recent Users
              <span className="w-2 h-2 bg-green-400 rounded-full" title="Live" />
            </h2>
            <span className="text-sm text-gray-400">{stats.users} total</span>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No users yet</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((u) => (
                <div key={u.uid} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {u.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.name || "Unknown"}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                    {u.role || "user"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Featured Products */}
      {topProducts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Featured Products</h2>
            <Link href="/admin/products" className="text-sm text-purple-600 hover:text-purple-700 font-medium">Manage All</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {topProducts.map((p) => (
              <div key={p.id} className="rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition">
                {p.imageThumbnail && (
                  <img src={p.imageThumbnail} alt={p.name} className="w-full aspect-[3/4] object-cover" />
                )}
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-purple-600 font-semibold">Rs. {p.price?.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Stock: {p.stock ?? "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
