import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// 1. ดึงประวัติการลาของพนักงานที่ล็อกอินอยู่ (GET)
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, leaves });
  } catch (error: any) {
    console.error("Get leaves error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// 2. สร้างคำขอลาใหม่ (POST)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const { leaveType, startDate, durationDays, reason } = await req.json();

    if (!leaveType || !startDate || !durationDays || !reason) {
      return NextResponse.json({ ok: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    const newLeave = await prisma.leaveRequest.create({
      data: {
        user: {
          connect: { id: session.userId },
        },
        leaveType,
        startDate: new Date(startDate),
        durationDays: Number(durationDays),
        reason,
        status: "PENDING",
      },
    });

    return NextResponse.json({ ok: true, leave: newLeave });
  } catch (error: any) {
    console.error("Create leave error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการยื่นใบลา" }, { status: 500 });
  }
}