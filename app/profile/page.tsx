"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type UserProfile = {
  id: string;
  email?: string;
  created_at: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      setUser({
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
      });

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
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

    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Password updated successfully!");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account and all your tasks? This action cannot be undone.",
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !data.session) {
        throw new Error("Please log in again.");
      }

      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not delete account.");
      }

      await supabase.auth.signOut({ scope: "local" });

      router.replace("/signup");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete account.",
      );
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => router.push("/")}
          className="mb-6 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back to Dashboard
        </button>

        {/* Profile Information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
            {user?.email?.charAt(0).toUpperCase()}
          </div>

          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>

          <p className="mt-2 text-sm text-slate-500">
            View your account information.
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Email Address
              </p>
              <p className="mt-1 break-all font-semibold text-slate-900">
                {user?.email}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">User ID</p>
              <p className="mt-1 break-all text-sm text-slate-700">
                {user?.id}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Account Created
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Change Password</h2>

          <p className="mt-2 text-sm text-slate-500">
            Create a new password for your account.
          </p>

          <form onSubmit={handleChangePassword} className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
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
              Confirm New Password
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
              disabled={saving}
              className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Delete Account */}
        <div className="mt-6 rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-red-600">Delete Account</h2>

          <p className="mt-2 text-sm text-slate-500">
            Permanently delete your account and all associated tasks. This
            action cannot be undone.
          </p>

          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="mt-6 w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting Account..." : "Delete My Account"}
          </button>
        </div>

        {/* Messages */}
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
      </div>
    </main>
  );
}
