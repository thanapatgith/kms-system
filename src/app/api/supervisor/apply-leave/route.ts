import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// ฟังก์ชันสำหรับดึงข้อมูลประวัติการลา (เฉพาะของ User ที่ล็อกอินอยู่เท่านั้น)
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // กรองเอาเฉพาะข้อมูลของ User คนนี้ ไม่ให้ไปดึงของคนอื่นมาปะปน
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        userId: session.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ ok: true, leaves });
  } catch (error: any) {
    console.error("Get Supervisor Leave Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// ฟังก์ชันสำหรับบันทึกการยื่นใบลาใหม่
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { leaveType, startDate, durationDays, reason } = body;

    if (!startDate || !durationDays || !reason) {
      return NextResponse.json({ ok: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    const newLeave = await prisma.leaveRequest.create({
      data: {
        userId: session.userId,
        leaveType: leaveType || "SICK",
        startDate: new Date(startDate),
        durationDays: Number(durationDays),
        reason: reason,
        status: "PENDING", // รอ HR หรือ ผู้บริหารอนุมัติ
      },
    });

    return NextResponse.json({ ok: true, message: "ยื่นใบลาสำเร็จ", leave: newLeave });
  } catch (error: any) {
    console.error("Create Supervisor Leave Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}