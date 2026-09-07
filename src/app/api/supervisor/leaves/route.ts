import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 1. ดึงรายการคำขอลา และรายชื่อพนักงานเฉพาะ (GET)
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    // ดึงรายการใบลา
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        NOT: {
          userId: session.userId,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const userIds = Array.from(new Set(leaves.map((l: any) => l.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, employeeCode: true },
    });
    const userMap = new Map(users.map((u: any) => [u.id, u.name || u.employeeCode || "เจ้าหน้าที่"]));

    // ดึงข้อมูลการปฏิบัติหน้าที่แทนจากตาราง shift_replacements ด้วย SQL ตรงๆ
    const replacements: any = await prisma.$queryRaw`SELECT * FROM public.shift_replacements`;
    const replacementMap = new Map((replacements || []).map((r: any) => [r.leave_id, r]));

    // ดึงเฉพาะรายชื่อพนักงาน (role: "EMPLOYEE") สำหรับทำ Dropdown เลือกคนแทน
    const allEmployees = await prisma.user.findMany({
      where: {
        role: "EMPLOYEE",
      },
      select: { id: true, name: true, employeeCode: true },
      orderBy: { name: "asc" },
    });

    const formattedLeaves = leaves.map((item: any) => {
      const rep = replacementMap.get(item.id);
      let substituteName = null;
      let substituteUserId = "";

      if (rep) {
        substituteUserId = rep.replacement_employee_id;
        const subUser = allEmployees.find((u: any) => u.id === substituteUserId);
        if (subUser) {
          substituteName = subUser.name || subUser.employeeCode;
        }
      }

      return {
        id: item.id,
        employeeName: userMap.get(item.userId) || "เจ้าหน้าที่ รปภ.",
        leaveType: item.leaveType || item.type || "ลากิจ/ลาป่วย",
        startDate: item.startDate ? new Date(item.startDate).toLocaleDateString("th-TH") : "-",
        endDate: item.endDate ? new Date(item.endDate).toLocaleDateString("th-TH") : "-",
        reason: item.reason || "-",
        status: item.status || "PENDING",
        hasEdited: false, 
        rejectReason: item.rejectReason || "",
        substituteUserId: substituteUserId,
        substituteName: substituteName
      };
    });

    return NextResponse.json({ 
      ok: true, 
      leaves: formattedLeaves, 
      employees: allEmployees 
    });
  } catch (error: any) {
    console.error("Get supervisor leaves error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// 2. อัปเดตสถานะ พร้อมบันทึกผู้ปฏิบัติหน้าที่แทนลง shift_replacements (PUT)
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, rejectReason, substituteUserId } = body;

    if (!id || !status) {
      return NextResponse.json({ ok: false, error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const existingLeave = await prisma.leaveRequest.findUnique({
      where: { id: String(id) },
    });

    if (!existingLeave) {
      return NextResponse.json({ ok: false, error: "ไม่พบรายการคำขอนี้" }, { status: 404 });
    }

    // อัปเดตสถานะในตาราง leaveRequest
    const updateData: any = {
      status: status,
    };

    if (rejectReason !== undefined) {
      updateData.rejectReason = rejectReason.trim() === "" ? null : rejectReason;
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: String(id) },
      data: updateData,
    });

    // ==========================================
    // จัดการข้อมูลในตาราง shift_replacements ผ่าน SQL
    // ==========================================
    const originalUserId = existingLeave.userId;
    const finalSubstituteId = substituteUserId !== undefined ? (substituteUserId.trim() === "" ? null : substituteUserId) : null;

    if (status === "APPROVED" && finalSubstituteId) {
      const originalUser = await prisma.user.findUnique({
        where: { id: originalUserId },
        select: { siteId: true },
      });

      const targetSiteId = originalUser?.siteId || null;
      const startDate = (existingLeave as any).startDate ? new Date((existingLeave as any).startDate) : new Date();
      const endDate = (existingLeave as any).endDate ? new Date((existingLeave as any).endDate) : new Date();

      // เช็กว่ามีข้อมูลเดิมอยู่แล้วไหม
      const existing: any = await prisma.$queryRaw`
        SELECT id FROM public.shift_replacements WHERE leave_id = ${String(id)} LIMIT 1
      `;

      if (existing && existing.length > 0) {
        // อัปเดตข้อมูลเดิม
        await prisma.$executeRaw`
          UPDATE public.shift_replacements 
          SET replacement_employee_id = ${finalSubstituteId}, 
              site_id = ${targetSiteId}, 
              start_date = ${startDate}, 
              end_date = ${endDate}, 
              status = 'approved'
          WHERE leave_id = ${String(id)}
        `;
      } else {
        // สร้างข้อมูลใหม่
        await prisma.$executeRaw`
          INSERT INTO public.shift_replacements (id, leave_id, original_employee_id, replacement_employee_id, site_id, start_date, end_date, status)
          VALUES (gen_random_uuid(), ${String(id)}, ${originalUserId}, ${finalSubstituteId}, ${targetSiteId}, ${startDate}, ${endDate}, 'approved')
        `;
      }
    } else {
      // ถ้าไม่อนุมัติ หรือไม่ได้เลือกคนแทน ให้ลบข้อมูลออก
      await prisma.$executeRaw`
        DELETE FROM public.shift_replacements WHERE leave_id = ${String(id)}
      `;
    }

    return NextResponse.json({ ok: true, message: "อัปเดตสถานะสำเร็จ", data: updated });
  } catch (error: any) {
    console.error("Update leave status error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการอัปเดต" }, { status: 500 });
  }
}