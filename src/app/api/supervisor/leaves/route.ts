import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// 1. ดึงรายการใบลาทั้งหมด (GET)
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const leaves = await prisma.leaveRequest.findMany({
      include: {
        user: {
          select: { username: true, role: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = leaves.map((item: any) => {
      // ป้องกันเคสวันที่เป็น string หรือ Date ไม่ตรงกัน
      const start = item.startDate ? new Date(item.startDate) : null;
      const end = item.endDate ? new Date(item.endDate) : null;

      const startDateStr = start && !isNaN(start.getTime()) 
        ? start.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) 
        : item.startDate || "-";

      const endDateStr = end && !isNaN(end.getTime()) 
        ? end.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) 
        : item.endDate || "-";

      return {
        id: item.id,
        employeeName: item.user?.username || "ไม่ระบุชื่อ",
        leaveType: item.leaveType,
        startDate: startDateStr,
        endDate: endDateStr,
        reason: item.reason,
        status: item.status, 
        createdAt: item.createdAt,
      };
    });

    return NextResponse.json({ ok: true, leaves: formatted });
  } catch (error: any) {
    console.error("Get supervisor leaves error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// 2. อัปเดตสถานะอนุมัติ / ไม่อนุมัติใบลา (POST)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const { leaveId, status } = await req.json();

    if (!leaveId || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ ok: false, error: "ข้อมูลสถานะหรือรหัสการลาไม่ถูกต้อง" }, { status: 400 });
    }

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status: status },
    });

    return NextResponse.json({
      ok: true,
      message: status === "APPROVED" ? "อนุมัติคำขอลาเรียบร้อยแล้ว" : "ปฏิเสธคำขอลาเรียบร้อยแล้ว",
      data: updatedLeave,
    });
  } catch (error: any) {
    console.error("Update leave status error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการอัปเดตสถานะ" }, { status: 500 });
  }
}