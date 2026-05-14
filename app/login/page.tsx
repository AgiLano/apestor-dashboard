"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // =========================
  // LOGIN
  // =========================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // LOGOUT SESSION LAMA
      await supabase.auth.signOut();

      // LOGIN
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      // REDIRECT
      router.push("/admin");

      router.refresh();
    } catch (err) {
      console.error(err);

      alert("Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
        {/* TITLE */}
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">ADMIN LOGIN</h1>

        <p className="text-zinc-400 mb-8">Login untuk masuk ke admin panel</p>

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* EMAIL */}
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-yellow-400 transition-all"
            required
          />

          {/* PASSWORD */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-2xl px-5 py-4 pr-14 text-white outline-none focus:border-yellow-400 transition-all"
              required
            />

            {/* EYE BUTTON */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-all"
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 transition-all text-black font-bold py-4 rounded-2xl disabled:opacity-50"
          >
            {loading ? "LOADING..." : "LOGIN"}
          </button>
        </form>
      </div>
    </main>
  );
}
