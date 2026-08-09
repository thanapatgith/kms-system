import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: ดึงรายชื่อผู้ใช้ทั้งหมด
export async function GET() {
  try {
    const { data: users, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: สร้างผู้ใช้ใหม่ (HR, Sale, Design, Super Admin)
export async function POST(req: Request) {
  try {
    const { email, password, full_name, role } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกข้อมูลสำคัญให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // Hash รหัสผ่าน
    const password_hash = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          email,
          password_hash,
          full_name: full_name || email.split("@")[0],
          role,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: แก้ไข Role
export async function PATCH(req: Request) {
  try {
    const { userId, role } = await req.json();

    const { data: user, error } = await supabaseAdmin
      .from("profiles")
      .update({ role })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: ลบผู้ใช้
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ success: false, error: "ไม่พบข้อมูล ID" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}