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
    // 1. ดึงรายชื่อพนักงานเฉพาะฟิลด์ที่จำเป็นเพื่อลดขนาดข้อมูล (Payload)
    const { data: usersData } = await supabaseAdmin
      .from("users")
      .select("id, name, employee_code, site_id, bank_name, bank_account");
    
    // 2. ดึงรายชื่อหน่วยงานทั้งหมดจาก sites มาทำ Map
    const { data: sitesData } = await supabaseAdmin.from("sites").select("id, site_name");
    const siteMap = new Map<string, string>();
    (sitesData || []).forEach((s: any) => {
      if (s.id) siteMap.set(s.id, s.site_name);
    });

    // สร้าง Map เก็บข้อมูลพนักงาน
    const userMap = new Map<string, { name: string; employee_code: string; site_name: string; bank_name: string; bank_account: string }>();
    (usersData || []).forEach((u: any) => {
      if (u.id) {
        const siteName = u.site_id ? siteMap.get(u.site_id) || "สำนักงานใหญ่" : "สำนักงานใหญ่";
        userMap.set(u.id, {
          name: u.name || "ไม่ระบุชื่อ",
          employee_code: u.employee_code || "KMS-EMP",
          site_name: siteName,
          bank_name: u.bank_name || "-",
          bank_account: u.bank_account || "-",
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

    const mapUserData = (list: any[]) =>
      (list || []).map((item) => {
        const uid = item.user_id || item.employee_id || item.applicant_id;
        const userInfo = userMap.get(uid);

        return {
          ...item,
          employee_name: userInfo?.name || item.employee_name || item.applicant_name || "พนักงาน",
          employee_code: userInfo?.employee_code || item.employee_code || "KMS-EMP",
          site_name: userInfo?.site_name || item.site_name || "สำนักงานใหญ่",
          bank_name: userInfo?.bank_name || item.bank_name || "-",
          bank_account: userInfo?.bank_account || item.bank_account || "-",
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
          // ⭐ ปรับ Cache-Control ให้เบราว์เซอร์จำข้อมูลชั่วคราว (30 วินาที) 
          // ช่วยลดจำนวนครั้งที่ยิงมาที่เซิร์ฟเวอร์และช่วยลดการสะสม Egress ที่ไม่จำเป็น
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
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
    const { id, type, status, reject_reason, slip_url } = body;

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

    if (slip_url !== undefined) {
      updateData.slip_url = slip_url;
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