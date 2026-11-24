"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Task = {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
};

export default function Home() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Get the logged-in user's access token
  async function getAuthHeaders() {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      router.push("/login");
      throw new Error("Please log in to continue.");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
    };
  }

  // Logout
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  // Load tasks
  async function fetchTasks() {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch("/api/tasks", {
        method: "GET",
        headers,
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  // Add task
  async function addTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim()) return;

    setSaving(true);
    setError("");

    try {
      const headers = await getAuthHeaders();

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers,
        body: JSON.stringify({ title }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setTasks((prev) => [data, ...prev]);
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add task");
    } finally {
      setSaving(false);
    }
  }

  // Complete or uncomplete task
  async function toggleTask(task: Task) {
    setError("");

    try {
      const headers = await getAuthHeaders();

      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          id: task.id,
          completed: !task.completed,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? data : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update task");
    }
  }

  // Delete task
  async function deleteTask(id: number) {
    setError("");

    try {
      const headers = await getAuthHeaders();

      const response = await fetch("/api/tasks", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete task");
    }
  }

  const completed = tasks.filter((task) => task.completed).length;
  const pending = tasks.length - completed;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">MY WORKSPACE</p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Task Manager
            </h1>

            <p className="mt-2 text-slate-500">
              Organize your work and get things done.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
          >
            Logout
          </button>
        </header>

        <section className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-slate-500">Total</p>
            <p className="mt-2 text-2xl font-bold">{tasks.length}</p>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-slate-500">Completed</p>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {completed}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="mt-2 text-2xl font-bold text-orange-500">{pending}</p>
          </div>
        </section>

        <form onSubmit={addTask} className="mb-6 flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="min-w-0 flex-1 rounded-xl border bg-white px-4 py-3 outline-none focus:border-blue-500"
          />

          <button
            disabled={saving || !title.trim()}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Task"}
          </button>
        </form>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <section className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 font-semibold">Your Tasks</h2>

          {loading ? (
            <p className="py-8 text-center text-slate-500">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="py-8 text-center text-slate-400">
              No tasks yet. Add your first task!
            </p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border p-4"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task)}
                    className="h-5 w-5 accent-blue-600"
                  />

                  <span
                    className={`flex-1 break-words ${
                      task.completed
                        ? "text-slate-400 line-through"
                        : "text-slate-700"
                    }`}
                  >
                    {task.title}
                  </span>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-sm font-medium text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          Built with Next.js + Supabase + PostgreSQL
        </p>
      </div>
    </main>
  );
}
