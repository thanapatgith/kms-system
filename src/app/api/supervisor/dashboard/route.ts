import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const workedDays = 20;
    const dailyWage = 520;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // ดึงข้อมูลเงินกู้จากตาราง loan_requests ของ Supabase เหมือนหน้า loans
    const { data: monthLoans, error: fetchErr } = await supabase
      .from("loan_requests")
      .select("*")
      .eq("user_id", session.userId)
      .gte("created_at", startOfMonth)
      .neq("status", "REJECTED");

    if (fetchErr) {
      console.error("Fetch dashboard loans error:", fetchErr);
    }

    // คำนวณยอดเงินกู้ที่ใช้ไปในเดือนนี้
    const totalBorrowed = (monthLoans || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    
    const maxCredit = Math.floor(dailyWage * workedDays * 0.85); // 10,400 บาทโดยประมาณ
    const remainingCredit = Math.max(0, maxCredit - totalBorrowed);

    return NextResponse.json({
      ok: true,
      totalCredit: maxCredit,
      usedCredit: totalBorrowed,
      remainingCredit: remainingCredit,
      workedDays: workedDays
    });

  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ ok: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด" }, { status: 500 });
  }
}