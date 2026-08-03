import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// 1. ดึงประวัติรายงาน (GET)
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const reports = await prisma.incidentReport.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    const formatted = reports.map((item: any) => ({
      id: item.id,
      date: new Date(item.createdAt).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: new Date(item.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      message: item.message,
      location: item.latitude && item.longitude ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}` : "-",
    }));

    return NextResponse.json({ ok: true, reports: formatted });
  } catch (error: any) {
    console.error("Get reports error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// 2. ส่งรายงานใหม่ (POST)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const formData = await req.formData();
    const message = formData.get("message") as string;
    const latitude = formData.get("latitude");
    const longitude = formData.get("longitude");
    const images = formData.getAll("images");

    if (!message || message.trim() === "") {
      return NextResponse.json({ ok: false, error: "กรุณากรอกข้อความรายงานสถานการณ์" }, { status: 400 });
    }

    if (!images || images.length === 0) {
      return NextResponse.json({ ok: false, error: "กรุณาแนบรูปภาพถ่ายยืนยันการตรวจรอบพื้นที่" }, { status: 400 });
    }

    const newReport = await prisma.incidentReport.create({
      data: {
        userId: session.userId,
        message: message,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "ส่งรายงานการทำงานสำเร็จ",
      data: newReport,
    });
  } catch (error: any) {
    console.error("Post report error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการส่งรายงาน" }, { status: 500 });
  }
}