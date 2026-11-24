
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Password reset instructions have been sent to your email.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <form
        onSubmit={handleReset}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-2xl text-white">
          🔐
        </div>

        <h1 className="text-2xl font-bold text-slate-900">
          Forgot Password?
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Enter your email address and we'll send you a password reset link.
        </p>

        <label className="mb-2 mt-6 block text-sm font-semibold text-slate-700">
          Email Address
        </label>

        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        {message && (
          <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-blue-600">
            Back to Login
          </Link>
        </p>
      </form>
    </main>
  );
}
