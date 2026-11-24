"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect logged-in users to dashboard
  useEffect(() => {
    let active = true;

    async function checkUser() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (!error && data.session) {
        router.replace("/");
      }
    }

    checkUser();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
      >
        <h1 className="mb-2 text-3xl font-bold text-slate-900">Welcome Back</h1>

        <p className="mb-6 text-gray-500">
          Login to your Task Manager account.
        </p>

        <label className="mb-2 block text-sm font-medium text-slate-700">
          Email
        </label>

        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="mb-4 w-full rounded-lg border border-slate-200 p-3 text-slate-900 outline-none focus:border-blue-500"
        />

        <label className="mb-2 block text-sm font-medium text-slate-700">
          Password
        </label>

        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full rounded-lg border border-slate-200 p-3 text-slate-900 outline-none focus:border-blue-500"
        />

        <div className="mt-3 text-right">
          <a
            href="/forgot-password"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Forgot Password?
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-blue-600 p-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {message && <p className="mt-4 text-sm text-red-600">{message}</p>}

        <p className="mt-5 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <a
            href="/signup"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Sign Up
          </a>
        </p>
      </form>
    </main>
  );
}
