"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function DashboardNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-40">
      {/* Top Section */}
      <div className="p-6 border-b border-slate-200">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-bold text-white text-xl group-hover:shadow-sm transition duration-300">
            IE
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-slate-900">InvestEase</h1>
            <p className="text-xs text-slate-500">Invest Smart</p>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-8 px-4 space-y-2">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition duration-200 ${
            isActive("/dashboard")
              ? "bg-indigo-50 text-indigo-600 font-medium"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span className="text-xl">◆</span>
          <span>Dashboard</span>
        </Link>

        <Link
          href="/goals"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition duration-200 ${
            isActive("/goals")
              ? "bg-indigo-50 text-indigo-600 font-medium"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span className="text-xl">★</span>
          <span>Goals</span>
        </Link>

        <Link
          href="/learn"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition duration-200 ${
            isActive("/learn")
              ? "bg-indigo-50 text-indigo-600 font-medium"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span className="text-xl">◉</span>
          <span>Learn</span>
        </Link>

        <Link
          href="/portfolio"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition duration-200 ${
            isActive("/portfolio")
              ? "bg-indigo-50 text-indigo-600 font-medium"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span className="text-xl">◈</span>
          <span>Portfolio</span>
        </Link>

        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition duration-200"
        >
          <span className="text-xl">⚙</span>
          <span>Settings</span>
        </Link>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-200 space-y-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition duration-200 font-semibold"
        >
          <span className="text-xl">←</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
