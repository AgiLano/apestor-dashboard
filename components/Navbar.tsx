"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className="w-full border-b border-zinc-800 bg-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* LOGO */}
        <div className="flex items-center gap-4">
          <img
            src="/logo-navbar.png"
            alt="APESTOR"
            className="w-14 h-14 rounded-full border-2 border-yellow-400 shadow-lg shadow-yellow-400/20 object-contain bg-black p-1"
          />

          <div>
            <h1 className="text-2xl font-black text-yellow-400 tracking-wide">
              APESTOR
            </h1>

            <p className="text-xs text-zinc-500">Grup Ritel Unyu</p>
          </div>
        </div>

        {/* MENU */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className={`px-5 py-2 rounded-xl font-bold transition-all ${
              pathname === "/"
                ? "bg-yellow-400 text-black"
                : "bg-zinc-900 text-white hover:bg-zinc-800"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/admin"
            className={`px-5 py-2 rounded-xl font-bold transition-all ${
              pathname === "/admin"
                ? "bg-yellow-400 text-black"
                : "bg-zinc-900 text-white hover:bg-zinc-800"
            }`}
          >
            Admin Panel
          </Link>

          <Link
            href="/history"
            className={`px-5 py-2 rounded-xl font-bold transition-all ${
              pathname === "/history"
                ? "bg-yellow-400 text-black"
                : "bg-zinc-900 text-white hover:bg-zinc-800"
            }`}
          >
            History Recap
          </Link>
        </div>
      </div>
    </div>
  );
}
