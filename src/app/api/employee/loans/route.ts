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

    // 2. ดึงข้อมูลเงินเดือนจากตาราง payrolls
    const { data: payroll } = await supabase
      .from("payrolls")
      .select("daily_wage, work_days, gross_income, net_salary, total_deductions")
      .eq("employee_code", userProfile?.employee_code?.trim())
      .or(`billing_period.eq.2026-08,billing_period.eq.1/8/2026,billing_period.eq.2026-07,billing_period.eq.1/7/2026`)
      .maybeSingle();

    const dailyWage = payroll?.daily_wage || 520;
    
    const now = new Date();
    const currentDay = now.getDate();
    
    let targetRound = 20;
    let isWindowOpen = false;

    // กำหนดรอบและเช็คช่วงวันเปิดให้ยื่นเรื่อง
    if (currentDay >= 11 && currentDay <= 20) {
      targetRound = 20;
      isWindowOpen = (currentDay >= 11 && currentDay <= 17);
    } else {
      targetRound = 30; // รอบสิ้นเดือน
      isWindowOpen = (currentDay >= 21 && currentDay <= 27);
    }

    // ⭐ แก้ไขตรงนี้: หากเป็นรอบวันที่ 20 ให้คิดจาก 10 วัน, ถ้ารอบสิ้นเดือนให้คิดจาก 20 หรือ work_days เต็ม
    const rawWorkDays = Number(payroll?.work_days) || 30;
    let workedDays = rawWorkDays;
    if (targetRound === 20) {
      workedDays = 10; // รอบวันที่ 20 คิดจากวันทำงาน 10 วัน (ช่วง 11-20)
    } else {
      workedDays = rawWorkDays > 20 ? rawWorkDays : 20; // รอบสิ้นเดือนคิดตามสัดส่วน
    }

    const grossIncome = dailyWage * workedDays;
    const maxCredit = Math.floor(grossIncome * 0.85);

    const netSalary = Number(payroll?.net_salary) || grossIncome;
    const totalDeductions = Number(payroll?.total_deductions) || 0;

    // 3. ดึงประวัติการกู้และคำนวณยอดสะสมจากฟิลด์ amount
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
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

// 4. ฟังก์ชัน POST บันทึกข้อมูลตามโครงสร้างตารางจริง
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