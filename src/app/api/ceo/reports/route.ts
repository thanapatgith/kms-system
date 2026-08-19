import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "2026-08";

    // 1. ดึงบันทึกเหตุการณ์จริงจากตาราง incident_reports
    const { data: incidents, error: incError } = await supabaseAdmin
      .from("incident_reports")
      .select("*")
      .order("created_at", { ascending: false });

    // 2. ดึงจำนวนการตรวจตราจริงจากตาราง logbooks
    const { count: patrolCount, error: logError } = await supabaseAdmin
      .from("logbooks")
      .select("*", { count: "exact", head: true });

    if (incError) console.error("Incident fetch error:", incError);
    if (logError) console.error("Logbook count error:", logError);

    return NextResponse.json(
      {
        ok: true,
        period,
        patrolCount: patrolCount || 0,
        incidents: incidents || [],
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to fetch reports" },
      { status: 500 }
    );
  }
}