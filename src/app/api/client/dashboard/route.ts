import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
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

    const currentUserList = (await prisma.$queryRaw`
      SELECT u.id, u.username, u.name, u.role, u.site_id, s.id as site_primary_id, s.site_name, s.client_id
      FROM users u
      LEFT JOIN sites s ON u.site_id = s.id
      WHERE u.username = ${currentUsername} 
      LIMIT 1
    `.catch(() => [])) as any[];

    const currentUser = currentUserList[0];
    const siteId = currentUser?.site_id;
    const clientId = currentUser?.client_id;

    let siteName = "หน่วยงานในความดูแล";
    let guardsCount = 0;

    if (siteId) {
      const siteList = (await prisma.$queryRaw`
        SELECT id, site_name FROM sites WHERE id = ${siteId} LIMIT 1
      `.catch(() => [])) as any[];

      if (siteList && siteList.length > 0) {
        siteName = siteList[0].site_name;
      }

      const guardsResult = (await prisma.$queryRaw`
        SELECT COUNT(id) as count 
        FROM users 
        WHERE site_id = ${siteId} 
          AND role IN ('EMPLOYEE', 'SUPERVISOR')
      `.catch(() => [{ count: 0 }])) as any[];

      guardsCount = Number(guardsResult[0]?.count || 0);
    }

    let clientRecord = null;
    if (clientId) {
      clientRecord = await prisma.client.findUnique({
        where: { id: clientId },
      }).catch(() => null);
    }

    // ดึงรายงานจากตาราง incident_reports ให้ตรงกับหน้ารายงานจริง
    let reportsRaw: any[] = [];
    if (siteId) {
      reportsRaw = (await prisma.$queryRaw`
        SELECT r.*, u.name as emp_name, u.employee_code, u.username as emp_username, s.site_name
        FROM incident_reports r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN sites s ON r.site_id = s.id
        WHERE r.site_id = ${siteId}
        ORDER BY r.created_at DESC
      `.catch(() => [])) as any[];
    }

    if (reportsRaw.length === 0) {
      reportsRaw = (await prisma.$queryRaw`
        SELECT r.*, u.name as emp_name, u.employee_code, u.username as emp_username, s.site_name
        FROM incident_reports r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN sites s ON r.site_id = s.id
        ORDER BY r.created_at DESC
      `.catch(() => [])) as any[];
    }

    const reports = reportsRaw.map((r: any) => ({
      id: r.id,
      title: r.message ? r.message.substring(0, 40) + "..." : "รายงานการปฏิบัติงาน",
      content: r.message,
      siteName: r.site_name || siteName,
      isAcknowledged: r.status === "ACKNOWLEDGED",
      createdAt: r.created_at || r.createdAt,
      images: r.images || [],
      comments: []
    }));

    return NextResponse.json({
      success: true,
      client: {
        companyName: clientRecord?.companyName || siteName,
        contractNumber: clientRecord?.contractNumber || "CNT-2026-001",
        contactPerson: clientRecord?.contactPerson || currentUser?.name || "ผู้ดูแลโครงการ",
        contactPhone: clientRecord?.contactPhone || "02-XXX-XXXX",
        accountantName: clientRecord?.accountantName || "-",
        accountantPhone: clientRecord?.accountantPhone || "-",
        billingCycle: "ทุกวันที่ 10 ของเดือน",
        monthlyFee: clientRecord?.monthlyFee || 45800,
        sitesCount: siteId ? 1 : 0,
        guardsCount: guardsCount,
      },
      reports,
      payments: [],
    });
  } catch (error: any) {
    console.error("Dashboard API Error Detail:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}