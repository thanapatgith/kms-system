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
    const period = searchParams.get("period") || "2026-07"; // เช่น "2026-07"

    // แยกปีและเดือนจากค่าที่ส่งมา (เช่น "2026-07" -> year = "2026", month = "07" หรือ "7")
    const [year, monthStr] = period.split("-");
    const monthNum = monthStr ? parseInt(monthStr, 10).toString() : ""; // แปลง "07" เป็น "7" เพื่อรองรับรูปแบบ "1/7/2026"

    // สร้างรูปแบบที่เป็นไปได้ทั้งหมดที่อาจจะถูกเก็บใน DB
    const pattern1 = period;                 // เช่น "2026-07"
    const pattern2 = `${monthNum}/${monthStr}/${year}`; // เช่น "7/07/2026" หรือแบบมีเลข 0
    const pattern3 = `1/${monthNum}/${year}`;  // เช่น "1/7/2026"
    const pattern4 = `${year}/${monthStr}`;    // เช่น "2026/07"

    // ดึงข้อมูลโดยใช้เงื่อนไข .or() ให้ครอบคลุมทุกรูปแบบที่เป็นไปได้
    const { data, error } = await supabaseAdmin
      .from("payrolls")
      .select("*")
      .or(`billing_period.eq.${pattern1},billing_period.eq.${pattern2},billing_period.eq.${pattern3},billing_period.eq.${pattern4}`)
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