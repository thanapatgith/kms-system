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
        .select("employee_code, wage, overtime_pay, daily_wage")
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
        baseWage8Hrs = Number(pData.wage) || 400;
        const rawOt = pData.overtime_pay !== null && pData.overtime_pay !== undefined ? Number(pData.overtime_pay) : 30;
        
        // แปลงเรตต่อชั่วโมงใน DB กลับเป็นยอดเต็ม 4 ชม. (เช่น 37.5 * 4 = 150)
        otRate4Hrs = rawOt < 60 ? rawOt * 4 : rawOt;
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
    const { name, employeeCode, phone, baseWage8Hrs, otWage4Hrs, siteId } = body;

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
    const { id, name, phone, baseWage8Hrs, otWage4Hrs, siteId } = body;

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

    // ⭐ แก้ไขให้ตรวจสอบและรองรับการกรอกเลข 0 ได้อย่างถูกต้อง (ไม่ตกหลุมพราง Falsy check)
    if (baseWage8Hrs !== undefined && otWage4Hrs !== undefined && targetUser?.employeeCode) {
      const parsedBase = parseFloat(baseWage8Hrs);
      const parsedOtTotal = parseFloat(otWage4Hrs);

      const wageVal = !isNaN(parsedBase) ? parsedBase : 400;
      const otTotalVal = !isNaN(parsedOtTotal) ? parsedOtTotal : 0; // รองรับค่า 0 ได้สมบูรณ์
      const otPerHour = otTotalVal / 4; 

      await supabase.from("payrolls")
        .update({
          wage: wageVal,
          overtime_pay: otPerHour, 
          daily_wage: wageVal + otTotalVal 
        })
        .eq("employee_code", targetUser.employeeCode.trim());
    }

    return NextResponse.json({ ok: true, message: "อัปเดตข้อมูลสำเร็จ", data: updated });
  } catch (error: any) {
    console.error("Update employee error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการอัปเดต" }, { status: 500 });
  }
}

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