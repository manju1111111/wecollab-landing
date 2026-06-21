import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTasks, updateTask, deleteTask } from "@/lib/supabase/fallback-db";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId") || undefined;

  const supabase = getSupabase();
  const tasks = await getTasks(supabase, employeeId);

  return NextResponse.json({ tasks });
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json();
    // Accept id from query param OR body
    const id = searchParams.get("id") || body.id;
    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    // Extract updates (everything except id)
    const { id: _id, ...updates } = body;

    const supabase = getSupabase();
    const { data, error } = await updateTask(supabase, id, updates);

    if (error) {
      return NextResponse.json({ error: (error as any).message }, { status: 500 });
    }

    return NextResponse.json({ task: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await deleteTask(supabase, id);

    if (error) {
      return NextResponse.json({ error: (error as any).message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
