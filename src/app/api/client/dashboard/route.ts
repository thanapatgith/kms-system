import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. ดึงข้อมูลบริษัทลูกค้าทั้งหมดเพื่อดูว่ามีเรคอร์ดไหนบ้าง
    const clients = (await prisma.$queryRaw`
      SELECT id, company_name, contact_person FROM clients
    `.catch(() => [])) as any[];

    const currentClient = clients[0] || {};
    // ดึง id ของลูกค้าจริงจากตาราง clients (เช่น id 'fd253584-9eef-47a1-b589-02dfd0ec47e7')
    const clientId = currentClient.id;

    // 2. ดึงเฉพาะไซต์งานที่ผูกกับ client_id นี้จริงๆ โดยใช้เงื่อนไขตรงๆ
    let clientSites: any[] = [];
    if (clientId) {
      clientSites = (await prisma.$queryRaw`
        SELECT id, site_name FROM sites WHERE client_id = ${clientId}
      `.catch(() => [])) as any[];
    }

    // เผื่อกรณี query ข้างบนไม่ได้ ให้ดึงไซต์ทั้งหมดที่มี client_id ไม่เป็น null มาสำรอง
    if (clientSites.length === 0) {
      clientSites = (await prisma.$queryRaw`
        SELECT id, site_name FROM sites WHERE client_id IS NOT NULL
      `.catch(() => [])) as any[];
    }

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
      id: r.id,
      title: r.message ? r.message.substring(0, 40) + "..." : "รายงานการปฏิบัติงาน",
      content: r.message,
      siteName: siteMap.get(r.siteId) || "หน่วยงานในความดูแล",
      isAcknowledged: r.status === "ACKNOWLEDGED",
      createdAt: r.createdAt,
      comments: []
    }));

    return NextResponse.json({
      success: true,
      client: {
        companyName: currentClient.company_name || "บริษัท อมตะ จำกัด",
        contractNumber: "CTR-2026-001",
        contactPerson: currentClient.contact_person || "ผู้ดูแลระบบ",
        contactPhone: "081-234-5678",
        accountantName: "เจ้าหน้าที่การเงิน",
        accountantPhone: "089-876-5432",
        billingCycle: "ทุกสิ้นเดือน",
        monthlyFee: 50000,
        sitesCount: clientSites.length, // แสดงจำนวนไซต์ที่ผูกจริงตามฐานข้อมูล
        guardsCount: clientSites.length * 2,
      },
      reports,
      payments: [],
    });
  } catch (error: any) {
    console.error("Dashboard API Error Detail:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}