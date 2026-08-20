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

    // 1. ดึงข้อมูลโปรไฟล์ผู้ใช้
    const { data: userProfile } = await supabase
      .from("users")
      .select("id, name, employee_code")
      .eq("id", session.userId)
      .single();

    const currentPeriod = "2026-07"; // งวดเดือนปัจจุบัน
    let payrollData = null;

    // 2. ค้นหาในตาราง payrolls (ลองหาตาม user_id -> employee_code -> ชื่อ)
    if (userProfile) {
      // 2.1 ลองหาตาม user_id
      const { data: byUserId } = await supabase
        .from("payrolls")
        .select("*")
        .eq("billing_period", currentPeriod)
        .eq("user_id", userProfile.id)
        .maybeSingle();
      
      payrollData = byUserId;

      // 2.2 ถ้าไม่เจอ ลองหาตาม employee_code
      if (!payrollData && userProfile.employee_code) {
        const { data: byCode } = await supabase
          .from("payrolls")
          .select("*")
          .eq("billing_period", currentPeriod)
          .eq("employee_code", userProfile.employee_code.trim())
          .maybeSingle();
        payrollData = byCode;
      }

      // 2.3 ถ้ายังไม่เจอ ลองหาตาม ชื่อ
      if (!payrollData && userProfile.name) {
        const { data: byName } = await supabase
          .from("payrolls")
          .select("*")
          .eq("billing_period", currentPeriod)
          .ilike("employee_name", `%${userProfile.name.trim()}%`)
          .maybeSingle();
        payrollData = byName;
      }
    }

    // 3. ดึงข้อมูลเงินกู้
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: monthLoans } = await supabase
      .from("loan_requests")
      .select("*")
      .eq("user_id", session.userId)
      .gte("created_at", startOfMonth)
      .neq("status", "REJECTED");

    const totalBorrowed = (monthLoans || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    
    // 4. สรุปยอดเงินจากตาราง payrolls
    const workedDays = payrollData ? Number(payrollData.work_days) : 31;
    const grossEarnings = payrollData ? Number(payrollData.gross_income) : 49999.90;
    const totalDeductions = payrollData ? Number(payrollData.total_deductions) : 1599.997;
    const netSalaryPayable = payrollData ? Number(payrollData.net_salary) : 48399.90;
    
    const maxCredit = Math.floor(grossEarnings * 0.85);
    const remainingCredit = Math.max(0, maxCredit - totalBorrowed);

    return NextResponse.json({
      ok: true,
      totalCredit: maxCredit,
      usedCredit: totalBorrowed,
      remainingCredit: remainingCredit,
      workedDays: workedDays,
      grossEarnings: grossEarnings,
      totalDeductions: totalDeductions,
      netSalary: netSalaryPayable,
      employeeName: payrollData?.employee_name || userProfile?.name
    });

  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ ok: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด" }, { status: 500 });
  }
}