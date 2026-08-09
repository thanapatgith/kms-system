import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: ดึงรายการใบลาทั้งหมดสำหรับ Admin
export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
    }

    // เรียกใช้แบบรองรับทั้ง leaveRequest และ leave_requests
    const dbModel = (prisma as any).leaveRequest || (prisma as any).leave_requests;
    
    if (!dbModel) {
      return NextResponse.json({ requests: [] }, { status: 200 });
    }

    const requests = await dbModel.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch admin leaves error:", error);
    return NextResponse.json({ requests: [] }, { status: 200 });
  }
}

// PATCH: อัปเดตสถานะ (อนุมัติ / ปฏิเสธ)
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
    }

    const { leaveId, status } = await request.json();

    if (!leaveId || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const dbModel = (prisma as any).leaveRequest || (prisma as any).leave_requests;

    const updatedLeave = await dbModel.update({
      where: { id: leaveId },
      data: { status },
    });

    return NextResponse.json({ success: true, updatedLeave }, { status: 200 });
  } catch (error: any) {
    console.error("Update leave status error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" }, { status: 500 });
  }
}