import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "2026-09"; // รูปแบบ YYYY-MM

    // 1. คำนวณช่วงวันที่เริ่มต้นและสิ้นสุดของเดือน (period) เพื่อกรองข้อมูลให้ตรงกับงวดที่เลือก
    const [yearStr, monthStr] = period.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    // 2. ดึงรายงานเหตุการณ์ทั้งหมดจาก incident_reports
    const { data: incidents, error: incError } = await supabaseAdmin
      .from("incident_reports")
      .select("*")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: false });

    if (incError) console.error("Incident fetch error:", incError);

    // 3. ดึงข้อมูลพนักงานจากตาราง users (เพิ่ม employee_code)
    const { data: usersData } = await supabaseAdmin
      .from("users")
      .select("id, employee_code, name, site_id");

    const userMap = new Map();
    (usersData || []).forEach((u: any) => {
      userMap.set(u.id, u);
    });

    // 4. ดึงข้อมูลไซต์งานจากตาราง sites
    const { data: sitesData } = await supabaseAdmin
      .from("sites")
      .select("id, site_name");

    const siteMap = new Map();
    (sitesData || []).forEach((s: any) => {
      siteMap.set(s.id, s.site_name);
    });

    // 5. ประกอบร่างข้อมูลชื่อพนักงาน รหัสพนักงาน และชื่อไซต์งาน
    const formattedIncidents = (incidents || []).map((item: any) => {
      const userInfo = userMap.get(item.user_id) || {};
      const targetSiteId = item.site_id || userInfo.site_id;
      const actualSiteName = siteMap.get(targetSiteId) || "สำนักงานใหญ่";
      const actualEmployeeName = userInfo.name || "พนักงาน";
      const actualEmployeeCode = userInfo.employee_code || "-";

      return {
        ...item,
        employee_name: actualEmployeeName,
        employee_code: actualEmployeeCode,
        site_name: actualSiteName,
      };
    });

    // 6. นับจำนวนการตรวจตราจริงจากตาราง Attendance (สุ่มตรวจหน้างาน) ตามช่วงเดือน
    let patrolCount = 0;
    const { count, error: attError } = await supabaseAdmin
      .from("Attendance")
      .select("*", { count: "exact", head: true })
      .gte("createdAt", startDate)
      .lte("createdAt", endDate);

    if (!attError && count !== null) {
      patrolCount = count;
    } else {
      // เผื่อกรณีใช้ชื่อตารางตัวพิมพ์เล็ก attendance
      const { count: countLower } = await supabaseAdmin
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .gte("createdAt", startDate)
        .lte("createdAt", endDate);
      
      patrolCount = countLower || 0;
    }

    return NextResponse.json(
      {
        ok: true,
        period,
        patrolCount,
        incidents: formattedIncidents,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to fetch reports" },
      { status: 500 }
    );
  }
}