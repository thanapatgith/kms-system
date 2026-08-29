import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get("user")?.value || cookieStore.get("token")?.value;

    const clientRecord = await (prisma as any).clients?.findFirst().catch(() => null);
    const clientId = clientRecord?.client_id || clientRecord?.id || "fd253584-9eef-47a1-b589-02dfd0ec47e7";

    // ดึงเฉพาะไซต์ที่มี client_id ตรงกับลูกค้ารายนี้ (พร้อมแคสต์ Type เป็น any[])
    const clientSites = (await prisma.$queryRaw`
      SELECT id, site_name FROM sites WHERE client_id = ${clientId}
    `.catch(() => [])) as any[];

    const siteIds = clientSites.map((s: any) => s.id);
    const siteMap = new Map(clientSites.map((s: any) => [s.id, s.site_name]));

    let reportsRaw: any[] = [];
    if (siteIds.length > 0) {
      reportsRaw = await prisma.logbook.findMany({
        where: { siteId: { in: siteIds } },
        orderBy: { createdAt: "desc" },
      }).catch(() => []);
    }

    const reports = reportsRaw.map((r: any) => ({
      ...r,
      siteName: siteMap.get(r.siteId) || "หน่วยงานในความดูแล",
      isAcknowledged: r.status === "ACKNOWLEDGED",
    }));

    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    console.error("Fetch client reports error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}