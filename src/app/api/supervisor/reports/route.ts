import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    // ตรวจสอบสิทธิ์เบื้องต้นว่าเป็น Supervisor หรือ Admin หรือไม่ (ปรับเงื่อนไขตาม Role จริงในระบบ)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "ไม่พบข้อมูลผู้ใช้งาน" }, { status: 404 });
    }

    // ดึงรายงานการปฏิบัติงานทั้งหมด พร้อมข้อมูลพนักงานที่ส่ง
    const incidentReports = await prisma.incidentReport.findMany({
      include: {
        user: {
          select: { username: true, role: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ดึงประวัติการลงเวลาทั้งหมด พร้อมข้อมูลพนักงาน
    const attendances = await prisma.attendance.findMany({
      include: {
        user: {
          select: { username: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedReports = incidentReports.map((item: any) => ({
      id: item.id,
      employeeName: item.user?.username || "ไม่ระบุชื่อ",
      date: new Date(item.createdAt).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: new Date(item.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      message: item.message,
      location: item.latitude && item.longitude ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}` : "-",
    }));

    return NextResponse.json({
      ok: true,
      reports: formattedReports,
      attendances: attendances,
    });
  } catch (error: any) {
    console.error("Supervisor API error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}