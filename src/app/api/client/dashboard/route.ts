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

    // [ปรับปรุง] ถ้าหา Session ไม่เจอ ให้ดึงบัญชีที่มี role เป็น CLIENT คนแรกในระบบมาสำรองแบบไดนามิก
    if (!currentUsername) {
      const fallbackClient = (await prisma.$queryRaw`
        SELECT username FROM users WHERE role = 'CLIENT' LIMIT 1
      `.catch(() => [])) as any[];
      
      currentUsername = fallbackClient[0]?.username || "";
    }

    // 1. ดึงข้อมูลผู้ใช้ปัจจุบันเพื่อเอา site_id
    const currentUserList = (await prisma.$queryRaw`
      SELECT id, username, name, role, site_id 
      FROM users 
      WHERE username = ${currentUsername} 
      LIMIT 1
    `.catch(() => [])) as any[];

    const currentUser = currentUserList[0];
    const siteId = currentUser?.site_id;

    let siteName = "หน่วยงานในความดูแล";
    let guardsCount = 0;

    if (siteId) {
      // 2. ดึงชื่อไซต์งานจากตาราง sites
      const siteList = (await prisma.$queryRaw`
        SELECT id, site_name FROM sites WHERE id = ${siteId} LIMIT 1
      `.catch(() => [])) as any[];

      if (siteList && siteList.length > 0) {
        siteName = siteList[0].site_name;
      }

      // 3. นับจำนวน รปภ. จริงโดยกรองเฉพาะ role ที่เป็นพนักงาน/หัวหน้าชุด (ตัด CLIENT ออก)
      const guardsResult = (await prisma.$queryRaw`
        SELECT COUNT(id) as count 
        FROM users 
        WHERE site_id = ${siteId} 
          AND role IN ('EMPLOYEE', 'SUPERVISOR')
      `.catch(() => [{ count: 0 }])) as any[];

      guardsCount = Number(guardsResult[0]?.count || 0);
    }

    // 4. ดึงรายงาน Logbook ของไซต์นี้
    let reportsRaw: any[] = [];
    if (siteId) {
      reportsRaw = await prisma.logbook.findMany({
        where: { siteId: siteId },
        orderBy: { createdAt: "desc" },
      }).catch(() => []);
    }

    const reports = reportsRaw.map((r: any) => ({
      id: r.id,
      title: r.message ? r.message.substring(0, 40) + "..." : "รายงานการปฏิบัติงาน",
      content: r.message,
      siteName: siteName,
      isAcknowledged: r.status === "ACKNOWLEDGED",
      createdAt: r.createdAt,
      comments: []
    }));

    return NextResponse.json({
      success: true,
      client: {
        companyName: siteName,
        contractNumber: "CNT-2026-001",
        contactPerson: currentUser?.name || "ผู้ดูแลโครงการ",
        contactPhone: "02-XXX-XXXX",
        accountantName: "-",
        accountantPhone: "-",
        billingCycle: "ทุกสิ้นเดือน",
        monthlyFee: 0,
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