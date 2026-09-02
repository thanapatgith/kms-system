import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 1. ดึงข้อมูลโปรไฟล์ (GET)
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.userId)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ ok: false, error: "ไม่พบข้อมูลผู้ใช้งาน" }, { status: 404 });
    }

    let dailyRate = 520;
    let branchName = "หน่วยงานสังกัด KMS";

    const now = new Date();
    const currentDay = now.getDate();
    let workedDays = currentDay >= 11 ? (currentDay - 11 + 1) : 15;

    let grossIncome = 0;
    let netSalary = 0;
    let totalDeductions = 0;

    if (user.employee_code) {
      const { data: payrollData } = await supabase
        .from("payrolls")
        .select("daily_wage, work_days, gross_income, net_salary, total_deductions, site_name")
        .eq("employee_code", user.employee_code.trim())
        .maybeSingle();

      if (payrollData?.daily_wage) {
        dailyRate = Number(payrollData.daily_wage);
      }

      grossIncome = dailyRate * workedDays;
      totalDeductions = Number(payrollData?.total_deductions) || 0;
      netSalary = grossIncome - totalDeductions;

      // ให้น้ำหนักสูงสุดกับ site_name ในตาราง payrolls
      if (payrollData?.site_name) {
        branchName = payrollData.site_name;
      }
    } else {
      grossIncome = dailyRate * workedDays;
      netSalary = grossIncome - totalDeductions;
    }

    // ถ้าใน payrolls ไม่มีชื่อหน่วยงาน ให้ลองเช็กจากตาราง sites ผ่าน site_id สำรอง
    if (branchName === "หน่วยงานสังกัด KMS" && user.site_id) {
      const { data: siteData } = await supabase
        .from("sites")
        .select("site_name")
        .eq("id", user.site_id)
        .maybeSingle();

      if (siteData?.site_name) {
        branchName = siteData.site_name;
      }
    }

    let baseWage8Hrs = dailyRate > 400 ? 400 : Math.round(dailyRate * 0.77);
    let otRate = dailyRate - baseWage8Hrs;

    const userImage = user.avatar_url || user.image || null;

    return NextResponse.json({
      ok: true,
      user: {
        name: user.name || "-",
        employeeCode: user.employee_code || user.employeeCode || "-",
        phone: user.phone || "-",
        email: user.email || "",
        lineId: user.line_id || user.lineId || "",
        address: user.address || "",
        idCard: user.id_card_number || user.idCardNumber || "-",
        thop7LicenseNo: user.thop7_license_no || user.thop7LicenseNo || "ไม่มีข้อมูล",
        thop7Expire: user.thop7_expire || user.thop7Expire || null,
        age: user.age || null,
        gender: user.gender || "-",
        branch: branchName,
        dailyRate: dailyRate,
        baseWage8Hrs: baseWage8Hrs,
        otRate: otRate,
        workedDays: workedDays,
        grossIncome: grossIncome,
        netSalary: netSalary,
        totalDeductions: totalDeductions,
        image: userImage,
      },
    });
  } catch (error: any) {
    console.error("Get profile error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// 2. อัปเดตข้อมูลส่วนตัว / เปลี่ยนรหัสผ่าน / อัปโหลดรูปภาพ (PUT)
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ ok: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    const formData = await req.formData();
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const lineId = formData.get("lineId") as string;
    const address = formData.get("address") as string;
    const oldPassword = formData.get("oldPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const imageFile = formData.get("image") as any;

    const updateData: any = {
      phone: phone || null,
      email: email || null,
      line_id: lineId || null,
      address: address || null,
    };

    // ตรวจสอบและเปลี่ยนรหัสผ่าน
    if (oldPassword && typeof oldPassword === 'string' && oldPassword.trim() !== '' && newPassword) {
        const { data: currentUser, error: fetchError } = await supabase
            .from("users")
            .select("password_hash")
            .eq("id", session.userId)
            .single();

        if (fetchError || !currentUser || !currentUser.password_hash) {
            return NextResponse.json({ ok: false, error: "ไม่พบข้อมูลรหัสผ่านผู้ใช้งานในระบบ" }, { status: 404 });
        }

        const isMatch = await bcrypt.compare(oldPassword, currentUser.password_hash);
        if (!isMatch) {
            return NextResponse.json({ ok: false, error: "รหัสผ่านเดิมไม่ถูกต้อง" }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        updateData.password_hash = await bcrypt.hash(newPassword, salt);
    }

    // อัปโหลดรูปภาพใหม่
    if (imageFile && typeof imageFile === "object" && typeof imageFile.size === "number" && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `profile_${session.userId}_${Date.now()}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("attendance-images")
        .upload(fileName, buffer, { contentType: imageFile.type || "image/jpeg", upsert: true });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error("ไม่สามารถอัปโหลดรูปภาพไปยัง Storage ได้: " + uploadError.message);
      }

      if (uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from("attendance-images")
          .getPublicUrl(fileName);

        if (publicUrlData?.publicUrl) {
          updateData.avatar_url = publicUrlData.publicUrl;
        }
      }
    }

    // บันทึกลง Database
    const { error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", session.userId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ ok: true, message: "อัปเดตข้อมูลและเปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาดในการอัปเดต" }, { status: 500 });
  }
}