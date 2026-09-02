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
    const period = searchParams.get("period") || "2026-09"; // เช่น "2026-09"

    // ค้นหาข้อมูลจากตาราง payrolls โดยอิงตามฟิลด์ month ที่เก็บค่า "2026-09"
    const { data, error } = await supabaseAdmin
      .from("payrolls")
      .select("*")
      .eq("month", period)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    // แมปข้อมูลให้ตรงกับ Interface ที่หน้าบ้าน (CEOPayrollPage) ต้องการ
    const formattedData = (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id || "-",
      employee_code: item.employee_code || "KMS-EMP",
      employee_name: item.employee_name || "ไม่ระบุชื่อ",
      gender: item.gender || "MALE",
      site_name: item.site_name || "สำนักงานใหญ่",
      status: item.status || "PENDING",
      work_days: item.work_days || 30,
      gross_income: Number(item.gross_income || item.base_salary || 0),
      total_advance: Number(item.total_advance || 0),
      social_security: Number(item.social_security || 0),
      tax_withholding: Number(item.tax_withholding || 0),
      total_deductions: Number(item.total_deductions || item.deductions || 0),
      net_salary: Number(item.net_salary || 0),
      billing_period: item.month || period,
    }));

    return NextResponse.json(
      {
        ok: true,
        period,
        count: formattedData.length,
        data: formattedData,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to fetch payroll" },
      { status: 500 }
    );
  }
}