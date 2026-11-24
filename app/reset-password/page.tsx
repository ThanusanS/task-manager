"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Password updated successfully!");

    setTimeout(() => {
      router.push("/login");
    }, 2000);
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

        <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>

        <p className="mt-2 text-sm text-slate-500">
          Enter your new password below.
        </p>

        <label className="mb-2 mt-6 block text-sm font-semibold text-slate-700">
          New Password
        </label>

        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
        />

        <label className="mb-2 mt-5 block text-sm font-semibold text-slate-700">
          Confirm Password
        </label>

        <input
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Password"}
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
      </form>
    </main>
  );
}
