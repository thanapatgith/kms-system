import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { uploadReportImage } from "@/lib/supabaseStorage";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 1. ดึงประวัติการแจ้งเหตุการณ์ / รายงานการตรวจตรา (GET)
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const reports = (await prisma.$queryRaw`
      SELECT * FROM incident_reports 
      WHERE user_id = ${session.userId} 
      ORDER BY created_at DESC
    `.catch(() => [])) as any[];

    const formatted = reports.map((item: any) => {
      const createdAt = item.created_at || item.createdAt;
      return {
        id: item.id,
        createdAt: createdAt,
        date: new Date(createdAt).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "Asia/Bangkok",
        }),
        time: new Date(createdAt).toLocaleTimeString("th-TH", { 
          hour: "2-digit", 
          minute: "2-digit",
          timeZone: "Asia/Bangkok"
        }),
        message: item.message,
        latitude: item.latitude,
        longitude: item.longitude,
        location: item.latitude && item.longitude ? `${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)}` : "-",
        images: item.images || [],
      };
    });

    return NextResponse.json({ ok: true, reports: formatted }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error("Get reports error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน" }, { status: 500 });
  }
}

// 2. สร้างและส่งรายงานเหตุการณ์ใหม่ พร้อมพิกัด, ชื่อหน่วยงาน และอัปโหลดรูปภาพ (POST)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const formData = await req.formData();
    const message = formData.get("message") as string;
    const branchName = formData.get("branch") as string;
    const latitude = formData.get("latitude");
    const longitude = formData.get("longitude");
    const imageFiles = formData.getAll("images") as File[];

    if (!message || message.trim() === "") {
      return NextResponse.json({ ok: false, error: "กรุณากรอกข้อความรายงานเหตุการณ์/การตรวจตรา" }, { status: 400 });
    }

    // ค้นหา siteId จากชื่อหน่วยงาน (branchName)
    let targetSiteId: string | null = null;
    if (branchName && branchName !== "หน่วยงานทั่วไป") {
      const sites = (await prisma.$queryRaw`
        SELECT id FROM sites WHERE site_name = ${branchName} LIMIT 1
      `.catch(() => [])) as any[];
      if (sites.length > 0) {
        targetSiteId = sites[0].id;
      }
    }

    // จัดการอัปโหลดไฟล์รูปภาพขึ้น Supabase Storage
    const imageUrls: string[] = [];
    if (imageFiles && imageFiles.length > 0) {
      for (const file of imageFiles) {
        if (file && typeof file.arrayBuffer === "function") {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          const publicUrl = await uploadReportImage(buffer, file.name || "report.jpg");
          imageUrls.push(publicUrl);
        }
      }
    }

    // บันทึกลงฐานข้อมูลด้วย Raw SQL เพื่อหลีกเลี่ยงปัญหา Field Mismatch (siteId vs site_id)
    await prisma.$queryRaw`
      INSERT INTO incident_reports (id, user_id, site_id, message, latitude, longitude, images, status, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        ${session.userId},
        ${targetSiteId},
        ${message.trim()},
        ${latitude ? Number(latitude) : null},
        ${longitude ? Number(longitude) : null},
        ${imageUrls}::text[],
        'PENDING',
        NOW(),
        NOW()
      )
    `;

    return NextResponse.json({
      ok: true,
      message: "ส่งรายงานการตรวจตราสำเร็จ",
    });
  } catch (error: any) {
    console.error("Post report error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการส่งรายงาน" }, { status: 500 });
  }
}