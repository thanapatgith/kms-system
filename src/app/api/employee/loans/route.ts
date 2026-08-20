import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "ยังไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    // 1. ดึง employee_code จากตาราง users ก่อน
    const { data: userProfile } = await supabase
      .from("users")
      .select("employee_code")
      .eq("id", session.userId)
      .single();

    // 2. ดึงข้อมูลเงินเดือนจากตาราง payrolls ของพนักงานคนนั้นในเดือน ก.ค. 69 (รวม gross_income และ net_salary)
    const { data: payroll } = await supabase
      .from("payrolls")
      .select("daily_wage, work_days, gross_income, net_salary, total_deductions")
      .eq("employee_code", userProfile?.employee_code?.trim())
      .eq("billing_period", "2026-07")
      .maybeSingle();

    const dailyWage = payroll?.daily_wage || 520;
    const workedDays = payroll?.work_days || 0;
    
    // ดึงค่าจริงจากตาราง payrolls (ช่อง รวมเงินที่ได้รับ และ เงินเดือนคงเหลือ)
    const grossIncome = Number(payroll?.gross_income) || (dailyWage * workedDays);
    const netSalary = Number(payroll?.net_salary) || grossIncome;
    const totalDeductions = Number(payroll?.total_deductions) || 0;

    // 3. ดึงประวัติการกู้และคำนวณยอดสะสม
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: monthLoans } = await supabase
      .from("loan_requests")
      .select("*")
      .eq("user_id", session.userId)
      .gte("created_at", startOfMonth)
      .neq("status", "REJECTED");

    const totalBorrowedThisMonth = (monthLoans || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // 4. คำนวณสิทธิ์ (ใช้ 85% ของรายได้รวมจริง)
    const maxCredit = Math.floor(grossIncome * 0.85);
    const remainingCredit = Math.max(0, maxCredit - totalBorrowedThisMonth);

    const { data: allLoans } = await supabase
      .from("loan_requests")
      .select("*")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      success: true,
      workedDays,
      dailyWage,
      grossIncome,        // รายได้รวมจริง (เช่น 17,566)
      netSalary,          // เงินเดือนคงเหลือสุทธิจริง (เช่น 11,976.72)
      totalDeductions,    // ยอดรวมหักจริง
      maxCredit,
      totalBorrowedThisMonth,
      remainingCredit,
      loans: allLoans || [],
    }, { status: 200 });

  } catch (error: any) {
    console.error("Get loan error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 });
  }
}