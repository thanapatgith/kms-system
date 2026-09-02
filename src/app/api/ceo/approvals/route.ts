import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. ดึงรายชื่อพนักงานทั้งหมด (รวม site_id) จาก users
    const { data: usersData } = await supabaseAdmin.from("users").select("id, name, employee_code, site_id");
    
    // 2. ดึงรายชื่อหน่วยงานทั้งหมดจาก sites มาทำ Map
    const { data: sitesData } = await supabaseAdmin.from("sites").select("id, site_name");
    const siteMap = new Map<string, string>();
    (sitesData || []).forEach((s: any) => {
      if (s.id) siteMap.set(s.id, s.site_name);
    });

    // สร้าง Map เก็บข้อมูลพนักงาน (ชื่อ, รหัส, ชื่อหน่วยงาน)
    const userMap = new Map<string, { name: string; employee_code: string; site_name: string }>();
    (usersData || []).forEach((u: any) => {
      if (u.id) {
        const siteName = u.site_id ? siteMap.get(u.site_id) || "สำนักงานใหญ่" : "สำนักงานใหญ่";
        userMap.set(u.id, {
          name: u.name || "ไม่ระบุชื่อ",
          employee_code: u.employee_code || "KMS-EMP",
          site_name: siteName,
        });
      }
    });

    // 3. ดึงคำร้องเบิกเงิน
    const { data: loans } = await supabaseAdmin
      .from("loan_requests")
      .select("*")
      .order("created_at", { ascending: false });

    // 4. ดึงคำร้องขอลา
    const { data: leaves } = await supabaseAdmin
      .from("leave_requests")
      .select("*")
      .order("created_at", { ascending: false });

    // 5. ดึงคำร้องเบิกอุปกรณ์
    const { data: equipments } = await supabaseAdmin
      .from("equipment_requests")
      .select("*")
      .order("created_at", { ascending: false });

    // ฟังก์ชันช่วยแมปข้อมูลพนักงานและหน่วยงาน
    const mapUserData = (list: any[]) =>
      (list || []).map((item) => {
        const uid = item.user_id || item.employee_id || item.applicant_id;
        const userInfo = userMap.get(uid);

        return {
          ...item,
          employee_name: userInfo?.name || item.employee_name || item.applicant_name || "พนักงาน",
          employee_code: userInfo?.employee_code || item.employee_code || "KMS-EMP",
          site_name: userInfo?.site_name || item.site_name || "สำนักงานใหญ่",
        };
      });

    return NextResponse.json(
      {
        ok: true,
        loans: mapUserData(loans || []),
        leaves: mapUserData(leaves || []),
        equipments: mapUserData(equipments || []),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to fetch approvals" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, type, status, reject_reason } = body;

    let tableName = "loan_requests";
    if (type === "leave") tableName = "leave_requests";
    if (type === "equipment") tableName = "equipment_requests";

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (reject_reason) {
      updateData.reject_reason = reject_reason;
    }

    const { error } = await supabaseAdmin
      .from(tableName)
      .update(updateData)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}