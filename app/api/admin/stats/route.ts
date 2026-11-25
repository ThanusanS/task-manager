import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify user session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Authentication error:", userError);

      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Verify admin role
    const { data: admin, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      console.error("Admin role error:", roleError);

      return NextResponse.json(
        { error: "Unable to verify admin role" },
        { status: 500 },
      );
    }

    if (!admin) {
      return NextResponse.json(
        { error: "Admin access denied" },
        { status: 403 },
      );
    }

    // Fetch all dashboard statistics
    const [usersResult, tasksResult, completedResult, pendingResult] =
      await Promise.all([
        supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1,
        }),

        supabase.from("tasks").select("id", { count: "exact", head: true }),

        supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("completed", true),

        supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("completed", false),
      ]);

    // Detailed debugging
    console.log("Users result:", {
      error: usersResult.error,
      total: usersResult.data?.total,
    });

    console.log("Tasks result:", {
      error: tasksResult.error,
      count: tasksResult.count,
      status: tasksResult.status,
      statusText: tasksResult.statusText,
    });

    console.log("Completed result:", {
      error: completedResult.error,
      count: completedResult.count,
      status: completedResult.status,
      statusText: completedResult.statusText,
    });

    console.log("Pending result:", {
      error: pendingResult.error,
      count: pendingResult.count,
      status: pendingResult.status,
      statusText: pendingResult.statusText,
    });

    if (
      usersResult.error ||
      tasksResult.error ||
      completedResult.error ||
      pendingResult.error
    ) {
      return NextResponse.json(
        { error: "Statistics query failed. Check VS Code terminal." },
        { status: 500 },
      );
    }

    // Return dashboard statistics
    return NextResponse.json({
      totalUsers: usersResult.data.total,
      totalTasks: tasksResult.count ?? 0,
      completedTasks: completedResult.count ?? 0,
      pendingTasks: pendingResult.count ?? 0,
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
