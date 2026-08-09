import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 1. ดึงประวัติการแจ้งเหตุการณ์ / รายงานการตรวจตรา (GET)
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
    }));

    return NextResponse.json({ ok: true, reports: formatted });
  } catch (error: any) {
    console.error("Get reports error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน" }, { status: 500 });
  }
}

// 2. สร้างและส่งรายงานเหตุการณ์ใหม่ พร้อมพิกัดและอัปโหลดรูปภาพ (POST)
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
    const imageFiles = formData.getAll("images") as File[];

    if (!message || message.trim() === "") {
      return NextResponse.json({ ok: false, error: "กรุณากรอกข้อความรายงานเหตุการณ์/การตรวจตรา" }, { status: 400 });
    }

    // จัดการอัปโหลดไฟล์รูปภาพเก็บไว้ในโฟลเดอร์ public/uploads/reports
    const imageUrls: string[] = [];
    
    if (imageFiles && imageFiles.length > 0) {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "reports");
      
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (e) {
        // ignore if exists
      }

      for (const file of imageFiles) {
        if (file && typeof file.arrayBuffer === "function") {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const filename = `${session.userId}-${uniqueSuffix}${path.extname(file.name || ".jpg")}`;
          const filepath = path.join(uploadDir, filename);

          await writeFile(filepath, buffer);
          imageUrls.push(`/uploads/reports/${filename}`);
        }
      }
    }

    // บันทึกลงฐานข้อมูล Prisma
    const newReport = await prisma.incidentReport.create({
      data: {
        userId: session.userId,
        message: message.trim(),
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        images: imageUrls,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "ส่งรายงานการตรวจตราสำเร็จ",
      data: newReport,
    });
  } catch (error: any) {
    console.error("Post report error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการส่งรายงาน" }, { status: 500 });
  }
}