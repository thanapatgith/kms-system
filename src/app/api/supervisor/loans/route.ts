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

    // 1. ดึงข้อมูลโปรไฟล์พนักงานเพื่อเอาอัตราค่าจ้างจริง (daily_rate)
    const { data: profile } = await supabase
      .from("profiles") // หรือตารางผู้ใช้งานของคุณ
      .select("*")
      .eq("id", session.userId)
      .single();

    const dailyWage = Number(profile?.daily_rate || profile?.dailyRate) || 520;

    // 2. คำนวณวันทำงานจริงในรอบปัจจุบัน (นับจากวันที่ 11 ของรอบนี้)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    let startDate = new Date(year, month, 11);
    if (now.getDate() < 11) {
      startDate = new Date(year, month - 1, 11);
    }
    startDate.setHours(0, 0, 0, 0);

    // คำนวณวันทำงานจากระยะเวลา หรือดึงจากตาราง attendance ถ้ามี
    const workedDays = Math.max(1, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const targetRound: 20 | 30 = 30;
    const isWindowOpen = true; 

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

    // ดึงโปรไฟล์และคำนวณวันทำงานแบบเดียวกัน
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.userId)
      .single();

    const dailyWage = Number(profile?.daily_rate || profile?.dailyRate) || 520;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    let startDate = new Date(year, month, 11);
    if (now.getDate() < 11) {
      startDate = new Date(year, month - 1, 11);
    }
    startDate.setHours(0, 0, 0, 0);
    const workedDays = Math.max(1, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

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
    // ปรับเกณฑ์ดอกเบี้ย 5% เริ่มตั้งแต่ยอด 3,000 บาทขึ้นไปตามเงื่อนไขระบบ
    if (newTotalBorrowed >= 3000) {
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
      warningInterest: newTotalBorrowed >= 3000
    }, { status: 200 });

  } catch (error: any) {
    console.error("Submit loan error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการประมวลผล" }, { status: 500 });
  }
}