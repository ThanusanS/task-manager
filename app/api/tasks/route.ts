import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function getUserClient(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return { supabase, user: data.user };
}

export async function GET(request: Request) {
  const auth = await getUserClient(request);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await auth.supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const auth = await getUserClient(request);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json(
      { error: "Task title is required" },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase
    .from("tasks")
    .insert({
      title: body.title.trim(),
      user_id: auth.user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await getUserClient(request);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (typeof body.id !== "number" || typeof body.completed !== "boolean") {
    return NextResponse.json({ error: "Invalid task data" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("tasks")
    .update({ completed: body.completed })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const auth = await getUserClient(request);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (typeof body.id !== "number") {
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("tasks")
    .delete()
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Task deleted successfully",
    task: data,
  });
}
