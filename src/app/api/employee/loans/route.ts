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

    // 1. ดึง employee_code จากตาราง users
    const { data: userProfile } = await supabase
      .from("users")
      .select("employee_code")
      .eq("id", session.userId)
      .single();

    // สร้างค่าปีและเดือนปัจจุบันแบบ Dynamic
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentBillingPeriod = `${currentYear}-${currentMonth}`;

    // 2. ดึงข้อมูลเงินเดือนจากตาราง payrolls ของเดือนปัจจุบัน
    const { data: payroll } = await supabase
      .from("payrolls")
      .select("daily_wage, work_days, gross_income, net_salary, total_deductions")
      .eq("employee_code", userProfile?.employee_code?.trim())
      .or(`billing_period.eq.${currentBillingPeriod},billing_period.eq.2026-10,billing_period.eq.2026-09`)
      .maybeSingle();

    const dailyWage = Number(payroll?.daily_wage) || 540;
    const currentDay = now.getDate();
    
    let targetRound = 20;
    let isWindowOpen = false;

    // กำหนดรอบและเช็คช่วงวันเปิดให้ยื่นเรื่อง
    if (currentDay >= 1 && currentDay <= 20) {
      targetRound = 20;
      isWindowOpen = (currentDay >= 11 && currentDay <= 20);
    } else {
      targetRound = 30; // รอบสิ้นเดือน
      isWindowOpen = (currentDay >= 21 && currentDay <= 30);
    }

    // 3. ดึงประวัติการกู้เฉพาะของเดือนปัจจุบันเพื่อเช็คว่าเคยกู้รอบ 20 หรือยัง
    const startOfMonth = new Date(currentYear, now.getMonth(), 1).toISOString();
    const { data: monthLoans } = await supabase
      .from("loan_requests")
      .select("*")
      .eq("user_id", session.userId)
      .gte("created_at", startOfMonth)
      .neq("status", "REJECTED");

    const borrowedInRound20 = (monthLoans || []).some(item => {
      const d = new Date(item.created_at).getDate();
      return d >= 11 && d <= 20;
    });

    // ⭐ กำหนดวันทำงานตามรอบให้ถูกต้อง:
    // - รอบ 20: คิดจาก 10 วันเสมอ
    // - รอบ 30: ถ้ายื่นกู้รอบ 20 ไปแล้ว จะเหลือ 10 วัน, แต่ถ้ายังไม่เคยยื่นรอบ 20 จะได้ 20 วันเต็ม
    let workedDays = 10;
    if (targetRound === 20) {
      workedDays = 10;
    } else {
      workedDays = borrowedInRound20 ? 10 : 20;
    }

    const grossIncome = dailyWage * workedDays;
    const maxCredit = Math.floor(grossIncome * 0.85);

    const netSalary = Number(payroll?.net_salary) || grossIncome;
    const totalDeductions = Number(payroll?.total_deductions) || 0;

    const totalBorrowedThisMonth = (monthLoans || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    
    // คำนวณวงเงินคงเหลือ
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
    }, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });

  } catch (error: any) {
    console.error("Get loan error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: "ยังไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, reason } = body;

    const requestedAmount = Number(amount);
    if (!requestedAmount || requestedAmount <= 0) {
      return NextResponse.json({ success: false, error: "กรุณาระบุจำนวนเงินให้ถูกต้อง" }, { status: 400 });
    }

    const { error: insertError } = await supabase
      .from("loan_requests")
      .insert([
        {
          user_id: session.userId,
          amount: requestedAmount,
          reason: reason || "ไม่มีเหตุผลระบุ",
          status: "PENDING",
          created_at: new Date().toISOString(),
        }
      ]);

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json({ success: true, message: "ยื่นคำขอสำเร็จ" }, { status: 200 });

  } catch (error: any) {
    console.error("Post loan error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" },
      { status: 500 }
    );
  }
}