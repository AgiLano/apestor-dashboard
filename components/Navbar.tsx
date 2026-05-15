"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const pathname = usePathname();

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsAdmin(!!session);
    }

    checkSession();
  }, []);

  return (
    <div className="w-full border-b border-zinc-800 bg-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <img
            src="/logo-navbar.png"
            alt="APESTOR"
            className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-yellow-400 shadow-lg shadow-yellow-400/20 object-contain bg-black p-1"
          />

          <div>
            <h1 className="text-lg md:text-2xl font-black text-yellow-400 tracking-wide">
              APESTOR
            </h1>

            <p className="text-xs text-zinc-500">Grup Ritel Unyu</p>
          </div>
        </div>

        {/* MENU */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className={`px-3 md:px-5 py-2 text-sm md:text-base rounded-xl font-bold transition-all ${
              pathname === "/"
                ? "bg-yellow-400 text-black"
                : "bg-zinc-900 text-white hover:bg-zinc-800"
            }`}
          >
            Dashboard
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className={`px-3 md:px-5 py-2 text-sm md:text-base rounded-xl font-bold transition-all ${
                pathname === "/admin"
                  ? "bg-yellow-400 text-black"
                  : "bg-zinc-900 text-white hover:bg-zinc-800"
              }`}
            >
              Admin Panel
            </Link>
          )}

          <Link
            href="/history"
            className={`px-3 md:px-5 py-2 text-sm md:text-base rounded-xl font-bold transition-all ${
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
