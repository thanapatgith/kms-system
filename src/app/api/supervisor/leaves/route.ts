import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 1. ดึงรายการคำขอลา (GET)
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

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

    const formatted = leaves.map((item: any) => {
      return {
        id: item.id,
        employeeName: userMap.get(item.userId) || "เจ้าหน้าที่ รปภ.",
        leaveType: item.leaveType || item.type || "ลากิจ/ลาป่วย",
        startDate: item.startDate ? new Date(item.startDate).toLocaleDateString("th-TH") : "-",
        endDate: item.endDate ? new Date(item.endDate).toLocaleDateString("th-TH") : "-",
        reason: item.reason || "-",
        status: item.status || "PENDING",
        hasEdited: item.hasEdited ?? false, 
        rejectReason: item.rejectReason || ""
      };
    });

    return NextResponse.json({ ok: true, leaves: formatted });
  } catch (error: any) {
    console.error("Get supervisor leaves error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// 2. อัปเดตสถานะ (PUT)
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, rejectReason } = body;

    if (!id || !status) {
      return NextResponse.json({ ok: false, error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // ดึงข้อมูลเดิมใน Database ออกมาเช็ก
    const existingLeave = await prisma.leaveRequest.findUnique({
      where: { id: String(id) },
    });

    if (!existingLeave) {
      return NextResponse.json({ ok: false, error: "ไม่พบรายการคำขอนี้" }, { status: 404 });
    }

    // ถ้าเคยถูกล็อกถาวรไปแล้ว (hasEdited = true) ห้ามแก้ไขซ้ำเด็ดขาด
    // เช็กว่าถูกล็อกถาวรหรือยัง โดยใช้ as any บังคับ Type
    if ((existingLeave as any).hasEdited) {
      return NextResponse.json({ ok: false, error: "รายการนี้ถูกใช้สิทธิ์แก้ไขครบ 1 ครั้งแล้ว ไม่สามารถแก้ไขซ้ำได้" }, { status: 400 });
    }

    const isPending = !existingLeave.status || existingLeave.status === "PENDING";

    // เงื่อนไขตรวจสอบเวลา 24 ชั่วโมง: นับจากการกดเลือกสถานะครั้งแรก (เช็คจาก updatedAt)
    if (!isPending && existingLeave.updatedAt) {
      const firstActionTime = new Date(existingLeave.updatedAt).getTime();
      const currentTime = new Date().getTime();
      const hoursPassed = (currentTime - firstActionTime) / (1000 * 60 * 60);

      if (hoursPassed >= 24) {
        // หากเกิน 24 ชม. แล้ว ให้ล็อกถาวรทันที
        await prisma.leaveRequest.update({
          where: { id: String(id) },
          data: { hasEdited: true } as any, // เติม as any เพื่อหลบ Type Error ชั่วคราว
        });
        return NextResponse.json({ ok: false, error: "หมดเวลาแก้ไข (เกิน 24 ชั่วโมงนับจากการตัดสินใจครั้งแรกแล้ว)" }, { status: 400 });
      }
    }

    // กำหนดค่า hasEdited:
    // - ถ้าเป็นการกดครั้งแรก (PENDING) -> hasEdited = false (ยังเปิดโอกาสให้เปลี่ยนใจได้)
    // - ถ้าเป็นการกดเปลี่ยนใจครั้งถัดไป -> hasEdited = true (ล็อกถาวรทันที)
    const nextHasEdited = isPending ? false : true;

    const updateData: any = {
      status: status,
      hasEdited: nextHasEdited, 
    };

    if (rejectReason !== undefined) {
      updateData.rejectReason = rejectReason.trim() === "" ? null : rejectReason;
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: String(id) },
      data: updateData, // ใช้ตัวแปร updateData ที่ประกาศเป็น any แบบนี้จะไม่มีวันติด Error แดงครับ
    });

    return NextResponse.json({ ok: true, message: "อัปเดตสถานะสำเร็จ", data: updated });
  } catch (error: any) {
    console.error("Update leave status error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการอัปเดต" }, { status: 500 });
  }
}