import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      include: { site: true },
      orderBy: { createdAt: "desc" },
    });

    const sites = await prisma.site.findMany({
      orderBy: { siteName: "asc" },
    });

    const employeeCodes = employees.map((e: any) => e.employeeCode).filter(Boolean);

    let payrollMap = new Map();
    if (employeeCodes.length > 0) {
      const { data: payrolls } = await supabase
        .from("payrolls")
        .select("employee_code, wage, overtime_pay")
        .in("employee_code", employeeCodes);

      if (payrolls) {
        payrolls.forEach((p: any) => {
          if (p.employee_code) {
            payrollMap.set(p.employee_code.trim(), p);
          }
        });
      }
    }

    const formattedEmployees = employees.map((emp: any) => {
      let baseWage8Hrs = 400; 
      let otRate4Hrs = 120;  

      const pData = emp.employeeCode ? payrollMap.get(emp.employeeCode.trim()) : null;
      if (pData) {
        const dbWage = Number(pData.wage) || 400;
        const dbOtPerHour = Number(pData.overtime_pay) || 30;
        baseWage8Hrs = dbWage;
        otRate4Hrs = dbOtPerHour * 4;
      }

      const totalDailyRate = baseWage8Hrs + otRate4Hrs;

      return {
        ...emp,
        dailyRate: totalDailyRate,
        baseWage8Hrs,
        otRate4Hrs,
      };
    });

    return NextResponse.json({ ok: true, employees: formattedEmployees, sites });
  } catch (error: any) {
    console.error("Get employees error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const body = await req.json();
    const { name, employeeCode, phone, dailyRate, siteId } = body;

    if (!name || !employeeCode) {
      return NextResponse.json({ ok: false, error: "กรุณากรอกชื่อและรหัสพนักงาน" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash("password123", 10);

    const newEmployee = await prisma.user.create({
      data: {
        name,
        employeeCode,
        username: employeeCode,
        passwordHash: hashedPassword,
        phone: phone || null,
        siteId: siteId || null,
        role: "EMPLOYEE",
      },
    });

    if (dailyRate) {
      const totalDaily = parseFloat(dailyRate);
      const baseWage8Hrs = 400;
      const diffOtTotal = Math.max(0, totalDaily - baseWage8Hrs);
      const otPerHour = diffOtTotal > 0 ? diffOtTotal / 4 : 30;

      await supabase.from("payrolls").upsert({
        employee_code: employeeCode.trim(),
        wage: baseWage8Hrs,
        overtime_pay: otPerHour,
      }, { onConflict: "employee_code" });
    }

    return NextResponse.json({ ok: true, message: "เพิ่มพนักงานสำเร็จ", data: newEmployee });
  } catch (error: any) {
    console.error("Create employee error:", error);
    return NextResponse.json({ ok: false, error: error.message || "รหัสพนักงานนี้อาจมีในระบบแล้ว" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, phone, dailyRate, siteId } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "ไม่พบรหัสพนักงาน" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: String(id) } });

    const updated = await prisma.user.update({
      where: { id: String(id) },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(siteId !== undefined && { siteId: siteId === "" ? null : siteId }),
      },
    });

    if (dailyRate !== undefined && dailyRate !== "" && targetUser?.employeeCode) {
      const totalDaily = parseFloat(dailyRate);
      const baseWage8Hrs = 400;
      const diffOtTotal = Math.max(0, totalDaily - baseWage8Hrs);
      const otPerHour = diffOtTotal > 0 ? diffOtTotal / 4 : 30;

      await supabase.from("payrolls").upsert({
        employee_code: targetUser.employeeCode.trim(),
        wage: baseWage8Hrs,
        overtime_pay: otPerHour,
      }, { onConflict: "employee_code" });
    }

    return NextResponse.json({ ok: true, message: "อัปเดตข้อมูลสำเร็จ", data: updated });
  } catch (error: any) {
    console.error("Update employee error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการอัปเดต" }, { status: 500 });
  }
}

// 4. รีเซ็ตรหัสผ่านพนักงานเป็นค่าเริ่มต้น (PATCH)
export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "ไม่พบรหัสพนักงาน" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash("password123", 10);

    await prisma.user.update({
      where: { id: String(id) },
      data: { passwordHash: hashedPassword },
    });

    return NextResponse.json({ ok: true, message: "รีเซ็ตรหัสผ่านสำเร็จ" });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, error: "ไม่พบรหัสพนักงานที่ต้องการลบ" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: String(id) } });
    if (!targetUser) {
      return NextResponse.json({ ok: false, error: "ไม่พบข้อมูลพนักงานในระบบ" }, { status: 404 });
    }

    if (targetUser.employeeCode) {
      await supabase.from("payrolls").delete().eq("employee_code", targetUser.employeeCode.trim());
    }

    await prisma.user.delete({
      where: { id: String(id) },
    });

    return NextResponse.json({ ok: true, message: "ลบพนักงานสำเร็จ" });
  } catch (error: any) {
    console.error("Delete employee error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการลบ" }, { status: 500 });
  }
}