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
    // 1. ดึงรายชื่อพนักงานทั้งหมดจาก users มาทำ Dictionary ดึงชื่อ
    const { data: usersData } = await supabaseAdmin.from("users").select("id, name");
    
    // สร้าง Map ให้ค้นหาชื่อจาก ID (รองรับทั้ง id และ user_id)
    const userMap = new Map<string, string>();
    (usersData || []).forEach((u: any) => {
      if (u.id) userMap.set(u.id, u.name);
    });

    // 2. ดึงคำร้องเบิกเงิน
    const { data: loans } = await supabaseAdmin
      .from("loan_requests")
      .select("*")
      .order("created_at", { ascending: false });

    // 3. ดึงคำร้องขอลา
    const { data: leaves } = await supabaseAdmin
      .from("leave_requests")
      .select("*")
      .order("created_at", { ascending: false });

    // 4. ดึงคำร้องเบิกอุปกรณ์
    const { data: equipments } = await supabaseAdmin
      .from("equipment_requests")
      .select("*")
      .order("created_at", { ascending: false });

    // ฟังก์ชันช่วยหาชื่อจริง
    const mapName = (list: any[]) =>
      (list || []).map((item) => {
        const uid = item.user_id || item.employee_id || item.applicant_id || item.id;
        const foundName = userMap.get(uid) || item.employee_name || item.applicant_name;
        
        return {
          ...item,
          employee_name: foundName && foundName !== uid ? foundName : `พนักงาน (${item.user_id || uid || "ไม่ระบุ"})`,
        };
      });

    return NextResponse.json(
      {
        ok: true,
        loans: mapName(loans || []),
        leaves: mapName(leaves || []),
        equipments: mapName(equipments || []),
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