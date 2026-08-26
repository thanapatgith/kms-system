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

    // 2. ดึงข้อมูลเงินเดือนจากตาราง payrolls
    const { data: payroll } = await supabase
      .from("payrolls")
      .select("daily_wage, work_days, gross_income, net_salary, total_deductions")
      .eq("employee_code", userProfile?.employee_code?.trim())
      .or(`billing_period.eq.2026-08,billing_period.eq.1/8/2026,billing_period.eq.2026-07,billing_period.eq.1/7/2026`)
      .maybeSingle();

    const dailyWage = payroll?.daily_wage || 520;
    
    // ปรับวันทำงานให้สะท้อนตามรอบจริง (ตัดรอบเดือนละประมาณ 20 วันตามรอบการจ่ายวันที่ 10)
    // หากใน payrolls บันทึกมา 31 วัน เราจะปรับสัดส่วนวันทำงานจริงสำหรับคำนวณสิทธิ์กู้ยืมในรอบนี้ให้เป็น 20 วัน
    const rawWorkDays = Number(payroll?.work_days) || 31;
    const workedDays = rawWorkDays > 20 ? 20 : rawWorkDays; 

    // คำนวณรายได้รวมและวงเงินกู้สูงสุด (85% ของค่าจ้างตามวันทำงานจริงในรอบนี้)
    const grossIncome = dailyWage * workedDays;
    const maxCredit = Math.floor(grossIncome * 0.85);

    const netSalary = Number(payroll?.net_salary) || grossIncome;
    const totalDeductions = Number(payroll?.total_deductions) || 0;

    // 3. คำนวณรอบเบิกและช่วงเวลาเปิด-ปิดตามกฎใหม่
    const now = new Date();
    const currentDay = now.getDate(); // วันที่ปัจจุบัน (1-31)
    
    let targetRound = 20;
    let isWindowOpen = false;

    // กฎรอบเบิก:
    // - วันที่ 11 ถึง 17 เปิดรอบวันที่ 20
    // - วันที่ 18 ถึง 27 เปิดรอบวันที่ 30
    // - นอกนั้น ปิดรับยื่นกู้
    if (currentDay >= 11 && currentDay <= 17) {
      targetRound = 20;
      isWindowOpen = true;
    } else if (currentDay >= 18 && currentDay <= 27) {
      targetRound = 30;
      isWindowOpen = true;
    } else {
      targetRound = (currentDay > 27 || currentDay <= 10) ? 20 : 30;
      isWindowOpen = false;
    }

    // 4. ดึงประวัติการกู้และคำนวณยอดสะสม
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: monthLoans } = await supabase
      .from("loan_requests")
      .select("*")
      .eq("user_id", session.userId)
      .gte("created_at", startOfMonth)
      .neq("status", "REJECTED");

    const totalBorrowedThisMonth = (monthLoans || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const remainingCredit = Math.max(0, maxCredit - totalBorrowedThisMonth);

    const { data: allLoans } = await supabase
      .from("loan_requests")
      .select("*")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      success: true,
      targetRound,
      isWindowOpen,
      workedDays,
      dailyWage,
      grossIncome,
      netSalary,
      totalDeductions,
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