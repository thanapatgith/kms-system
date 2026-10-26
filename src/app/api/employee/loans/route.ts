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

    // ดึงวัน เดือน ปี ตามเวลาประเทศไทย (Asia/Bangkok)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(now);
    const yearPart = parts.find(p => p.type === "year")?.value || String(now.getFullYear());
    const monthPart = parts.find(p => p.type === "month")?.value || String(now.getMonth() + 1).padStart(2, "0");
    const dayPart = parts.find(p => p.type === "day")?.value || String(now.getDate());

    const currentYear = Number(yearPart);
    const currentMonth = monthPart;
    const currentDay = Number(dayPart);
    const currentBillingPeriod = `${currentYear}-${currentMonth}`;

    // 2. ดึงข้อมูลเงินเดือนจากตาราง payrolls ของเดือนปัจจุบัน
    const { data: payroll } = await supabase
      .from("payrolls")
      .select("daily_wage, work_days, gross_income, net_salary, total_deductions")
      .eq("employee_code", userProfile?.employee_code?.trim())
      .or(`billing_period.eq.${currentBillingPeriod},billing_period.eq.2026-10,billing_period.eq.2026-09`)
      .maybeSingle();

    const dailyWage = Number(payroll?.daily_wage) || 540;
    
    let targetRound = 20;
    let isWindowOpen = false;

    // กำหนดรอบและเช็คช่วงวันเปิดให้ยื่นเรื่อง (รอบ 20 เปิด 11-17, รอบ 30 เปิด 21-27)
    if (currentDay >= 1 && currentDay <= 20) {
      targetRound = 20;
      isWindowOpen = (currentDay >= 11 && currentDay <= 17);
    } else {
      targetRound = 30; // รอบสิ้นเดือน
      isWindowOpen = (currentDay >= 21 && currentDay <= 27);
    }

    // 3. ดึงประวัติการกู้เฉพาะของเดือนปัจจุบัน
    const startOfMonth = new Date(Date.UTC(currentYear, Number(currentMonth) - 1, 1, 0, 0, 0)).toISOString();
    const { data: monthLoans } = await supabase
      .from("loan_requests")
      .select("*")
      .eq("user_id", session.userId)
      .gte("created_at", startOfMonth)
      .neq("status", "REJECTED");

    // ⭐ คำนวณสิทธิ์รวมทั้งเดือนจากฐาน 20 วัน (รอบละ 10 วัน รวม 2 รอบ) ทบกัน
    const workedDaysTotal = 20; 
    const grossIncomeTotal = dailyWage * workedDaysTotal;
    const maxCreditTotal = Math.floor(grossIncomeTotal * 0.85); // วงเงินรวมสูงสุดต่อเดือน

    const totalBorrowedThisMonth = (monthLoans || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    
    // ⭐ คำนวณวงเงินคงเหลือ = วงเงินรวมทั้งเดือน - ยอดกู้สะสมทั้งเดือน (นำมาทบหักลบกันถูกต้อง)
    const remainingCredit = Math.max(0, maxCreditTotal - totalBorrowedThisMonth);

    const netSalary = Number(payroll?.net_salary) || grossIncomeTotal;
    const totalDeductions = Number(payroll?.total_deductions) || 0;

    const { data: allLoans } = await supabase
      .from("loan_requests")
      .select("*")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      success: true,
      targetRound,
      isWindowOpen,
      workedDays: 10, // แสดงวันทำงานต่อรอบ (10 วัน) บนการ์ด
      dailyWage,
      grossIncome: dailyWage * 10,
      netSalary,
      totalDeductions,
      maxCredit: Math.floor((dailyWage * 10) * 0.85), // แสดงวงเงินเต็มสิทธิ์ต่อรอบปกติ
      totalBorrowedThisMonth,
      remainingCredit, // ยอดคงเหลือที่หักทบยอดรวมทั้งเดือนเรียบร้อยแล้ว
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