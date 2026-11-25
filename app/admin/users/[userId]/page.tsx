"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Task = {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
};

type TaskData = {
  tasks: Task[];
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
};

type AdminUser = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  bannedUntil: string | null;
};

function AdminUserDetailsContent() {
  const params = useParams();
  const router = useRouter();

  const userId = params.userId as string;

  const [data, setData] = useState<TaskData | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUserDetails() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        if (!token) {
          router.replace("/admin/login");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [tasksResponse, usersResponse] = await Promise.all([
          fetch(`/api/admin/users/${encodeURIComponent(userId)}/tasks`, {
            headers,
          }),
          fetch("/api/admin/users", { headers }),
        ]);

        const tasksResult = await tasksResponse.json();
        const usersResult = await usersResponse.json();

        if (!tasksResponse.ok) {
          throw new Error(tasksResult.error || "Failed to load tasks");
        }

        if (!usersResponse.ok) {
          throw new Error(usersResult.error || "Failed to load user details");
        }

        const selectedUser = (usersResult.users as AdminUser[]).find(
          (item) => item.id === userId,
        );

        if (!selectedUser) {
          throw new Error("User not found");
        }

        setData(tasksResult);
        setUser(selectedUser);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      loadUserDetails();
    }
  }, [userId, router]);

  const isActive =
    user?.bannedUntil == null ||
    new Date(user.bannedUntil).getTime() <= Date.now();

  if (loading) {
    return <p className="p-8 text-center">Loading user details...</p>;
  }

  if (error || !user || !data) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error || "User not found"}</p>
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="mt-4 rounded-lg bg-black px-5 py-2 text-white"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="mb-6 rounded-lg border bg-white px-4 py-2 text-sm hover:bg-gray-100"
        >
          ← Back to Dashboard
        </button>

        <h1 className="mb-2 text-3xl font-bold text-gray-900">User Details</h1>

        <p className="mb-6 break-all text-sm text-gray-500">
          User ID: {userId}
        </p>

        {/* Account Information */}
        <div className="mb-8 rounded-xl border bg-white p-6">
          <h2 className="mb-5 text-xl font-semibold">Account Information</h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Email Address</p>
              <p className="mt-1 break-all font-medium text-gray-900">
                {user.email || "No email"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Account Status</p>
              <span
                className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div>
              <p className="text-sm text-gray-500">Account Created</p>
              <p className="mt-1 font-medium text-gray-900">
                {new Date(user.createdAt).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Last Sign In</p>
              <p className="mt-1 font-medium text-gray-900">
                {user.lastSignInAt
                  ? new Date(user.lastSignInAt).toLocaleString()
                  : "Never signed in"}
              </p>
            </div>
          </div>
        </div>

        {/* Task Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Total Tasks</p>
            <h2 className="mt-2 text-3xl font-bold">{data.totalTasks}</h2>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Completed Tasks</p>
            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {data.completedTasks}
            </h2>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Pending Tasks</p>
            <h2 className="mt-2 text-3xl font-bold text-orange-500">
              {data.pendingTasks}
            </h2>
          </div>
        </div>

        {/* User Tasks */}
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="border-b p-5">
            <h2 className="text-xl font-semibold">User Tasks</h2>
          </div>

          {data.tasks.length ? (
            <div className="divide-y">
              {data.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col justify-between gap-2 p-5 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-medium text-gray-900">{task.title}</p>

                    <p className="mt-1 text-xs text-gray-500">
                      Created: {new Date(task.created_at).toLocaleString()}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                      task.completed
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {task.completed ? "Completed" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-8 text-center text-gray-500">
              This user has no tasks yet.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function AdminUserDetailsPage() {
  return (
    <Suspense
      fallback={<p className="p-8 text-center">Loading user details...</p>}
    >
      <AdminUserDetailsContent />
    </Suspense>
  );
}
