import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let globalLoanStore: any[] = [
  {
    id: "LOAN-20260810-001",
    userId: "user-001",
    type: "ADVANCE",
    amount: 3000,
    installments: 1,
    interestRate: 0,
    fee: 20,
    reason: "เป็นหนี้และหิวข้าว",
    acceptedTerms: true,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  },
];

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const userId = session?.userId || "user-001";

    let dbLoans: any[] = [];
    try {
      if ((prisma as any).loanRequest) {
        dbLoans = await (prisma as any).loanRequest.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });
      }
    } catch (e) {
      console.warn("LoanRequest model not found in DB");
    }

    const rawList = dbLoans.length > 0 ? dbLoans : globalLoanStore.filter(i => i.userId === userId || true);

    const formatted = rawList.map((item: any) => ({
      id: item.id,
      type: item.type || "ADVANCE",
      amount: item.amount,
      installments: item.installments || 1,
      interestRate: item.interestRate || 0,
      fee: item.fee || 0,
      reason: item.reason || "",
      status: item.status || "PENDING",
      createdAt: item.createdAt,
      date: new Date(item.createdAt).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: new Date(item.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    }));

    // เช็คว่ามีคำร้องค้างอยู่หรือไม่ (PENDING หรือ APPROVED)
    const activeLoan = formatted.find(item => item.status === "PENDING" || item.status === "APPROVED");

    return NextResponse.json({ 
      ok: true, 
      loans: formatted,
      hasActiveLoan: !!activeLoan,
      activeLoanMessage: activeLoan 
        ? `คุณมีคำร้อง (${activeLoan.type === "ADVANCE" ? "เบิกค่าจ้างล่วงหน้า" : "เงินกู้สวัสดิการ"}) สถานะ "${activeLoan.status === "PENDING" ? "รออนุมัติ" : "อนุมัติแล้ว"}" อยู่ในระบบ ไม่สามารถยื่นเรื่องใหม่ได้จนกว่าคำร้องจะถูกปฏิเสธหรือชำระคืนครบถ้วน`
        : null
    });
  } catch (error: any) {
    console.error("Get loans error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const userId = session?.userId || "user-001";

    const body = await req.json();
    const { type, amount, installments, reason, acceptedTerms } = body;

    // 1. ตรวจสอบว่ามีคำร้องที่ค้างอยู่ (PENDING / APPROVED) หรือไม่
    let existingActiveLoan = null;
    try {
      if ((prisma as any).loanRequest) {
        existingActiveLoan = await (prisma as any).loanRequest.findFirst({
          where: {
            userId,
            status: { in: ["PENDING", "APPROVED"] },
          },
        });
      } else {
        existingActiveLoan = globalLoanStore.find(
          item => item.userId === userId && (item.status === "PENDING" || item.status === "APPROVED")
        );
      }
    } catch (e) {
      console.warn("Check active loan warning:", e);
    }

    if (existingActiveLoan) {
      return NextResponse.json({
        ok: false,
        error: "คุณมีคำร้องยื่นขอการเงินที่อยู่ระหว่างรออนุมัติหรือยังชำระไม่หมด ไม่สามารถยื่นเรื่องเพิ่มได้จนกว่าคำร้องจะถูกปฏิเสธ (REJECTED)",
      }, { status: 400 });
    }

    if (!acceptedTerms) {
      return NextResponse.json({
        ok: false,
        error: "กรุณาอ่านและยอมรับเงื่อนไขสัญญาก่อนยื่นเรื่อง",
      }, { status: 400 });
    }

    const reqAmount = Number(amount);
    if (!reqAmount || reqAmount <= 0) {
      return NextResponse.json({ ok: false, error: "กรุณาระบุจำนวนเงินให้ถูกต้อง" }, { status: 400 });
    }

    const isAdvance = type === "ADVANCE";
    const newRecord = {
      id: `LOAN-${Date.now()}`,
      userId,
      type: type || "ADVANCE",
      amount: reqAmount,
      installments: isAdvance ? 1 : Number(installments) || 1,
      interestRate: isAdvance ? 0 : 1.25,
      fee: isAdvance ? 20 : 0,
      reason: reason ? reason.trim() : "",
      acceptedTerms: true,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    try {
      if ((prisma as any).loanRequest) {
        await (prisma as any).loanRequest.create({
          data: newRecord,
        });
      } else {
        globalLoanStore.unshift(newRecord);
      }
    } catch (e) {
      globalLoanStore.unshift(newRecord);
    }

    return NextResponse.json({
      ok: true,
      message: "ยื่นคำขอสำเร็จเรียบร้อยแล้ว",
      data: newRecord,
    });
  } catch (error: any) {
    console.error("Post loan error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการบันทึก" }, { status: 500 });
  }
}