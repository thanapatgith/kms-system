import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// 1. ดึงประวัติการลงเวลาของพนักงาน (GET)
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const attendances = await prisma.attendance.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    const groupedMap = new Map();

    attendances.forEach((item: any) => {
      const dateKey = new Date(item.createdAt).toISOString().split("T")[0];
      
      if (!groupedMap.has(dateKey)) {
        groupedMap.set(dateKey, {
          rawDate: new Date(item.createdAt),
          date: new Date(item.createdAt).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          checkIn: "-",
          checkOut: "-",
          locationIn: "-",
          locationOut: "-",
          status: "ปกติ",
        });
      }

      const record = groupedMap.get(dateKey);
      const timeStr = new Date(item.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
      const latLngStr = `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`;

      if (item.type === "CHECK_IN") {
        record.checkIn = timeStr;
        record.locationIn = latLngStr;
      } else if (item.type === "CHECK_OUT") {
        record.checkOut = timeStr;
        record.locationOut = latLngStr;
      }
    });

    const formattedHistory = Array.from(groupedMap.values());

    return NextResponse.json({ ok: true, attendance: formattedHistory });
  } catch (error: any) {
    console.error("Get attendance error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// 2. บันทึกเช็คอิน / เช็คเอาท์ พร้อมพิกัดและรูปภาพ (POST)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const formData = await req.formData();
    const type = formData.get("type") as string;
    const latitude = formData.get("latitude");
    const longitude = formData.get("longitude");
    const images = formData.getAll("images");

    if (!type || latitude === null || longitude === null) {
      return NextResponse.json({ ok: false, error: "ข้อมูลพิกัดหรือประเภทการลงเวลาไม่ครบถ้วน" }, { status: 400 });
    }

    if (!images || images.length === 0) {
      return NextResponse.json({ ok: false, error: "กรุณาแนบรูปภาพอย่างน้อย 1 รูป" }, { status: 400 });
    }

    if (type === "CHECK_IN") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const existingCheckIn = await prisma.attendance.findFirst({
        where: {
          userId: session.userId,
          type: "CHECK_IN",
          createdAt: {
            gte: todayStart,
          },
        },
      });

      if (existingCheckIn) {
        return NextResponse.json({ ok: false, error: "คุณได้ทำการเช็คอินเข้างานของวันนี้ไปเรียบร้อยแล้ว" }, { status: 400 });
      }
    }

    const newAttendance = await prisma.attendance.create({
      data: {
        userId: session.userId,
        type: type,
        latitude: Number(latitude),
        longitude: Number(longitude),
      },
    });

    return NextResponse.json({ 
      ok: true, 
      message: type === "CHECK_IN" ? "เช็คอินสำเร็จ" : "เช็คเอาท์สำเร็จ",
      data: newAttendance
    });
  } catch (error: any) {
    console.error("Attendance post error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการบันทึกเวลา" }, { status: 500 });
  }
}