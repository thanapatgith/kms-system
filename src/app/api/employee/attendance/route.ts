import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { uploadAttendanceImage } from "@/lib/supabaseStorage"; // นำเข้าฟังก์ชันที่เราสร้างขึ้น

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 1. ดึงประวัติการลงเวลาของพนักงาน (GET)
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const attendances = await prisma.attendance.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "asc" },
    });

    const groupedMap = new Map();

    attendances.forEach((item: any) => {
      const dateKey = new Date(item.createdAt).toISOString().split("T")[0];
      
      if (!groupedMap.has(dateKey)) {
        groupedMap.set(dateKey, []);
      }

      const dayList = groupedMap.get(dateKey);
      const timeStr = new Date(item.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
      const latLngStr = `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`;

      if (item.type === "CHECK_IN") {
        dayList.push({
          rawDate: new Date(item.createdAt),
          date: new Date(item.createdAt).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          checkIn: timeStr,
          checkOut: "-",
          locationIn: latLngStr,
          locationOut: "-",
          imagesIn: item.images || [], 
          imagesOut: [],              
          status: "ปกติ",
        });
      } else if (item.type === "CHECK_OUT") {
        const activeShift = dayList.find((shift: any) => shift.checkOut === "-");
        if (activeShift) {
          activeShift.checkOut = timeStr;
          activeShift.locationOut = latLngStr;
          activeShift.imagesOut = item.images || []; 
        } else if (dayList.length > 0) {
          dayList[dayList.length - 1].checkOut = timeStr;
          dayList[dayList.length - 1].locationOut = latLngStr;
          dayList[dayList.length - 1].imagesOut = item.images || [];
        }
      }
    });

    let allFormatted: any[] = [];
    groupedMap.forEach((shifts) => {
      allFormatted.push(...shifts);
    });
    allFormatted.reverse();

    return NextResponse.json({ ok: true, attendance: allFormatted });
  } catch (error: any) {
    console.error("Get attendance error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// 2. บันทึกเช็คอิน / เช็คเอาท์ พร้อมพิกัดและอัปโหลดรูปภาพขึ้น Supabase Storage (POST)
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
    const imageFiles = formData.getAll("images") as File[];

    if (!type || latitude === null || longitude === null) {
      return NextResponse.json({ ok: false, error: "ข้อมูลพิกัดหรือประเภทการลงเวลาไม่ครบถ้วน" }, { status: 400 });
    }

    if (!imageFiles || imageFiles.length === 0) {
      return NextResponse.json({ ok: false, error: "กรุณาแนบรูปภาพอย่างน้อย 1 รูป" }, { status: 400 });
    }

    // ตรวจสอบสถานะกะปัจจุบัน
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayRecords = await prisma.attendance.findMany({
      where: {
        userId: session.userId,
        createdAt: { gte: todayStart },
      },
      orderBy: { createdAt: "asc" },
    });

    const checkIns = todayRecords.filter((r: any) => r.type === "CHECK_IN");
    const checkOuts = todayRecords.filter((r: any) => r.type === "CHECK_OUT");
    const isCurrentlyWorking = checkIns.length > checkOuts.length;

    if (type === "CHECK_IN" && isCurrentlyWorking) {
      return NextResponse.json({ ok: false, error: "คุณกำลังอยู่ในกะที่ปฏิบัติงานอยู่ ต้องเช็คเอาท์ก่อนเริ่มกะใหม่" }, { status: 400 });
    } else if (type === "CHECK_OUT" && !isCurrentlyWorking) {
      return NextResponse.json({ ok: false, error: "คุณยังไม่ได้เช็คอินเข้างาน ไม่สามารถเช็คเอาท์ได้" }, { status: 400 });
    }

    // เปลี่ยนมาใช้วิธีอัปโหลดรูปภาพขึ้น Supabase Storage แทนการใช้ fs
    const imageUrls: string[] = [];

    for (const file of imageFiles) {
      if (file && typeof file.arrayBuffer === "function") {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // เรียกใช้ฟังก์ชันอัปโหลดที่เราทำไว้ใน src/lib/supabaseStorage.ts
        const publicUrl = await uploadAttendanceImage(buffer, file.name || "attendance.jpg");
        imageUrls.push(publicUrl);
      }
    }

    // บันทึกลงฐานข้อมูล (เก็บเป็น Public URL)
    const newAttendance = await prisma.attendance.create({
      data: {
        userId: session.userId,
        type: type,
        latitude: Number(latitude),
        longitude: Number(longitude),
        images: imageUrls,
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