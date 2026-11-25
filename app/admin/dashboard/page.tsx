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
  bannedUntil: string | null;
  avatarUrl: string | null;
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [currentAdminId, setCurrentAdminId] = useState("");
  const [deletingUserId, setDeletingUserId] = useState("");
  const [message, setMessage] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  async function loadDashboard() {
    try {
      setError("");

      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !data.session) {
        router.replace("/admin/login");
        return;
      }

      setEmail(data.session.user.email || "");
      setCurrentAdminId(data.session.user.id);

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

      setStats(statsResult);
      setUsers(usersResult.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/admin/login");
    router.refresh();
  }

  // Generate professional PDF report
  async function handleDownloadPDF() {
    if (!stats) {
      setError("Dashboard statistics are not available.");
      return;
    }

    setDownloadingPdf(true);
    setError("");

    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF("p", "mm", "a4");

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const navy = [15, 35, 75] as [number, number, number];
      const blue = [37, 99, 235] as [number, number, number];
      const lightBlue = [239, 246, 255] as [number, number, number];
      const grey = [100, 116, 139] as [number, number, number];
      const green = [22, 163, 74] as [number, number, number];
      const red = [220, 38, 38] as [number, number, number];

      const generatedAt = new Date();

      const formatDate = (date: string | null) => {
        if (!date) return "Never";

        return new Date(date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      };

      // Header background
      doc.setFillColor(...navy);
      doc.rect(0, 0, pageWidth, 48, "F");

      // Brand
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(25);
      doc.text("TaskFlow", 15, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("ADMINISTRATION REPORT", 15, 29);

      doc.setFontSize(9);
      doc.setTextColor(210, 225, 255);
      doc.text(`Generated: ${generatedAt.toLocaleString("en-GB")}`, 15, 38);

      // Report label
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("CONFIDENTIAL", pageWidth - 15, 20, {
        align: "right",
      });

      // Overview heading
      doc.setTextColor(...navy);
      doc.setFontSize(17);
      doc.text("Dashboard Overview", 15, 62);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...grey);
      doc.text(`Administrator: ${email || "Admin"}`, 15, 69);

      // Statistics cards
      const cardY = 78;
      const cardWidth = 42;
      const cardHeight = 28;
      const cardGap = 4;
      const startX = 15;

      const reportCards = [
        {
          title: "TOTAL USERS",
          value: stats.totalUsers,
          color: blue,
        },
        {
          title: "TOTAL TASKS",
          value: stats.totalTasks,
          color: navy,
        },
        {
          title: "COMPLETED",
          value: stats.completedTasks,
          color: green,
        },
        {
          title: "PENDING",
          value: stats.pendingTasks,
          color: red,
        },
      ];

      reportCards.forEach((card, index) => {
        const x = startX + index * (cardWidth + cardGap);

        doc.setFillColor(...lightBlue);
        doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...grey);
        doc.text(card.title, x + 4, cardY + 8);

        doc.setFontSize(19);
        doc.setTextColor(...card.color);
        doc.text(card.value.toLocaleString(), x + 4, cardY + 21);
      });

      // User table heading
      doc.setTextColor(...navy);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("Registered Users", 15, 120);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...grey);
      doc.text(`Total records included: ${users.length}`, 15, 127);

      const tableRows = users.map((user) => {
        const inactive =
          !!user.bannedUntil &&
          new Date(user.bannedUntil).getTime() > Date.now();

        return [
          user.email,
          formatDate(user.createdAt),
          formatDate(user.lastSignInAt),
          inactive ? "Inactive" : "Active",
        ];
      });

      autoTable(doc, {
        startY: 133,
        head: [["Email Address", "Registered", "Last Sign In", "Status"]],
        body: tableRows,
        theme: "grid",
        margin: {
          left: 15,
          right: 15,
          bottom: 20,
        },
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 3,
          textColor: [51, 65, 85],
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: blue,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 75 },
          1: { cellWidth: 35 },
          2: { cellWidth: 35 },
          3: { cellWidth: 30 },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 3) {
            const status = String(data.cell.raw);

            if (status === "Active") {
              data.cell.styles.textColor = green;
              data.cell.styles.fontStyle = "bold";
            } else {
              data.cell.styles.textColor = red;
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
      });

      // Summary section after table
      const finalY =
        (
          doc as typeof doc & {
            lastAutoTable?: { finalY: number };
          }
        ).lastAutoTable?.finalY ?? 140;

      let summaryY = finalY + 15;

      if (summaryY > pageHeight - 45) {
        doc.addPage();
        summaryY = 25;
      }

      doc.setTextColor(...navy);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Report Summary", 15, summaryY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...grey);

      const summaryText = [
        `Total registered users: ${stats.totalUsers}`,
        `Total tasks created: ${stats.totalTasks}`,
        `Completed tasks: ${stats.completedTasks}`,
        `Pending tasks: ${stats.pendingTasks}`,
      ];

      summaryText.forEach((line, index) => {
        doc.text(`• ${line}`, 17, summaryY + 8 + index * 6);
      });

      // Footer and page numbers
      const pageCount = doc.internal.pages.length - 1;

      for (let page = 1; page <= pageCount; page++) {
        doc.setPage(page);

        doc.setDrawColor(226, 232, 240);
        doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...grey);

        doc.text("TaskFlow | Administration Report", 15, pageHeight - 9);

        doc.text(
          `Page ${page} of ${pageCount}`,
          pageWidth - 15,
          pageHeight - 9,
          { align: "right" },
        );
      }

      const filename = `TaskFlow_Admin_Report_${generatedAt
        .toISOString()
        .slice(0, 10)}.pdf`;

      doc.save(filename);

      setMessage("Your PDF report has been downloaded successfully!");
    } catch (err) {
      console.error("PDF generation error:", err);

      setError(
        err instanceof Error
          ? `PDF download failed: ${err.message}`
          : "Could not generate PDF report.",
      );
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleDeleteUser(user: AdminUser) {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${user.email}?\n\nTheir account and tasks will be deleted. This cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeletingUserId(user.id);
      setMessage("");
      setError("");

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to delete user.");
      }

      setMessage(`${user.email} was deleted successfully.`);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete user.");
    } finally {
      setDeletingUserId("");
    }
  }

  async function handleStatusChange(
    user: AdminUser,
    action: "activate" | "deactivate",
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.email}?`,
    );

    if (!confirmed) return;

    try {
      setDeletingUserId(user.id);
      setMessage("");
      setError("");

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          action,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update user status.");
      }

      setMessage(result.message);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDeletingUserId("");
    }
  }

  function isUserInactive(user: AdminUser) {
    return (
      !!user.bannedUntil && new Date(user.bannedUntil).getTime() > Date.now()
    );
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
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Dashboard Overview
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Welcome, {email || "Admin"}
            </p>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={loading || !stats || downloadingPdf}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloadingPdf ? (
              <>
                <span className="animate-spin">⏳</span>
                Generating PDF...
              </>
            ) : (
              <>
                <span>📄</span>
                Download PDF Report
              </>
            )}
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
            Loading dashboard...
          </div>
        ) : error && !stats ? (
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

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">
                Registered Users
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                All registered accounts (up to 100).
              </p>

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

              <div className="mt-5">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users by email..."
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-md"
                />
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-4 py-3 font-semibold">User</th>
                      <th className="px-4 py-3 font-semibold">
                        Account Created
                      </th>
                      <th className="px-4 py-3 font-semibold">Last Sign In</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((user) => {
                      const inactive = isUserInactive(user);
                      const isAdmin = user.id === currentAdminId;

                      return (
                        <tr
                          key={user.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-blue-100 text-sm font-bold uppercase text-blue-600">
                                {user.avatarUrl ? (
                                  <img
                                    src={user.avatarUrl}
                                    alt={`${user.email} profile`}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";

                                      const fallback = e.currentTarget
                                        .nextElementSibling as HTMLElement;

                                      if (fallback) {
                                        fallback.style.display = "flex";
                                      }
                                    }}
                                  />
                                ) : null}

                                <span
                                  className="h-full w-full items-center justify-center"
                                  style={{
                                    display: user.avatarUrl ? "none" : "flex",
                                  }}
                                >
                                  {user.email.charAt(0).toUpperCase()}
                                </span>
                              </div>

                              <div>
                                <button
                                  onClick={() =>
                                    router.push(`/admin/users/${user.id}`)
                                  }
                                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {user.email}
                                </button>

                                {isAdmin && (
                                  <span className="ml-2 text-xs text-slate-400">
                                    (You)
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {user.lastSignInAt
                              ? new Date(user.lastSignInAt).toLocaleDateString()
                              : "Never"}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                inactive
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {inactive ? "Inactive" : "Active"}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleStatusChange(
                                    user,
                                    inactive ? "activate" : "deactivate",
                                  )
                                }
                                disabled={deletingUserId === user.id || isAdmin}
                                className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingUserId === user.id
                                  ? "Please wait..."
                                  : inactive
                                    ? "Activate"
                                    : "Deactivate"}
                              </button>

                              <button
                                onClick={() => handleDeleteUser(user)}
                                disabled={deletingUserId === user.id || isAdmin}
                                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
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
