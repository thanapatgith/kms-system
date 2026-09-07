import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { uploadAttendanceImage } from "@/lib/supabaseStorage";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getThaiCurrentDate() {
  const now = new Date();
  const thaiTimeString = now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" });
  return new Date(thaiTimeString);
}

// 1. ดึงประวัติการลงเวลา หรือดึงรายชื่อหน่วยงาน (GET)
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "sites") {
      let targetSiteId: string | null = null;
      
      const thaiNow = getThaiCurrentDate();
      const year = thaiNow.getFullYear();
      const month = String(thaiNow.getMonth() + 1).padStart(2, '0');
      const day = String(thaiNow.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      // ตรวจสอบกะปฏิบัติหน้าที่แทน (รองรับกรณี end_date เป็น NULL)
      try {
        const replacements: any = await prisma.$queryRaw`
          SELECT site_id 
          FROM public.shift_replacements 
          WHERE replacement_employee_id = ${session.userId}
            AND LOWER(status) = 'approved'
            AND start_date::date <= ${todayStr}::date
            AND (end_date IS NULL OR end_date::date >= ${todayStr}::date)
          LIMIT 1
        `;
        if (replacements && replacements.length > 0 && replacements[0].site_id) {
          targetSiteId = replacements[0].site_id;
        }
      } catch (repErr) {
        console.error("Check replacement site error:", repErr);
      }

      if (!targetSiteId) {
        const userList = (await prisma.$queryRaw`
          SELECT site_id FROM users WHERE id = ${session.userId} LIMIT 1
        `.catch(() => [])) as any[];
        targetSiteId = userList[0]?.site_id || null;
      }

      let sitesList: any[] = [];

      if (targetSiteId) {
        const sites = (await prisma.$queryRaw`
          SELECT id, site_name FROM sites WHERE id = ${targetSiteId} LIMIT 1
        `.catch(() => [])) as any[];

        if (sites.length > 0) {
          sitesList = [{ id: sites[0].id, name: sites[0].site_name }];
        }
      }

      if (sitesList.length === 0) {
        const allSites = (await prisma.$queryRaw`
          SELECT id, site_name FROM sites ORDER BY site_name ASC
        `.catch(() => [])) as any[];
        sitesList = allSites.map((s: any) => ({ id: s.id, name: s.site_name }));
      }

      return NextResponse.json({ ok: true, sites: sitesList });
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

    return NextResponse.json({ ok: true, attendance: allFormatted }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error("Get attendance error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// 2. บันทึกเช็คอิน / เช็คเอาท์ พร้อมพิกัดและ siteId (POST)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const formData = await req.formData();
    const type = formData.get("type") as string;
    const branchName = formData.get("branch") as string; // รับค่าชื่อสาขาจากหน้าบ้าน
    const latitude = formData.get("latitude");
    const longitude = formData.get("longitude");
    const imageFiles = formData.getAll("images") as File[];

    if (!type || latitude === null || longitude === null) {
      return NextResponse.json({ ok: false, error: "ข้อมูลพิกัดหรือประเภทการลงเวลาไม่ครบถ้วน" }, { status: 400 });
    }

    if (!imageFiles || imageFiles.length === 0) {
      return NextResponse.json({ ok: false, error: "กรุณาแนบรูปภาพอย่างน้อย 1 รูป" }, { status: 400 });
    }

    // แปลงชื่อสาขา (branch) ให้เป็น site_id (UUID)
    let siteUuid: string | null = null;
    if (branchName) {
      const foundSite: any = await prisma.$queryRaw`
        SELECT id FROM sites WHERE site_name = ${branchName} LIMIT 1
      `.catch(() => []);
      if (foundSite && foundSite.length > 0) {
        siteUuid = foundSite[0].id;
      }
    }

    const thaiNow = getThaiCurrentDate();
    const todayStart = new Date(thaiNow);
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

    const imageUrls: string[] = [];

    for (const file of imageFiles) {
      if (file && typeof file.arrayBuffer === "function") {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const publicUrl = await uploadAttendanceImage(buffer, file.name || "attendance.jpg");
        imageUrls.push(publicUrl);
      }
    }

    // บันทึกลงฐานข้อมูล (ใช้ siteId ตาม schema ที่ประกาศไว้)
    const newAttendance = await prisma.attendance.create({
      data: {
        userId: session.userId,
        siteId: siteUuid, 
        type: type,
        latitude: Number(latitude),
        longitude: Number(longitude),
        images: imageUrls,
        createdAt: thaiNow,
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