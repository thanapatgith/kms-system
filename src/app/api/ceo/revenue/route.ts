import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "2026-07";

    // ดึงข้อมูลรายรับพร้อม join ตาราง sites และ users (ผู้บันทึก)
    const { data, error } = await supabaseAdmin
      .from("client_revenues")
      .select(`
        id,
        billing_period,
        amount,
        payment_status,
        due_date,
        paid_at,
        slip_url,
        tax_doc_url,
        receipt_url,
        updated_by,
        sites (
          id,
          site_code,
          name
        )
      `)
      .eq("billing_period", period)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      period,
      data: data || [],
    });
  } catch (err: any) {
    console.error("Fetch CEO revenue error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}