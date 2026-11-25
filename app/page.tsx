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

type Filter = "all" | "pending" | "completed";

export default function Home() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  async function getAuthHeaders() {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      router.replace("/signup");
      throw new Error("Please log in to continue.");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
    };
  }

  async function handleLogout() {
    setError("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(error.message);
      return;
    }

    router.replace("/signup");
    router.refresh();
  }

  async function fetchTasks() {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch("/api/tasks", {
        method: "GET",
        headers,
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load tasks");
      }

      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tasks");
    } finally {
      setLoading(false);
    }
  }

  // Check authentication before showing dashboard
  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (!active) return;

        if (error || !data.user) {
          router.replace("/signup");
          return;
        }

        setUserEmail(data.user.email ?? "");

        await fetchTasks();
      } catch {
        if (active) {
          setLoading(false);
          router.replace("/signup");
        }
      }
    }

    checkAuth();

    return () => {
      active = false;
    };
  }, [router]);

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

      if (!response.ok) {
        throw new Error(data.error || "Could not add task");
      }

      setTasks((prev) => [data, ...prev]);
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add task");
    } finally {
      setSaving(false);
    }
  }

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

      if (!response.ok) {
        throw new Error(data.error || "Could not update task");
      }

      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? data : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update task");
    }
  }

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

      if (!response.ok) {
        throw new Error(data.error || "Could not delete task");
      }

      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete task");
    }
  }

  const completed = tasks.filter((task) => task.completed).length;
  const pending = tasks.length - completed;

  const progress =
    tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && !task.completed) ||
      (filter === "completed" && task.completed);

    return matchesSearch && matchesFilter;
  });

  // IMPORTANT: Do not render dashboard before authentication finishes
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>

          <p className="text-sm font-medium text-slate-500">
            Checking your account...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-sm">
              T
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">Task Manager</h1>

              <p className="text-xs text-slate-500">
                {userEmail || "Your personal workspace"}
              </p>
            </div>
          </div>

          {/* Profile and Logout */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/profile")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Profile
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Logout ↗
            </button>
          </div>
        </header>

        {/* Welcome */}
        <section className="mb-8">
          <p className="mb-2 text-sm font-semibold text-blue-600">
            MY WORKSPACE
          </p>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Manage your tasks.
          </h2>

          <p className="mt-2 text-slate-500">
            Stay organized, focus on what matters, and get things done.
          </p>
        </section>

        {/* Statistics */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Tasks</p>
            <p className="mt-3 text-3xl font-bold">{tasks.length}</p>
            <p className="mt-1 text-xs text-slate-400">All your tasks</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Completed</p>
            <p className="mt-3 text-3xl font-bold text-emerald-600">
              {completed}
            </p>
            <p className="mt-1 text-xs text-slate-400">Tasks finished</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Pending</p>
            <p className="mt-3 text-3xl font-bold text-orange-500">{pending}</p>
            <p className="mt-1 text-xs text-slate-400">Tasks remaining</p>
          </div>
        </section>

        {/* Progress */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Your progress</h3>
            <span className="text-sm font-bold text-blue-600">{progress}%</span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-3 text-xs text-slate-500">
            {completed} of {tasks.length} tasks completed
          </p>
        </section>

        {/* Add Task */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold">Add a new task</h3>

          <form onSubmit={addTask} className="flex flex-col gap-3 sm:flex-row">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />

            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Adding..." : "+ Add Task"}
            </button>
          </form>
        </section>

        {/* Error */}
        {error && (
          <p className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Task List */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold">Your Tasks</h3>
              <p className="mt-1 text-sm text-slate-500">
                Manage and track your daily activities.
              </p>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 sm:w-56"
            />
          </div>

          {/* Filters */}
          <div className="mb-5 flex flex-wrap gap-2">
            {(["all", "pending", "completed"] as Filter[]).map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                  filter === item
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item}
                {item === "all"
                  ? ` (${tasks.length})`
                  : item === "pending"
                    ? ` (${pending})`
                    : ` (${completed})`}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100" />

          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mb-3 text-4xl">📝</div>

              <h4 className="font-semibold text-slate-700">
                {search || filter !== "all"
                  ? "No matching tasks"
                  : "No tasks yet"}
              </h4>

              <p className="mt-2 text-sm text-slate-400">
                {search || filter !== "all"
                  ? "Try changing your search or filter."
                  : "Add your first task to get started."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 py-4">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task)}
                    aria-label={`Mark ${task.title} as ${
                      task.completed ? "pending" : "completed"
                    }`}
                    className="h-5 w-5 shrink-0 cursor-pointer accent-blue-600"
                  />

                  <span
                    className={`min-w-0 flex-1 break-words text-sm font-medium ${
                      task.completed
                        ? "text-slate-400 line-through"
                        : "text-slate-700"
                    }`}
                  >
                    {task.title}
                  </span>

                  <button
                    onClick={() => deleteTask(task.id)}
                    aria-label={`Delete ${task.title}`}
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-xs text-slate-400">
          Built with Next.js, Supabase and PostgreSQL
        </footer>
      </div>
    </main>
  );
}
