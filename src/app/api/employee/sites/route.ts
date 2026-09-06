import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const userList = (await prisma.$queryRaw`
      SELECT site_id FROM users WHERE id = ${session.userId} LIMIT 1
    `.catch(() => [])) as any[];

    const userSiteId = userList[0]?.site_id;
    let sitesList: any[] = [];

    if (userSiteId) {
      const sites = (await prisma.$queryRaw`
        SELECT id, site_name FROM sites WHERE id = ${userSiteId} LIMIT 1
      `.catch(() => [])) as any[];

      if (sites.length > 0) {
        sitesList = [{ id: sites[0].id, siteName: sites[0].site_name }];
      }
    }

    if (sitesList.length === 0) {
      const allSites = (await prisma.$queryRaw`
        SELECT id, site_name FROM sites ORDER BY site_name ASC
      `.catch(() => [])) as any[];
      sitesList = allSites.map((s: any) => ({ id: s.id, siteName: s.site_name }));
    }

    return NextResponse.json({ ok: true, sites: sitesList });
  } catch (error: any) {
    console.error("Error fetching employee sites:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}