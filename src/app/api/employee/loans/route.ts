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

    const today = new Date();
    const currentDate = today.getDate(); // วันที่ปัจจุบัน (1-31)
    const dailyWage = 520; // ค่าจ้างพื้นฐานต่อวัน (รวม OT)

    // กำหนดรอบและช่วงเวลายื่นกู้:
    // - รอบวันที่ 20: เปิดยื่นวันที่ 11-17 (สิทธิ์ทำงาน 10 วัน)
    // - รอบวันที่ 30: เปิดยื่นวันที่ 18-27 (สิทธิ์ทำงาน 20 วัน)
    let targetRound: 20 | 30 = 20;
    let workedDays = 10;
    let isWindowOpen = false;

    if (currentDate <= 17) {
      targetRound = 20;
      workedDays = 10;
      isWindowOpen = currentDate >= 11 && currentDate <= 17;
    } else {
      targetRound = 30;
      workedDays = 20;
      isWindowOpen = currentDate >= 18 && currentDate <= 27; // 👈 ปรับเป็น 18 - 27
    }

    // ดึงประวัติการกู้ในเดือนปัจจุบันจากตาราง loan_requests
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const { data: monthLoans, error: fetchErr } = await supabase
      .from("loan_requests")
      .select("*")
      .eq("user_id", session.userId)
      .gte("created_at", startOfMonth)
      .neq("status", "REJECTED");

    if (fetchErr) {
      console.error("Fetch loans error:", fetchErr);
    }

    // ยอดกู้สะสมในเดือนนี้
    const totalBorrowedThisMonth = (monthLoans || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // คำนวณสิทธิ์สูงสุด (85% ของค่าจ้าง)
    const totalEarned = dailyWage * workedDays;
    const maxCredit = Math.floor(totalEarned * 0.85); // รอบ 20 = 4,420 บาท / รอบ 30 = 8,840 บาท
    const remainingCredit = Math.max(0, maxCredit - totalBorrowedThisMonth);

    // ดึงประวัติรายการทั้งหมดของพนักงาน
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

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "ยังไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const { amount, reason } = await request.json();
    const loanAmount = Number(amount);

    if (!loanAmount || loanAmount <= 0) {
      return NextResponse.json({ error: "กรุณาระบุจำนวนเงินให้ถูกต้อง" }, { status: 400 });
    }

    const today = new Date();
    const currentDate = today.getDate();
    const dailyWage = 520;

    let workedDays = 0;
    if (currentDate >= 11 && currentDate <= 17) {
      workedDays = 10;
    } else if (currentDate >= 18 && currentDate <= 27) { // 👈 ปรับเป็น 18 - 27
      workedDays = 20;
    } else {
      return NextResponse.json({ error: "ไม่อยู่ในช่วงเวลาที่เปิดให้ยื่นกู้ (เปิดรอบวันที่ 20 ช่วง 11-17 และ รอบวันที่ 30 ช่วง 18-27)" }, { status: 400 });
    }

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const { data: monthLoans } = await supabase
      .from("loan_requests")
      .select("*")
      .eq("user_id", session.userId)
      .gte("created_at", startOfMonth)
      .neq("status", "REJECTED");

    const totalBorrowedThisMonth = (monthLoans || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const maxCredit = Math.floor(dailyWage * workedDays * 0.85);
    const remainingCredit = Math.max(0, maxCredit - totalBorrowedThisMonth);

    if (loanAmount > remainingCredit) {
      return NextResponse.json({ 
        error: `จำนวนเงินกู้เกินสิทธิ์คงเหลือที่กู้ได้ (กู้ได้สูงสุดอีก ฿${remainingCredit.toLocaleString()} บาท)` 
      }, { status: 400 });
    }

    const newTotalBorrowed = totalBorrowedThisMonth + loanAmount;
    let interestRate = 0;
    if (newTotalBorrowed > 4000) {
      interestRate = 0.05;
    }

    const { data: newLoan, error: insertError } = await supabase
      .from("loan_requests")
      .insert([
        {
          user_id: session.userId,
          amount: loanAmount,
          reason: reason || "เบิกเงินล่วงหน้า",
          status: "PENDING",
          interest_rate: interestRate,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Insert loan error:", insertError);
      return NextResponse.json({ error: "ไม่สามารถยื่นเรื่องกู้ยืมได้" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "ยื่นคำร้องกู้ยืมเงินสำเร็จ",
      loan: newLoan,
      warningInterest: newTotalBorrowed >= 4000
    }, { status: 200 });

  } catch (error: any) {
    console.error("Submit loan error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการประมวลผล" }, { status: 500 });
  }
}