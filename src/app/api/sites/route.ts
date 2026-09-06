import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // ดึงข้อมูลหน่วยงานจากตาราง site ใน Prisma
    const sites = await (prisma as any).site.findMany({
      orderBy: { id: "asc" },
    });

    const formattedSites = (sites || []).map((s: any) => ({
      id: s.id,
      site_name: s.siteName || s.site_name || "ไม่ระบุชื่อหน่วยงาน",
    }));

    return NextResponse.json({ ok: true, sites: formattedSites });
  } catch (error: any) {
    console.error("Fetch sites error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลหน่วยงาน" }, { status: 500 });
  }
}