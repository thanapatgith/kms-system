import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const selectedSite = searchParams.get("site") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const cookieStore = cookies();
    let currentUsername = "";
    
    const tokenCookie = cookieStore.get("token")?.value || cookieStore.get("workingsession")?.value || cookieStore.get("username")?.value;
    
    if (tokenCookie) {
      try {
        const parsed = JSON.parse(tokenCookie);
        if (parsed.username) currentUsername = parsed.username;
      } catch {
        currentUsername = tokenCookie;
      }
    }

    if (!currentUsername) {
      const fallbackClient = (await prisma.$queryRaw`
        SELECT username FROM users WHERE role = 'CLIENT' LIMIT 1
      `.catch(() => [])) as any[];
      currentUsername = fallbackClient[0]?.username || "";
    }

    // 1. ดึงข้อมูล user ปัจจุบันเพื่อเอา site_id ของลูกค้าคนนี้
    const currentUserList = (await prisma.$queryRaw`
      SELECT id, username, name, role, site_id 
      FROM users 
      WHERE username = ${currentUsername} 
      LIMIT 1
    `.catch(() => [])) as any[];

    const currentUser = currentUserList[0];
    const clientSiteId = currentUser?.site_id;

    if (!clientSiteId) {
      return NextResponse.json({ success: true, client: { companyName: "Client Portal" }, reports: [], sites: [] });
    }

    // 2. ดึงข้อมูลชื่อไซต์งานตาม site_id ของลูกค้า
    const siteList = (await prisma.$queryRaw`
      SELECT id, site_name FROM sites WHERE id = ${clientSiteId}
    `.catch(() => [])) as any[];

    const siteMap = new Map(siteList.map((s: any) => [s.id, s.site_name]));
    const availableSites = siteList.map((s: any) => s.site_name);
    const companyName = availableSites[0] || "อมตะ";

    // 3. กำหนดเงื่อนไขกรองรายงาน (บังคับให้ดึงเฉพาะ siteId ของลูกค้าคนนี้เท่านั้น)
    let whereClause: any = {
      siteId: clientSiteId
    };

    // ถ้าระบุตัวกรองหน่วยงานเฉพาะเจาะจง
    if (selectedSite !== "all") {
      const matchedSite = siteList.find((s: any) => s.site_name === selectedSite);
      if (matchedSite) {
        whereClause.siteId = matchedSite.id;
      }
    }

    // กรองตามช่วงเวลา
    const now = new Date();
    if (filter === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      whereClause.createdAt = { gte: startOfDay };
    } else if (filter === "7days") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      whereClause.createdAt = { gte: sevenDaysAgo };
    } else if (filter === "custom" && startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    // 4. ดึงรายงาน Logbook พร้อมข้อมูลพนักงานที่รายงาน
    const reportsRaw = await prisma.logbook.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    }).catch(() => []);

    // ดึงข้อมูลพนักงานทั้งหมดที่เกี่ยวข้องเพื่อเอาชื่อและรหัสพนักงาน
    const employeeIds = Array.from(new Set(reportsRaw.map((r: any) => r.userId).filter(Boolean)));
    let employeeMap = new Map();
    if (employeeIds.length > 0) {
      const employees = await prisma.user.findMany({
        where: { id: { in: employeeIds } },
        select: { id: true, name: true, employeeCode: true, username: true }
      }).catch(() => []);
      employeeMap = new Map(employees.map((e: any) => [e.id, e]));
    }

    const reports = reportsRaw.map((r: any) => {
      const emp = r.userId ? employeeMap.get(r.userId) : null;
      return {
        id: r.id,
        title: r.message ? r.message.substring(0, 40) + "..." : "รายงานการปฏิบัติงาน",
        content: r.message,
        siteName: siteMap.get(r.siteId) || "หน่วยงานในความดูแล",
        isAcknowledged: r.status === "ACKNOWLEDGED",
        createdAt: r.createdAt,
        images: r.images || [],
        employeeName: emp?.name || r.reporterName || "เจ้าหน้าที่ปฏิบัติงาน",
        employeeCode: emp?.employeeCode || emp?.username || "KMS-GUARD",
        comments: [] // สามารถเชื่อมโยงตารางคอมเมนต์เพิ่มเติมได้ตามโครงสร้างจริง
      };
    });

    return NextResponse.json({
      success: true,
      client: { companyName },
      sites: availableSites,
      reports,
    });
  } catch (error: any) {
    console.error("Client Reports API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}