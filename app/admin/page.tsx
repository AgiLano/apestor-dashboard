"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/admin");
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-5">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">ADMIN LOGIN</h1>

        <p className="text-zinc-400 mb-8">Login untuk mengakses admin panel</p>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* EMAIL */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-2xl p-4 text-white outline-none"
            required
          />

          {/* PASSWORD */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-2xl p-4 pr-14 text-white outline-none"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 transition-all text-black font-bold py-4 rounded-2xl"
          >
            {loading ? "Loading..." : "LOGIN"}
          </button>
        </form>
      </div>
    </main>
  );
}
