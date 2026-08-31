import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 1. ดึงไซต์งานทั้งหมดในระบบมาทำ Map ชื่อหน่วยงาน
    const clientSites = (await prisma.$queryRaw`
      SELECT id, site_name FROM sites
    `.catch(() => [])) as any[];

    const siteMap = new Map();
    clientSites.forEach((s: any) => {
      siteMap.set(s.id, s.site_name || s.siteName);
    });

    // 2. ดึงรายงานทั้งหมดจาก incident_reports เรียงจากล่าสุด
    const reportsRaw = (await prisma.$queryRaw`
      SELECT * FROM incident_reports 
      ORDER BY created_at DESC
    `.catch(() => [])) as any[];

    // 3. แม็ปข้อมูลให้แสดงชื่อหน่วยงานและรายละเอียดถูกต้อง
    const reports = reportsRaw.map((r: any) => {
      const siteId = r.site_id || r.siteId;
      return {
        id: r.id,
        title: r.message ? (r.message.length > 40 ? r.message.substring(0, 40) + "..." : r.message) : "รายงานการปฏิบัติงาน",
        content: r.message,
        images: r.images || [],
        latitude: r.latitude,
        longitude: r.longitude,
        siteName: siteMap.get(siteId) || "หน่วยงานทั่วไป",
        isAcknowledged: r.status === "ACKNOWLEDGED",
        createdAt: r.created_at || r.createdAt,
      };
    });

    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    console.error("Fetch client reports error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}