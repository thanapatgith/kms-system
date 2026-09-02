import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST: ส่งคำขอลาใหม่
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const body = await req.json();
    const { leaveType, startDate, durationDays, reason } = body;

    if (!leaveType || !startDate || !durationDays || !reason) {
      return NextResponse.json({ ok: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    // 1. สร้างคำขอลาใหม่
    const newLeave = await prisma.leaveRequest.create({
      data: {
        userId: session.userId,
        leaveType,
        startDate: new Date(startDate),
        durationDays: Number(durationDays),
        reason,
        status: "PENDING",
      },
    });

    // 2. เพิ่มการสร้างแจ้งเตือน (Notification) ลงตาราง notifications
    try {
      await prisma.notifications.create({
        data: {
          userId: session.userId,
          title: "ยื่นใบลาสำเร็จ",
          message: `คุณได้ยื่นใบลาประเภท "${leaveType}" จำนวน ${durationDays} วัน (รออนุมัติ)`,
          type: "success",
          isRead: false,
        },
      });
    } catch (notiErr) {
      console.error("Failed to create notification:", notiErr);
    }

    return NextResponse.json({ ok: true, data: newLeave });
  } catch (error: any) {
    console.error("Create leave error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการยื่นใบลา" }, { status: 500 });
  }
}

// GET: ดึงรายการใบลาของพนักงาน
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
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 });
  }
}