import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // อัปเดตสถานะรายงานในตาราง incident_reports เป็น ACKNOWLEDGED
    const updatedReport = await prisma.incidentReport.update({
      where: { id },
      data: { status: "ACKNOWLEDGED" },
    });

    return NextResponse.json({ success: true, report: updatedReport });
  } catch (error: any) {
    console.error("Acknowledge Report Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}