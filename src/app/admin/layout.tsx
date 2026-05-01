"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AdminGuard from "@/components/auth/AdminGuard";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/admin/products", label: "Products", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { href: "/admin/orders", label: "Orders", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
];

function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, photoBase64, logout } = useAuth();
  const userInitial = user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "A";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar — sticky full height */}
      <aside className="w-64 bg-gray-950 text-white flex-shrink-0 hidden lg:flex flex-col h-screen sticky top-0 border-r border-gray-800">
        <div className="px-6 py-5 border-b border-gray-800 flex-shrink-0">
          <Link href="/" className="text-xl font-extrabold tracking-tight">
            Glam<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Verse</span>
          </Link>
          <p className="text-xs text-gray-500 mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  active
                    ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to Store */}
        <div className="px-3 pb-2 flex-shrink-0">
          <Link
            href="/store"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            Back to Store
          </Link>
        </div>

        {/* User Info + Profile + Logout */}
        <div className="px-4 py-4 border-t border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/profile")} className="flex-shrink-0 focus:outline-none" title="View Profile">
              {photoBase64 ? (
                <img src={photoBase64} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500/40 hover:ring-purple-400 transition" />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold hover:opacity-80 transition">
                  {userInitial}
                </div>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{user?.displayName || "Admin"}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="text-gray-500 hover:text-red-400 transition flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-gray-950 text-white px-4 py-3 flex items-center justify-between z-50 border-b border-gray-800">
        <span className="font-extrabold">
          Glam<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Verse</span>
          <span className="text-xs text-gray-500 ml-2">Admin</span>
        </span>
        <div className="flex gap-2 items-center">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={`text-xs px-2.5 py-1.5 rounded-lg font-medium ${pathname.startsWith(item.href) ? "bg-purple-500/20 text-purple-300" : "text-gray-400"}`}>
              {item.label}
            </Link>
          ))}
          <Link href="/store" className="text-xs px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-white">Store</Link>
        </div>
      </div>

      {/* Main Content — scrollable */}
      <main className="flex-1 overflow-y-auto lg:p-8 p-4 pt-16 lg:pt-8">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminLayout>{children}</AdminLayout>
    </AdminGuard>
  );
}
