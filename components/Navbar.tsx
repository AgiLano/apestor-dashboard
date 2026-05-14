"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className="w-full border-b border-zinc-800 bg-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* LOGO */}
        <h1 className="text-2xl font-black text-yellow-400 tracking-wide">
          APESTOR
        </h1>

        {/* MENU */}
        <div className="flex items-center gap-3">
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
