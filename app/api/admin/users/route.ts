import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Server configuration error");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const supabase = createSupabaseAdmin();
  const token = authHeader.slice(7);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: "Invalid session" }, { status: 401 }),
    };
  }

  const { data: admin, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError || !admin) {
    return {
      error: NextResponse.json(
        { error: "Admin access denied" },
        { status: 403 },
      ),
    };
  }

  return { supabase, user };
}

// GET: Load registered users
export async function GET(request: Request) {
  try {
    const result = await verifyAdmin(request);

    if ("error" in result) return result.error;

    const { supabase } = result;

    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (error) {
      console.error("Users API error:", error);

      return NextResponse.json(
        { error: "Unable to load users" },
        { status: 500 },
      );
    }

    const users = data.users.map((item) => ({
      id: item.id,
      email: item.email ?? "No email",
      createdAt: item.created_at,
      lastSignInAt: item.last_sign_in_at ?? null,
      bannedUntil: item.banned_until ?? null,

      // Profile photo URL
      avatarUrl: item.user_metadata?.avatar_url ?? null,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin users error:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

// DELETE: Delete a registered user
export async function DELETE(request: Request) {
  try {
    const result = await verifyAdmin(request);

    if ("error" in result) return result.error;

    const { supabase, user } = result;

    const body = await request.json();
    const userId = body.userId;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Valid user ID is required" },
        { status: 400 },
      );
    }

    if (userId === user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own admin account" },
        { status: 400 },
      );
    }

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error("Delete user error:", error);

      return NextResponse.json(
        { error: "Unable to delete user" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user API error:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

// PATCH: Activate or deactivate a user
export async function PATCH(request: Request) {
  try {
    const result = await verifyAdmin(request);

    if ("error" in result) return result.error;

    const { supabase, user } = result;

    const body = await request.json();
    const { userId, action } = body;

    if (
      typeof userId !== "string" ||
      !userId ||
      !["activate", "deactivate"].includes(action)
    ) {
      return NextResponse.json(
        { error: "Valid user ID and action are required" },
        { status: 400 },
      );
    }

    if (userId === user.id) {
      return NextResponse.json(
        { error: "You cannot change your own admin account status" },
        { status: 400 },
      );
    }

    const banDuration = action === "deactivate" ? "876000h" : "none";

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: banDuration,
    });

    if (error) {
      console.error("Update user status error:", error);

      return NextResponse.json(
        { error: "Unable to update user status" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        action === "deactivate"
          ? "User deactivated successfully"
          : "User activated successfully",
    });
  } catch (error) {
    console.error("Update user status API error:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
