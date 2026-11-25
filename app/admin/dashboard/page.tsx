"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Stats = {
  totalUsers: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
};

type AdminUser = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !data.session) {
          router.replace("/admin/login");
          return;
        }

        if (!active) return;

        setEmail(data.session.user.email || "");

        const headers = {
          Authorization: `Bearer ${data.session.access_token}`,
        };

        const [statsResponse, usersResponse] = await Promise.all([
          fetch("/api/admin/stats", {
            headers,
            cache: "no-store",
          }),
          fetch("/api/admin/users", {
            headers,
            cache: "no-store",
          }),
        ]);

        if (
          statsResponse.status === 401 ||
          statsResponse.status === 403 ||
          usersResponse.status === 401 ||
          usersResponse.status === 403
        ) {
          await supabase.auth.signOut({ scope: "local" });
          router.replace("/admin/login");
          return;
        }

        if (!statsResponse.ok) {
          throw new Error("Unable to load dashboard statistics.");
        }

        if (!usersResponse.ok) {
          throw new Error("Unable to load registered users.");
        }

        const statsResult: Stats = await statsResponse.json();

        const usersResult: { users: AdminUser[] } = await usersResponse.json();

        if (active) {
          setStats(statsResult);
          setUsers(usersResult.users);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Something went wrong.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/admin/login");
    router.refresh();
  }

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(search.toLowerCase()),
  );

  const cards = [
    {
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: "👥",
      description: "Registered accounts",
    },
    {
      title: "Total Tasks",
      value: stats?.totalTasks ?? 0,
      icon: "📋",
      description: "All user tasks",
    },
    {
      title: "Completed Tasks",
      value: stats?.completedTasks ?? 0,
      icon: "✅",
      description: "Successfully completed",
    },
    {
      title: "Pending Tasks",
      value: stats?.pendingTasks ?? 0,
      icon: "⏳",
      description: "Tasks still pending",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Task Manager Admin
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Administration Dashboard
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Dashboard Overview
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Welcome, {email || "Admin"}
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Loading dashboard...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-600">
            {error}

            <button
              onClick={() => window.location.reload()}
              className="ml-3 font-semibold underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Dashboard Statistics */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">
                      {card.title}
                    </p>

                    <span className="text-2xl">{card.icon}</span>
                  </div>

                  <p className="mt-5 text-3xl font-bold text-slate-900">
                    {card.value.toLocaleString()}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Registered Users */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">
                Registered Users
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                All registered accounts (up to 100).
              </p>

              {/* Search Users */}
              <div className="mt-5">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users by email..."
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-md"
                />
              </div>

              {/* Users Table */}
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-4 py-3 font-semibold">Email</th>

                      <th className="px-4 py-3 font-semibold">
                        Account Created
                      </th>

                      <th className="px-4 py-3 font-semibold">Last Sign In</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-4 py-4 font-medium">
                          <button
                            onClick={() =>
                              router.push(`/admin/users/${user.id}`)
                            }
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {user.email}
                          </button>
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {user.lastSignInAt
                            ? new Date(user.lastSignInAt).toLocaleDateString()
                            : "Never"}
                        </td>
                      </tr>
                    ))}

                    {filteredUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          {search
                            ? "No users found matching your search."
                            : "No registered users found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Showing {filteredUsers.length} of {users.length} users
              </p>
            </div>

            {/* Admin Information */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">
                Admin Information
              </h3>

              <p className="mt-3 text-sm text-slate-600">
                Logged in as: {email}
              </p>

              <p className="mt-2 text-sm text-green-600">
                Administrator access verified.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
