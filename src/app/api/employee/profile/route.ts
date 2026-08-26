import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.userId)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ ok: false, error: "ไม่พบข้อมูลผู้ใช้งาน" }, { status: 404 });
    }

    let dailyRate = 520;
    let branchName = user.branch || "หน่วยงานสังกัด KMS";

    // คำนวณวันทำงานจริงตามรอบการจ่ายเงิน (ตัดรอบทุกวันที่ 10)
    // นับตั้งแต่วันที่ 11 ของรอบ จนถึงวันปัจจุบัน (เช่น วันที่ 25)
    const now = new Date();
    const currentDay = now.getDate(); // วันนี้วันที่ 25
    
    // คำนวณจำนวนวันทำงานจริง (วันที่ 11 ถึงวันปัจจุบัน)
    let workedDays = currentDay >= 11 ? (currentDay - 11 + 1) : 15; 

    let grossIncome = 0;
    let netSalary = 0;
    let totalDeductions = 0;

    if (user.employee_code) {
      const { data: payrollData } = await supabase
        .from("payrolls")
        .select("daily_wage, work_days, gross_income, net_salary, total_deductions, site_name")
        .or(`billing_period.eq.2026-08,billing_period.eq.1/8/2026,billing_period.eq.2026-07,billing_period.eq.1/7/2026`)
        .eq("employee_code", user.employee_code.trim())
        .maybeSingle();

      if (payrollData?.daily_wage) {
        dailyRate = Number(payrollData.daily_wage);
      }
      
      // ค่าจ้างสะสม = วันทำงานจริงในรอบปัจจุบัน (15 วัน) × เรตค่าจ้างรายวันจริงของพนักงาน
      grossIncome = dailyRate * workedDays;

      // ดึงยอดรวมหักจาก Database จริงๆ
      totalDeductions = Number(payrollData?.total_deductions) || 0;

      // คำนวณเงินสุทธิ (รายได้สะสม - ยอดรวมหัก)
      netSalary = grossIncome - totalDeductions;

      if (payrollData?.site_name) {
        branchName = payrollData.site_name;
      }
    } else {
      grossIncome = dailyRate * workedDays;
      netSalary = grossIncome - totalDeductions;
    }

    let baseWage8Hrs = dailyRate > 400 ? 400 : Math.round(dailyRate * 0.77);
    let otRate = dailyRate - baseWage8Hrs;

    return NextResponse.json({
      ok: true,
      user: {
        name: user.name || "-",
        employeeCode: user.employee_code || user.employeeCode || "-",
        phone: user.phone || "-",
        idCard: user.id_card_number || user.idCardNumber || "-",
        licenseNo: user.thop7_license_no || user.thop7LicenseNo || "ไม่มีข้อมูล",
        branch: branchName,
        dailyRate: dailyRate,
        baseWage8Hrs: baseWage8Hrs,
        otRate: otRate,
        workedDays: workedDays,
        grossIncome: grossIncome,
        netSalary: netSalary,
        totalDeductions: totalDeductions,
      },
    });
  } catch (error: any) {
    console.error("Get profile error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}