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

function AdminUserDetailsContent() {
  const params = useParams();
  const router = useRouter();

  const userId = params.userId as string;

  const [data, setData] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTasks() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();

        const token = sessionData.session?.access_token;

        if (!token) {
          router.replace("/admin/login");
          return;
        }

        const response = await fetch(
          `/api/admin/users/${encodeURIComponent(userId)}/tasks`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load user tasks");
        }

        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      loadTasks();
    }
  }, [userId, router]);

  if (loading) {
    return <p className="p-8 text-center">Loading user details...</p>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error}</p>
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

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Total Tasks</p>
            <h2 className="mt-2 text-3xl font-bold">{data?.totalTasks ?? 0}</h2>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Completed Tasks</p>
            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {data?.completedTasks ?? 0}
            </h2>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Pending Tasks</p>
            <h2 className="mt-2 text-3xl font-bold text-orange-500">
              {data?.pendingTasks ?? 0}
            </h2>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="border-b p-5">
            <h2 className="text-xl font-semibold">User Tasks</h2>
          </div>

          {data?.tasks.length ? (
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
