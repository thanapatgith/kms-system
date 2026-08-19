import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    // 1. ดึงจำนวนพนักงานทั้งหมด
    const { count: totalEmployees } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true });

    // 2. ดึงสถิติการเข้างานวันนี้จากตาราง attendance (ถ้ามี)
    const { data: todayAttendance } = await supabaseAdmin
      .from("attendance")
      .select("status")
      .gte("created_at", `${todayStr}T00:00:00`)
      .lte("created_at", `${todayStr}T23:59:59`);

    const presentToday = todayAttendance?.filter((a) => a.status === "PRESENT" || a.status === "NORMAL").length || 0;
    const lateToday = todayAttendance?.filter((a) => a.status === "LATE").length || 0;
    const absentToday = todayAttendance?.filter((a) => a.status === "ABSENT").length || 0;

    // 3. ดึงจำนวนรายงานเหตุการณ์ทั้งหมด
    const { count: totalReports } = await supabaseAdmin
      .from("random_checks")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      ok: true,
      stats: {
        totalEmployees: totalEmployees || 0,
        presentToday: presentToday || 0,
        absentToday: absentToday || 0,
        lateToday: lateToday || 0,
        totalReports: totalReports || 0,
        pendingApprovals: 0,
      },
    });
  } catch (err) {
    console.error("Fetch CEO stats error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}