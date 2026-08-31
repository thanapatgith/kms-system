import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";
    const selectedSite = searchParams.get("site") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const clients = (await prisma.$queryRaw`
      SELECT id, company_name FROM clients WHERE company_name LIKE '%อมตะ%' OR username LIKE '%amata%' LIMIT 1
    `.catch(() => [])) as any[];

    const clientRecord = clients[0];
    const clientId = clientRecord?.id;

    let clientSites: any[] = [];
    if (clientId) {
      clientSites = (await prisma.$queryRaw`
        SELECT id, site_name FROM sites WHERE client_id = ${clientId}
      `.catch(() => [])) as any[];
    }

    if (clientSites.length === 0) {
      clientSites = (await prisma.$queryRaw`
        SELECT id, site_name FROM sites WHERE site_name LIKE '%อมตะ%'
      `.catch(() => [])) as any[];
    }

    const siteMap = new Map();
    const siteIdsSet = new Set<string>();
    const siteNamesSet = new Set<string>();

    clientSites.forEach((s: any) => {
      const id = s.id;
      const name = s.site_name || s.siteName;
      siteMap.set(id, name);
      if (id) siteIdsSet.add(id);
      if (name) siteNamesSet.add(name);
    });

    const availableSites = Array.from(siteNamesSet);
    const siteIds = Array.from(siteIdsSet);

    // ดึง employee_code และ name จากตาราง users
    const reportsRaw = (await prisma.$queryRaw`
      SELECT r.*, u.name as employee_name, u.employee_code 
      FROM incident_reports r
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `.catch(() => [])) as any[];

    const now = new Date();
    let filteredReports = reportsRaw.filter((r: any) => {
      const createdAt = new Date(r.created_at || r.createdAt);

      let matchTime = true;
      if (filter === "today") {
        matchTime = createdAt.toDateString() === now.toDateString();
      } else if (filter === "7days") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        matchTime = createdAt >= sevenDaysAgo;
      } else if (filter === "custom" && startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchTime = createdAt >= start && createdAt <= end;
      }

      const siteId = r.site_id || r.siteId;
      const matchSite = siteIds.length === 0 || siteIds.includes(siteId) || siteMap.has(siteId);

      return matchTime && matchSite;
    });

    let reports = filteredReports.map((r: any) => {
      const siteId = r.site_id || r.siteId;
      const hour = new Date(r.created_at || r.createdAt).getHours();
      const shift = (hour >= 6 && hour < 18) ? "morning" : "night";

      return {
        id: r.id,
        title: r.message ? (r.message.length > 40 ? r.message.substring(0, 40) + "..." : r.message) : "รายงานการปฏิบัติงาน",
        content: r.message,
        images: r.images || [],
        latitude: r.latitude,
        longitude: r.longitude,
        siteName: siteMap.get(siteId) || "หน่วยงานในความดูแล",
        employeeName: r.employee_name || "เจ้าหน้าที่ รปภ.",
        employeeCode: r.employee_code || "-",
        shift: shift,
        isAcknowledged: r.status === "ACKNOWLEDGED",
        createdAt: r.created_at || r.createdAt,
      };
    });

    if (selectedSite !== "all") {
      reports = reports.filter((r) => r.siteName === selectedSite);
    }

    return NextResponse.json({ 
      success: true, 
      client: { companyName: clientRecord?.company_name || "อมตะ" },
      sites: availableSites,
      reports 
    });
  } catch (error: any) {
    console.error("Fetch client reports error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}