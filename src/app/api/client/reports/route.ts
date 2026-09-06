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

    // 3. ดึงรายงานจากตาราง incident_reports ที่ตรงกับ site_id นี้เท่านั้น
    let queryStr = `
      SELECT r.*, u.name as emp_name, u.employee_code, u.username as emp_username, s.site_name
      FROM incident_reports r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN sites s ON r.site_id = s.id
      WHERE r.site_id = '${clientSiteId}'
    `;

    // กรองตามช่วงเวลาเพิ่มเติมถ้ามี
    const now = new Date();
    if (filter === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      queryStr += ` AND r.created_at >= '${startOfDay}'`;
    } else if (filter === "7days") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      queryStr += ` AND r.created_at >= '${sevenDaysAgo}'`;
    } else if (filter === "custom" && startDate && endDate) {
      const startStr = new Date(startDate).toISOString();
      const endStr = new Date(new Date(endDate).setHours(23, 59, 59, 999)).toISOString();
      queryStr += ` AND r.created_at >= '${startStr}' AND r.created_at <= '${endStr}'`;
    }

    queryStr += ` ORDER BY r.created_at DESC`;

    const reportsRaw = (await prisma.$queryRawUnsafe(queryStr).catch(() => [])) as any[];

    const reports = reportsRaw.map((r: any) => ({
      id: r.id,
      title: r.message ? r.message.substring(0, 40) + "..." : "รายงานการปฏิบัติงาน",
      content: r.message,
      siteName: r.site_name || siteMap.get(r.site_id) || "หน่วยงานในความดูแล",
      isAcknowledged: r.status === "ACKNOWLEDGED",
      createdAt: r.created_at || r.createdAt,
      images: r.images || [],
      employeeName: r.emp_name || "เจ้าหน้าที่ปฏิบัติงาน",
      employeeCode: r.employee_code || r.emp_username || "KMS-GUARD",
      comments: []
    }));

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