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

    // ดึงข้อมูลจริงจาก Supabase
    const { data, error } = await supabaseAdmin
      .from("payrolls")
      .select("*")
      .eq("billing_period", period)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return NextResponse.json(
      {
        ok: true,
        period,
        count: data?.length || 0,
        data: data || [],
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to fetch payroll" },
      { status: 500 }
    );
  }
}