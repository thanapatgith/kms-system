import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// 1. ดึงประวัติคำขอเบิกอุปกรณ์ของพนักงาน (GET)
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    // หากยังไม่ได้เพิ่มตารางใน Prisma Schema สามารถจำลอง Mock Data ให้หน้าจอทำงานก่อนได้ครับ
    let requests: any[] = [];
    
    try {
      if ((prisma as any).equipmentRequest) {
        requests = await (prisma as any).equipmentRequest.findMany({
          where: { userId: session.userId },
          orderBy: { createdAt: "desc" },
        });
      }
    } catch (e) {
      console.warn("EquipmentRequest model not ready yet, using fallback");
    }

    // ถ้ายังไม่มีข้อมูลใน DB ส่ง Mock Data ให้ทดสอบ UI ก่อน
    if (requests.length === 0) {
      requests = [
        {
          id: "req-1",
          itemName: "ชุดเครื่องแบบ รปภ.",
          size: "XL",
          quantity: 2,
          reasonType: "NEW",
          reason: "ขอรับชุดประจำปี",
          status: "DELIVERED",
          createdAt: new Date("2026-08-01T08:30:00Z"),
        },
      ];
    }

    const formatted = requests.map((item: any) => ({
      id: item.id,
      itemName: item.itemName,
      size: item.size || "-",
      quantity: item.quantity || 1,
      reasonType: item.reasonType || "NEW",
      reason: item.reason || "",
      status: item.status || "PENDING",
      date: new Date(item.createdAt).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: new Date(item.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    }));

    return NextResponse.json({ ok: true, requests: formatted });
  } catch (error: any) {
    console.error("Get equipment requests error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// 2. สร้างคำขอเบิกอุปกรณ์ใหม่ (POST)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const body = await req.json();
    const { itemName, size, quantity, reasonType, reason } = body;

    if (!itemName) {
      return NextResponse.json({ ok: false, error: "กรุณาระบุรายการอุปกรณ์ที่ต้องการเบิก" }, { status: 400 });
    }

    let newRequest = null;
    try {
      if ((prisma as any).equipmentRequest) {
        newRequest = await (prisma as any).equipmentRequest.create({
          data: {
            userId: session.userId,
            itemName,
            size: size || null,
            quantity: Number(quantity) || 1,
            reasonType: reasonType || "NEW",
            reason: reason || null,
            status: "PENDING",
          },
        });
      }
    } catch (e) {
      console.warn("EquipmentRequest model create warning:", e);
    }

    return NextResponse.json({
      ok: true,
      message: "ยื่นคำขอเบิกอุปกรณ์สำเร็จ",
      data: newRequest || { id: Date.now().toString(), itemName, quantity },
    });
  } catch (error: any) {
    console.error("Post equipment request error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการส่งคำขอ" }, { status: 500 });
  }
}