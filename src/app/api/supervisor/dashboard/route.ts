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

    const { data: userProfile } = await supabase
      .from("users")
      .select("id, name, employee_code, daily_rate, base_wage_8hrs, ot_rate_4hrs")
      .eq("id", session.userId)
      .single();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentPeriod = `${currentYear}-${currentMonth}`;

    // ดึงเรตค่าจ้างจากตาราง payrolls (ถ้ามี) เพื่อเอามาใช้คำนวณเงิน
    let payrollData = null;
    if (userProfile && userProfile.employee_code) {
      const { data: byCode } = await supabase
        .from("payrolls")
        .select("*")
        .eq("billing_period", currentPeriod)
        .eq("employee_code", userProfile.employee_code.trim())
        .maybeSingle();
      payrollData = byCode;
    }

    // กำหนดรอบวันทำงาน 2 รอบ (11-20 และ 21-สิ้นเดือน) ตามเงื่อนไขใหม่
    const currentDate = now.getDate();
    let cycleStart = new Date();
    let cycleEnd = new Date();
    let isWithinAllowedPeriod = false;

    if (currentDate >= 11 && currentDate <= 20) {
      cycleStart = new Date(currentYear, now.getMonth(), 11);
      cycleEnd = new Date(currentYear, now.getMonth(), 20, 23, 59, 59);
      if (currentDate >= 11 && currentDate <= 17) {
        isWithinAllowedPeriod = true;
      }
    } else if (currentDate >= 21 || currentDate <= 10) {
      if (currentDate >= 21) {
        cycleStart = new Date(currentYear, now.getMonth(), 21);
        cycleEnd = new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59);
        if (currentDate >= 21 && currentDate <= 27) {
          isWithinAllowedPeriod = true;
        }
      } else {
        cycleStart = new Date(currentYear, now.getMonth() - 1, 21);
        cycleEnd = new Date(currentYear, now.getMonth(), 0, 23, 59, 59);
        isWithinAllowedPeriod = false;
      }
    }
    
    cycleStart.setHours(0, 0, 0, 0);

    // ⭐ บังคับคำนวณวันทำงานจากปฏิทินจริงในรอบปัจจุบันเสมอ (ไม่ให้ติดล็อก 5 วันเก่า)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limitDate = today < cycleEnd ? today : cycleEnd;
    const diffTime = limitDate.getTime() - cycleStart.getTime();
    const workedDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

    // คำนวณเรตต่อวัน (ดึงจากตาราง payrolls หรือโปรไฟล์ user)
    let dailyRate = 520;
    if (payrollData && payrollData.daily_wage) {
      dailyRate = Number(payrollData.daily_wage);
    } else if (userProfile) {
      const baseWage = Number(userProfile.base_wage_8hrs) || 400;
      const otRate = Number(userProfile.ot_rate_4hrs) || 120;
      dailyRate = Number(userProfile.daily_rate) || (baseWage + otRate);
    }

    const grossEarnings = workedDays * dailyRate;
    const totalDeductions = payrollData ? Number(payrollData.total_deductions) : 0;
    const netSalaryPayable = grossEarnings - totalDeductions;

    // ดึงข้อมูลเงินกู้ในเดือนนี้
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
      employeeName: userProfile?.name,
      isWithinAllowedPeriod: isWithinAllowedPeriod
    });

  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ ok: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด" }, { status: 500 });
  }
}