import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 1. ดึงรายงาน (GET) จาก incidentReport
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const reports = await prisma.incidentReport.findMany({
      where: { userId: { not: session.userId } },
      orderBy: { createdAt: "desc" },
    });

    const userIds = Array.from(new Set(reports.map((r: any) => r.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, employeeCode: true, siteId: true },
    });

    const siteIds = Array.from(new Set(users.map((u: any) => u.siteId).filter(Boolean)));
    const sites = await prisma.site ? await prisma.site.findMany({ where: { id: { in: siteIds } } }) : [];
    const siteMap = new Map(sites.map((s: any) => [s.id, s.name]));

    const userMap = new Map(users.map((u: any) => [
      u.id, 
      { 
        name: u.name || u.employeeCode || "เจ้าหน้าที่", 
        siteName: u.siteId ? siteMap.get(u.siteId) || "-" : "-" 
      }
    ]));

    const formatted = reports.map((item: any) => {
      const userInfo: any = userMap.get(item.userId) || { name: "เจ้าหน้าที่ รปภ.", siteName: "-" };
      return {
        id: item.id,
        employeeName: userInfo.name,
        siteName: userInfo.siteName,
        createdAt: item.createdAt,
        date: new Date(item.createdAt).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        time: new Date(item.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        message: item.message,
        latitude: item.latitude,
        longitude: item.longitude,
        location: item.latitude && item.longitude ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}` : "-",
        images: item.images || [],
        status: item.status || "PENDING",
      };
    });

    return NextResponse.json({ ok: true, reports: formatted });
  } catch (error: any) {
    console.error("Get supervisor logbooks error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// 2. อัปเดตสถานะ (PUT) ไปที่ incidentReport ตาม ID ที่ส่งมา
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "ไม่พบรหัสรายงาน" }, { status: 400 });
    }

    const updated = await prisma.incidentReport.update({
      where: { id: String(id) },
      data: { 
        status: status || "ACKNOWLEDGED" 
      },
    });

    return NextResponse.json({ ok: true, message: "บันทึกการรับทราบสำเร็จ", data: updated });
  } catch (error: any) {
    console.error("Update incident report error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการอัปเดต" }, { status: 500 });
  }
}