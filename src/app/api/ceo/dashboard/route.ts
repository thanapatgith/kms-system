import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const clients = (await prisma.$queryRaw`
      SELECT id, company_name, contact_person FROM clients
    `.catch(() => [])) as any[];

    const currentClient = clients[0] || {};
    const clientId = currentClient.id;

    let clientSites: any[] = [];
    if (clientId) {
      clientSites = (await prisma.$queryRaw`
        SELECT id, site_name FROM sites WHERE client_id = ${clientId}
      `.catch(() => [])) as any[];
    }

    if (clientSites.length === 0) {
      clientSites = (await prisma.$queryRaw`
        SELECT id, site_name FROM sites WHERE client_id IS NOT NULL
      `.catch(() => [])) as any[];
    }

    const siteIds = clientSites.map((s: any) => s.id);
    const siteMap = new Map(clientSites.map((s: any) => [s.id, s.site_name]));

    let reportsRaw: any[] = [];
    if (siteIds.length > 0) {
      reportsRaw = (await prisma.$queryRaw`
        SELECT * FROM incident_reports 
        WHERE site_id = ANY(${siteIds}) 
        ORDER BY created_at DESC
      `.catch(() => [])) as any[];
    }

    const reports = reportsRaw.map((r: any) => ({
      id: r.id,
      title: r.message ? r.message.substring(0, 40) + "..." : "รายงานการปฏิบัติงาน",
      content: r.message,
      images: r.images || [],
      siteName: siteMap.get(r.site_id) || "หน่วยงานในความดูแล",
      isAcknowledged: r.status === "ACKNOWLEDGED",
      createdAt: r.created_at || r.createdAt,
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
        sitesCount: clientSites.length,
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