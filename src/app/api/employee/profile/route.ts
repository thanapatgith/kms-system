import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

    // แปลงฟอร์แมตข้อมูลส่งกลับไปที่หน้า Frontend
    return NextResponse.json({
      ok: true,
      user: {
        ...user,
        branch: user.site?.siteName || "ยังไม่ระบุหน่วยงาน",
        idCard: user.idCardNumber || "-",
        guardLicense: user.thop7LicenseNo || "ยังไม่มีข้อมูลเลขใบอนุญาต",
      },
    });
  } catch (error: any) {
    console.error("Get profile error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}