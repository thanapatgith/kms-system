import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// 1. GET: ดึงประวัติจากตาราง random_checks
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const checks = await (prisma as any).randomCheck.findMany({
      where: {
        userId: session.userId,
      },
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedLogs = checks.map((item: any) => ({
      id: item.id,
      userName: item.user?.name || "พนักงาน",
      details: item.details,
      siteName: item.siteName,
      images: item.images || [],
      latitude: item.latitude,
      longitude: item.longitude,
      createdAt: item.createdAt,
      createdAtFormatted: new Date(item.createdAt).toLocaleString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    return NextResponse.json({ ok: true, logs: formattedLogs });
  } catch (error: any) {
    console.error("Fetch random check error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// 2. POST: บันทึกลงตาราง random_checks
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const body = await req.json();
    const { siteName, details, latitude, longitude, images } = body;

    if (!details) {
      return NextResponse.json({ ok: false, error: "กรุณากรอกรายละเอียด" }, { status: 400 });
    }

    const newCheck = await (prisma as any).randomCheck.create({
      data: {
        userId: session.userId,
        siteName: siteName || "หน่วยงานทั่วไป",
        details: details.trim(),
        latitude: Number(latitude) || 0,
        longitude: Number(longitude) || 0,
        images: images || [],
      },
    });

    return NextResponse.json({ ok: true, data: newCheck });
  } catch (error: any) {
    console.error("Save random check error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}