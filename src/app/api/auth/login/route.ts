import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = (body.email || body.username || "").toString().trim().toLowerCase();
    const password = (body.password || "").toString().trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "กรุณากรอก Username หรือ รหัสพนักงาน และ Password ให้ครบถ้วน" },
        { status: 400 }
      );
    }

    let user: any = null;

    // -------------------------------------------------------------
    // STEP 1: ค้นหาในตาราง "users"
    // -------------------------------------------------------------
    
    // 1. ลองค้นหาด้วย username
    const { data: userByUsername, error: errUsername } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("username", identifier)
      .maybeSingle();

    if (errUsername) {
      console.error("❌ Supabase Username Query Error:", errUsername);
    }

    if (userByUsername) {
      user = userByUsername;
    }

    // 2. ถ้าหาด้วย username ไม่เจอ ให้ลองค้นหาด้วย employee_code
    if (!user) {
      const { data: userByEmpCode, error: errEmp } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("employee_code", identifier)
        .maybeSingle();

      if (errEmp) {
        console.error("❌ Supabase Employee Code Query Error:", errEmp);
      }

      if (userByEmpCode) {
        user = userByEmpCode;
      }
    }

    // 3. ถ้ายังไม่เจอ และผู้ใช้พิมพ์อีเมลมา (มี @) ให้ค้นหาด้วย email
    if (!user && identifier.includes("@")) {
      const { data: userByEmail, error: errEmail } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("email", identifier)
        .maybeSingle();

      if (errEmail) {
        console.error("❌ Supabase Email Query Error:", errEmail);
      }

      if (userByEmail) {
        user = userByEmail;
      }
    }

    // ถ้าไม่พบบัญชีผู้ใช้ในตาราง users
    if (!user) {
      console.log("❌ Account not found for input:", identifier);
      return NextResponse.json(
        { error: "ไม่พบบัญชีผู้ใช้งานในระบบ" },
        { status: 401 }
      );
    }

    // -------------------------------------------------------------
    // STEP 2: ตรวจสอบรหัสผ่าน
    // -------------------------------------------------------------
    const storedHash = (user.password_hash || user.passwordHash || "").trim();

    if (!storedHash) {
      console.log("❌ No password hash stored for user:", identifier);
      return NextResponse.json(
        { error: "รหัสผ่านผู้ใช้งานยังไม่ได้ถูกตั้งค่า" },
        { status: 401 }
      );
    }

    let isPasswordValid = false;

    // เช็กด้วย Bcrypt กรณีถูก Hash มาแล้ว
    if (storedHash.startsWith("$2")) {
      try {
        isPasswordValid = await bcrypt.compare(password, storedHash);
      } catch (e) {
        console.error("❌ Bcrypt compare error:", e);
      }
    }

    // เช็กแบบ Plaintext (กรณีใส่เป็นรหัสสด) แล้ว Auto-Hash ให้ทันที
    if (!isPasswordValid && storedHash === password) {
      isPasswordValid = true;
      const newHash = await bcrypt.hash(password, 10);

      await supabaseAdmin
        .from("users")
        .update({ password_hash: newHash })
        .eq("id", user.id);
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Username หรือ รหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // -------------------------------------------------------------
    // STEP 3: สร้าง Session & ตั้งค่า Cookie
    // -------------------------------------------------------------
    const displayName = user.name || user.full_name || user.first_name || user.username || "User";

    const userDataPayload = {
      id: user.id,
      username: user.username || user.employee_code,
      role: user.role || "EMPLOYEE",
      name: displayName,
    };

    const response = NextResponse.json({
      ok: true,
      user: userDataPayload,
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 วัน
    };

    response.cookies.set("admin_session", JSON.stringify(userDataPayload), cookieOptions);
    response.cookies.set("token", JSON.stringify(userDataPayload), cookieOptions);

    return response;

  } catch (err) {
    console.error("🔥 Login API Error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}