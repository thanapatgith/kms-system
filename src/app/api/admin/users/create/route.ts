import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { name, username, password, employeeCode, role, phone, idCardNumber } = await req.json();

    if (!username || !password || !name) {
      return NextResponse.json(
        { ok: false, error: "กรุณากรอกข้อมูลสำคัญ (ชื่อ, Username, รหัสผ่าน) ให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามี Username นี้ในระบบหรือยัง
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: "Username นี้ถูกใช้งานในระบบแล้ว" },
        { status: 400 }
      );
    }

    // Hash รหัสผ่านด้วย bcrypt
    const passwordHash = await bcrypt.hash(password, 12);

    // บันทึกลงตาราง user ผ่าน Prisma
    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        passwordHash,
        employeeCode: employeeCode || null,
        role: role || "EMPLOYEE",
        phone: phone || null,
        idCardNumber: idCardNumber || null,
      },
    });

    return NextResponse.json({ ok: true, user: newUser });
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" },
      { status: 500 }
    );
  }
}