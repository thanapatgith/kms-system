import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    // 1. ดึง employee_code จากตาราง users
    const { data: userProfile } = await supabase
      .from("users")
      .select("employee_code")
      .eq("id", session.userId)
      .single();

    if (!userProfile?.employee_code) {
      return NextResponse.json({ success: true, payrolls: [] });
    }

    // 2. ดึงประวัติเงินเดือนทั้งหมดจากตาราง payrolls เรียงตามงวดล่าสุด
    const { data: payrolls, error } = await supabase
      .from("payrolls")
      .select("*")
      .eq("employee_code", userProfile.employee_code.trim())
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      payrolls: payrolls || [],
    });
  } catch (err: any) {
    console.error("Fetch employee payrolls error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}