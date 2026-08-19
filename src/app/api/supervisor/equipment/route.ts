import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const { data: requests, error } = await supabase
      .from("equipment_requests")
      .select("*")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get equipment requests error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const formatted = (requests || []).map((item: any) => ({
      id: item.id,
      createdAt: item.created_at,
      date: new Date(item.created_at).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: new Date(item.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      itemName: item.item_name || item.itemName,
      size: item.size,
      quantity: item.quantity,
      reasonType: item.reason_type || item.reasonType,
      reason: item.reason,
      status: item.status,
    }));

    return NextResponse.json({ ok: true, requests: formatted });
  } catch (error: any) {
    console.error("Get equipment API error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const body = await req.json();
    const { itemName, size, quantity, reasonType, reason } = body;

    if (!itemName) {
      return NextResponse.json({ ok: false, error: "กรุณาเลือกรายการอุปกรณ์" }, { status: 400 });
    }

    const { data: newReq, error } = await supabase
      .from("equipment_requests")
      .insert([
        {
          user_id: session.userId,
          item_name: itemName,
          size: size || "-",
          quantity: Number(quantity) || 1,
          reason_type: reasonType || "NEW",
          reason: reason || "",
          status: "PENDING",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Insert equipment error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "ยื่นคำขอเบิกอุปกรณ์สำเร็จ", data: newReq });
  } catch (error: any) {
    console.error("Post equipment API error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}