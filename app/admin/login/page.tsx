"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function verifyAdmin(token: string) {
    const response = await fetch("/api/admin/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    return response.ok;
  }

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      const { data } = await supabase.auth.getSession();

      if (!active || !data.session) return;

      const isAdmin = await verifyAdmin(data.session.access_token);

      if (active && isAdmin) {
        router.replace("/admin/dashboard");
      }
    }

    checkAdmin();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      setError(error?.message || "Login failed.");
      setLoading(false);
      return;
    }

    const isAdmin = await verifyAdmin(data.session.access_token);

    if (!isAdmin) {
      await supabase.auth.signOut({ scope: "local" });
      setError("Access denied. This account is not an administrator.");
      setLoading(false);
      return;
    }

    router.replace("/admin/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-2xl text-white">
          🔐
        </div>

        <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>

        <p className="mt-2 text-sm text-slate-500">
          Sign in with your administrator account.
        </p>

        <label className="mb-2 mt-6 block text-sm font-semibold text-slate-700">
          Email Address
        </label>

        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Admin email"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
        />

        <label className="mb-2 mt-5 block text-sm font-semibold text-slate-700">
          Password
        </label>

        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Login as Admin"}
        </button>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          <a href="/login" className="font-semibold text-blue-600">
            Back to User Login
          </a>
        </p>
      </form>
    </main>
  );
}
