import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const clientId = decoded.clientId || decoded.id;
    const invoiceId = params.id;

    // ตรวจสอบว่าใบแจ้งหนี้เป็นของลูกค้านี้จริงไหม
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, clientId: clientId },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: "ไม่พบใบแจ้งหนี้ในระบบ" }, { status: 404 });
    }

    const formData = await req.formData();
    const file: File | null = formData.get("slip") as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "กรุณาแนบไฟล์สลิป" }, { status: 400 });
    }

    // บันทึกไฟล์ลงในโฟลเดอร์ public/uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `slip-${invoiceId}-${Date.now()}${path.extname(file.name)}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);
    const slipUrl = `/uploads/${filename}`;

    // อัปเดตสถานะใบแจ้งหนี้เป็นรอตรวจสอบ (PENDING_REVIEW) และบันทึก URL สลิป
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        slipUrl: slipUrl,
        status: "PENDING_REVIEW",
      },
    });

    return NextResponse.json({ success: true, slipUrl });
  } catch (err) {
    console.error("Upload Slip Error:", err);
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการอัปโหลด" }, { status: 500 });
  }
}