import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const requests = await (prisma as any).equipmentRequest.findMany({
      where: {
        NOT: {
          userId: session.userId,
        },
      },
      include: {
        user: {
          select: { name: true, employeeCode: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = requests.map((item: any) => ({
      id: item.id,
      employeeName: item.user?.name || "พนักงาน",
      // ปรับชื่อฟิลด์ให้ครอบคลุมชื่อที่เป็นไปได้ใน DB
      equipmentName: item.itemName || item.item_name || item.item || item.name || "ไม่ระบุรายการ",
      quantity: item.quantity || 1,
      reason: item.reason || "-",
      status: item.status || "PENDING",
      rejectReason: item.rejectReason || "",
      hasEdited: item.hasEdited || false,
      date: item.createdAt ? new Date(item.createdAt).toLocaleDateString("th-TH") : "-",
      createdAt: item.createdAt,
    }));

    return NextResponse.json({ ok: true, requests: formatted });
  } catch (error: any) {
    console.error("Approval API Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
// เพิ่มฟังก์ชัน PUT นี้ต่อท้ายในไฟล์ route.ts ของ equipment_requests
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

    const existing = await (prisma as any).equipmentRequest.findUnique({
      where: { id: String(id) },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "ไม่พบรายการนี้" }, { status: 404 });
    }

    if ((existing as any).hasEdited) {
      return NextResponse.json({ ok: false, error: "รายการนี้ถูกใช้สิทธิ์แก้ไขครบ 1 ครั้งแล้ว" }, { status: 400 });
    }

    const isPending = !existing.status || existing.status === "PENDING";

    if (!isPending && existing.updatedAt) {
      const firstActionTime = new Date(existing.updatedAt).getTime();
      const currentTime = new Date().getTime();
      const hoursPassed = (currentTime - firstActionTime) / (1000 * 60 * 60);

      if (hoursPassed >= 24) {
        await (prisma as any).equipmentRequest.update({
          where: { id: String(id) },
          data: { hasEdited: true },
        });
        return NextResponse.json({ ok: false, error: "หมดเวลาแก้ไข (เกิน 24 ชั่วโมงแล้ว)" }, { status: 400 });
      }
    }

    const nextHasEdited = isPending ? false : true;

    const updateData: any = {
      status: status,
      hasEdited: nextHasEdited,
    };

    if (rejectReason !== undefined) {
      updateData.rejectReason = rejectReason.trim() === "" ? null : rejectReason;
    }

    const updated = await (prisma as any).equipmentRequest.update({
      where: { id: String(id) },
      data: updateData,
    });

    return NextResponse.json({ ok: true, message: "อัปเดตสำเร็จ", data: updated });
  } catch (error: any) {
    console.error("Update equipment request error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}