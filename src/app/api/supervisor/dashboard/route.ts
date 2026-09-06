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

    // 1. ดึงข้อมูลโปรไฟล์ผู้ใช้ (รวมอัตราค่าจ้างรายวัน daily_rate ด้วยถ้ามี หรือกำหนดค่ามาตรฐาน)
    const { data: userProfile } = await supabase
      .from("users")
      .select("id, name, employee_code, daily_rate")
      .eq("id", session.userId)
      .single();

    // คำนวณงวดเดือนปัจจุบัน (รูปแบบ YYYY-MM เช่น 2026-09)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentPeriod = `${currentYear}-${currentMonth}`;

    let payrollData = null;

    // 2. ค้นหาในตาราง payrolls (ลองหาตาม user_id -> employee_code -> ชื่อ)
    if (userProfile) {
      const { data: byUserId } = await supabase
        .from("payrolls")
        .select("*")
        .eq("billing_period", currentPeriod)
        .eq("user_id", userProfile.id)
        .maybeSingle();
      
      payrollData = byUserId;

      if (!payrollData && userProfile.employee_code) {
        const { data: byCode } = await supabase
          .from("payrolls")
          .select("*")
          .eq("billing_period", currentPeriod)
          .eq("employee_code", userProfile.employee_code.trim())
          .maybeSingle();
        payrollData = byCode;
      }

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

    // 3. ถ้าไม่มีข้อมูลใน payrolls ให้คำนวณวันทำงานจริงจากตาราง attendance
    // รอบการนับ: ตั้งแต่วันที่ 11 ของรอบเดือนนี้ (ถ้ายังไม่ถึงวันที่ 11 ให้ดึงจากวันที่ 11 เดือนที่แล้ว)
    let workedDays = 0;
    let dailyRate = userProfile?.daily_rate || 520; // ค่าจ้างรายวันเริ่มต้น

    let cycleStart = new Date(currentYear, now.getMonth(), 11);
    if (now.getDate() < 11) {
      cycleStart = new Date(currentYear, now.getMonth() - 1, 11);
    }
    cycleStart.setHours(0, 0, 0, 0);

    if (payrollData) {
      workedDays = Number(payrollData.work_days) || 0;
    } else {
      // ดึงประวัติการลงเวลาจากตาราง attendance ตั้งแต่วันที่ 11
      const { data: attendanceRecords } = await supabase
        .from("attendance")
        .select("created_at, type")
        .eq("user_id", session.userId)
        .gte("created_at", cycleStart.toISOString());

      if (attendanceRecords && attendanceRecords.length > 0) {
        // นับจำนวนวันที่เช็คอิน (CHECK_IN) ที่ไม่ซ้ำกันในช่วงวันที่กำหนด
        const uniqueDays = new Set(
          attendanceRecords
            .filter((r: any) => r.type === "CHECK_IN")
            .map((r: any) => new Date(r.created_at).toDateString())
        );
        workedDays = uniqueDays.size;
      }
    }

    // 4. คำนวณรายได้และยอดหักจริง
    const grossEarnings = payrollData ? Number(payrollData.gross_income) : (workedDays * dailyRate);
    const totalDeductions = payrollData ? Number(payrollData.total_deductions) : 0;
    const netSalaryPayable = grossEarnings - totalDeductions;

    // 5. ดึงข้อมูลเงินกู้ในเดือนนี้
    const startOfMonth = new Date(currentYear, now.getMonth(), 1).toISOString();
    const { data: monthLoans } = await supabase
      .from("loan_requests")
      .select("*")
      .eq("user_id", session.userId)
      .gte("created_at", startOfMonth)
      .neq("status", "REJECTED");

    const totalBorrowed = (monthLoans || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    
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