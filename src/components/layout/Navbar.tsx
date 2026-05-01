"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCart } from "@/lib/cart";

export default function Navbar() {
  const { user, logout, isAdmin, photoBase64 } = useAuth();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showTryOn, setShowTryOn] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCart(user.uid).then((items) => {
      setCartCount(items.reduce((sum, i) => sum + i.quantity, 0));
    });
  }, [user, pathname]);

  const navLink = (href: string, label: string) => {
    const active = pathname === href || (href !== "/" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={`px-4 py-2 rounded-lg text-sm font-semibold tracking-wide transition ${
          active ? "bg-white text-gray-900 shadow-sm" : "text-white/90 hover:text-white hover:bg-white/10"
        }`}
      >
        {label}
      </Link>
    );
  };

  const userInitial = user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U";

  return (
    <nav className="bg-gray-950 sticky top-0 z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="text-xl font-extrabold tracking-tight text-white">
            Glam<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Verse</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLink("/store", "Store")}
          {/* Virtual Try-On Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTryOn(!showTryOn)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold tracking-wide transition flex items-center gap-1.5 ${
                pathname.startsWith("/tryon") || pathname.includes("/tryon")
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
            >
              Try-On
              <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showTryOn && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTryOn(false)} />
                <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                  <Link href="/store" onClick={() => setShowTryOn(false)} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition">
                    Try On Products
                  </Link>
                  <Link href="/tryon" onClick={() => setShowTryOn(false)} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition">
                    Custom Try-On
                  </Link>
                </div>
              </>
            )}
          </div>
          {navLink("/dashboard", "AI Analysis")}
          {navLink("/orders", "Orders")}
          {isAdmin && navLink("/admin/dashboard", "Admin")}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Cart */}
          <Link href="/cart" className="relative p-2 text-white/80 hover:text-white transition rounded-lg hover:bg-white/10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>

          {/* User Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2.5 hover:bg-white/10 rounded-xl px-2.5 py-1.5 transition"
              >
                <span className="hidden sm:block text-sm font-semibold text-white max-w-[120px] truncate">
                  {user.displayName || "User"}
                </span>
                {photoBase64 ? (
                  <img src={photoBase64} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/50" />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-purple-500/30">
                    {userInitial}
                  </div>
                )}
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link href="/profile" onClick={() => setShowMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      My Profile
                    </Link>
                    <Link href="/orders" onClick={() => setShowMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      My Orders
                    </Link>
                    <Link href="/dashboard" onClick={() => setShowMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                      AI Analysis
                    </Link>
                    {isAdmin && (
                      <Link href="/admin/dashboard" onClick={() => setShowMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-50 transition border-t border-gray-100 mt-1 pt-1">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Admin Dashboard
                      </Link>
                    )}
                    {/* Mobile-only extra nav */}
                    <div className="md:hidden border-t border-gray-100 mt-1 pt-1">
                      <Link href="/store" onClick={() => setShowMenu(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Store</Link>
                    </div>
                    <button
                      onClick={() => { setShowMenu(false); logout(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100 mt-1 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/auth/login" className="px-4 py-2 text-white/90 hover:text-white text-sm font-semibold transition">
                Sign In
              </Link>
              <Link href="/auth/signup" className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-bold hover:opacity-90 transition shadow-lg shadow-purple-500/25">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
