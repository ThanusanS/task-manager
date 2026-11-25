"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type UserProfile = {
  id: string;
  email?: string;
  created_at: string;
  avatar_url?: string;
};

// Get the Storage file path from a public avatar URL.
function getAvatarFilePath(avatarUrl?: string | null): string | null {
  if (!avatarUrl) return null;

  try {
    const url = new URL(avatarUrl);
    const marker = "/storage/v1/object/public/avatars/";
    const index = url.pathname.indexOf(marker);

    if (index === -1) return null;

    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

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
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const { data, error } = await supabase.auth.getUser();

      if (!active) return;

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      setUser({
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
        avatar_url: data.user.user_metadata?.avatar_url || "",
      });

      setLoading(false);
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  // Upload or change profile photo
  async function handleUploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file || !user) return;

    setMessage("");
    setError("");

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WEBP image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);

    try {
      // Get the currently authenticated user.
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Please log in again.");
      }

      const currentUser = authData.user;

      // Remember the old photo path so it can be deleted later.
      const oldAvatarUrl = currentUser.user_metadata?.avatar_url || "";

      const oldFilePath = getAvatarFilePath(oldAvatarUrl);

      // Create a unique file name for every upload.
      const extension =
        file.type === "image/jpeg"
          ? "jpg"
          : file.type === "image/png"
            ? "png"
            : "webp";

      const filePath = `${currentUser.id}/${Date.now()}.${extension}`;

      // Upload the new photo.
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Generate the public URL.
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      // Save the new photo URL in user metadata.
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: avatarUrl,
        },
      });

      if (updateError) {
        // Remove the newly uploaded file if metadata update fails.
        await supabase.storage.from("avatars").remove([filePath]);
        throw updateError;
      }

      // Update the profile immediately.
      setUser((previous) =>
        previous
          ? {
              ...previous,
              avatar_url: avatarUrl,
            }
          : previous,
      );

      setMessage("Profile photo updated successfully!");

      // Delete the previous photo after the new one is saved.
      if (oldFilePath && oldFilePath !== filePath) {
        const { error: removeError } = await supabase.storage
          .from("avatars")
          .remove([oldFilePath]);

        if (removeError) {
          console.warn("Could not delete the previous avatar:", removeError);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not upload profile photo.",
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // Remove profile photo
  async function handleRemovePhoto() {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove your profile photo?",
    );

    if (!confirmed) return;

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Please log in again.");
      }

      const oldAvatarUrl = authData.user.user_metadata?.avatar_url || "";

      const oldFilePath = getAvatarFilePath(oldAvatarUrl);

      // Remove the URL from user metadata first.
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: null,
        },
      });

      if (updateError) {
        throw updateError;
      }

      setUser((previous) =>
        previous
          ? {
              ...previous,
              avatar_url: "",
            }
          : previous,
      );

      // Delete the old Storage file.
      if (oldFilePath) {
        const { error: removeError } = await supabase.storage
          .from("avatars")
          .remove([oldFilePath]);

        if (removeError) {
          console.warn("Could not delete the old avatar:", removeError);
        }
      }

      setMessage("Profile photo removed successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not remove profile photo.",
      );
    } finally {
      setUploading(false);
    }
  }

  // Change password
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

  // Delete account
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

      router.replace("/");
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
          onClick={() => router.push("/dashboard")}
          className="mb-6 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back to Dashboard
        </button>

        {/* Profile Information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-start gap-4">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Profile photo"
                className="h-24 w-24 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage your account and profile photo.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <label
                className={`cursor-pointer rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 ${
                  uploading ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                {uploading
                  ? "Uploading..."
                  : user?.avatar_url
                    ? "Change Photo"
                    : "Upload Photo"}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUploadPhoto}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              {user?.avatar_url && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploading}
                  className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  Remove Photo
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400">
              JPG, PNG or WEBP. Maximum size: 5 MB.
            </p>
          </div>

          <div className="mt-8 space-y-5 border-t border-slate-100 pt-6">
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
