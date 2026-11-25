import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
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

    // Verify the logged-in user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Verify admin role
    const { data: admin, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !admin) {
      return NextResponse.json(
        { error: "Admin access denied" },
        { status: 403 },
      );
    }

    const { userId } = await params;

    // Get the selected user's tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, completed, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (tasksError) {
      console.error("User tasks error:", tasksError);

      return NextResponse.json(
        { error: "Unable to load user tasks" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      tasks: tasks ?? [],
      totalTasks: tasks?.length ?? 0,
      completedTasks: tasks?.filter((task) => task.completed).length ?? 0,
      pendingTasks: tasks?.filter((task) => !task.completed).length ?? 0,
    });
  } catch (error) {
    console.error("Admin user tasks error:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
