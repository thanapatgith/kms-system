import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        employeeCode: true,
        role: true,
        phone: true,
        age: true,
        address: true,
        idCardNumber: true,
        thop7LicenseNo: true,
        pdpaConsent: true,
        site: {
          select: {
            siteName: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "ไม่พบข้อมูลผู้ใช้งาน" }, { status: 404 });
    }

    // ดึงเรทค่าจ้างและ site_name จากตาราง payrolls ใน Supabase
    let dailyRate = 520;
    let branchName = user.site?.siteName;

    if (user.employeeCode) {
      const { data: payrollData } = await supabase
        .from("payrolls")
        .select("daily_wage, site_name")
        .eq("billing_period", "2026-07")
        .eq("employee_code", user.employeeCode.trim())
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
        ...user,
        dailyRate: dailyRate,
        branch: branchName || "ยังไม่ระบุหน่วยงาน",
        idCard: user.idCardNumber || "-",
        guardLicense: user.thop7LicenseNo || "ยังไม่มีข้อมูลเลขใบอนุญาต",
      },
    });
  } catch (error: any) {
    console.error("Get profile error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}