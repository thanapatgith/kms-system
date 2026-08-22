import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.userId)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ ok: false, error: "ไม่พบข้อมูลผู้ใช้งาน" }, { status: 404 });
    }

    let dailyRate = 520;
    let branchName = user.branch || "หน่วยงานสังกัด KMS";

    if (user.employee_code) {
      // ค้นหาข้อมูลจากตาราง payrolls โดยรองรับทั้งรูปแบบ "2026-07" และ "1/7/2026"
      const { data: payrollData } = await supabase
        .from("payrolls")
        .select("daily_wage, site_name, net_salary, total_deductions")
        .or(`billing_period.eq.2026-07,billing_period.eq.1/7/2026`)
        .eq("employee_code", user.employee_code.trim())
        .maybeSingle();

      if (payrollData?.daily_wage) {
        dailyRate = Number(payrollData.daily_wage);
      }
      if (payrollData?.site_name) {
        branchName = payrollData.site_name;
      }
    }

    return NextResponse.json({
      ok: true,
      user: {
        name: user.name || "-",
        employeeCode: user.employee_code || user.employeeCode || "-",
        phone: user.phone || "-",
        idCard: user.id_card_number || user.idCardNumber || "-",
        licenseNo: user.thop7_license_no || user.thop7LicenseNo || "ไม่มีข้อมูล",
        branch: branchName,
        dailyRate: dailyRate,
      },
    });
  } catch (error: any) {
    console.error("Get profile error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}