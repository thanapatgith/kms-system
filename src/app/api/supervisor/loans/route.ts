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

    // 🔓 บังคับเปิดรอบยื่นกู้เพื่อให้ทดสอบได้ทันที
    const targetRound: 20 | 30 = 30;
    const workedDays = 20;
    const isWindowOpen = true; 
    const dailyWage = 520;

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: monthLoans, error: fetchErr } = await supabase
      .from("loan_requests")
      .select("*")
      .eq("user_id", session.userId)
      .gte("created_at", startOfMonth)
      .neq("status", "REJECTED");

    if (fetchErr) {
      console.error("Fetch loans error:", fetchErr);
    }

    const totalBorrowedThisMonth = (monthLoans || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalEarned = dailyWage * workedDays;
    const maxCredit = Math.floor(totalEarned * 0.85);
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

    const dailyWage = 520;
    const workedDays = 20; // 🔓 บังคับวันทำงานจำลองเพื่อทดสอบ

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
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