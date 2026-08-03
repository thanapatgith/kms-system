import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. ดึงข้อมูลพนักงานรายคน (GET)
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "ไม่พบข้อมูลพนักงาน" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, user });
  } catch (error: any) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}

// 2. อัปเดตข้อมูลพนักงาน (PUT)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { name, username, employeeCode, role, phone, idCardNumber } = await req.json();

    if (!username || !name) {
      return NextResponse.json(
        { ok: false, error: "กรุณากรอกชื่อและ Username ให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // อัปเดตข้อมูลลงฐานข้อมูล
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        username,
        employeeCode: employeeCode || null,
        role: role || "EMPLOYEE",
        phone: phone || null,
        idCardNumber: idCardNumber || null,
      },
    });

    return NextResponse.json({ ok: true, user: updatedUser });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" },
      { status: 500 }
    );
  }
}