import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import sharp from "sharp"; // ⭐ นำเข้า sharp สำหรับบีบอัดรูปโปรไฟล์

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    let dailyRate = 540; // ค่าเริ่มต้นมาตรฐาน
    let baseWage8Hrs = 400; 
    let otRate4Hrs = 140; 
    let branchName = "ยังไม่ระบุหน่วยงาน";

    const siteId = user.site_id || user.siteId;
    if (siteId) {
      try {
        const siteData = await (prisma as any).site?.findUnique({
          where: { id: String(siteId) },
          select: { siteName: true },
        }) || await (prisma as any).sites?.findUnique({
          where: { id: String(siteId) },
          select: { site_name: true },
        });

        if (siteData) {
          branchName = siteData.siteName || siteData.site_name || "ยังไม่ระบุหน่วยงาน";
        } else {
          const rawSite: any = await prisma.$queryRaw`SELECT site_name FROM sites WHERE id::text = ${String(siteId)} LIMIT 1`;
          if (rawSite && rawSite.length > 0 && rawSite[0].site_name) {
            branchName = rawSite[0].site_name;
          }
        }
      } catch (dbErr) {
        console.error("Fetch site error:", dbErr);
      }
    }

    // สร้างค่าปีและเดือนปัจจุบันแบบ Dynamic
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentBillingPeriod = `${currentYear}-${currentMonth}`;
    const currentDay = now.getDate();

    let workedDays = 20;
    let grossIncome = 0;
    let netSalary = 0;
    let totalDeductions = 0;

    if (user.employee_code) {
      // ดึงข้อมูล payroll เฉพาะของรอบเดือนปัจจุบัน
      const { data: payrollData } = await supabase
        .from("payrolls")
        .select("wage, overtime_pay, daily_wage, gross_income, net_salary, total_deductions, site_name, work_days, billing_period")
        .eq("employee_code", user.employee_code.trim())
        .or(`billing_period.eq.${currentBillingPeriod},billing_period.eq.2026-10,billing_period.eq.2026-09`)
        .maybeSingle();

      if (payrollData) {
        const dbDailyWage = Number(payrollData.daily_wage) || 540;
        dailyRate = dbDailyWage;

        // กำหนดวันทำงานตามรอบ (รอบวันที่ 20 คิดจาก 10 วัน, รอบวันที่ 30 คิดจาก 20 วัน)
        if (payrollData.work_days) {
          workedDays = Number(payrollData.work_days);
        } else {
          workedDays = (currentDay >= 1 && currentDay <= 20) ? 10 : 20;
        }

        totalDeductions = Number(payrollData.total_deductions) || 0;

        if (branchName === "ยังไม่ระบุหน่วยงาน" && payrollData?.site_name && payrollData.site_name !== "หน่วยงานสังกัด KMS") {
          branchName = payrollData.site_name;
        }
      } else {
        workedDays = (currentDay >= 1 && currentDay <= 20) ? 10 : 20;
      }
    } else {
      workedDays = (currentDay >= 1 && currentDay <= 20) ? 10 : 20;
    }

    grossIncome = dailyRate * workedDays;
    netSalary = grossIncome - totalDeductions;

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
        otRate: otRate4Hrs,
        workedDays: workedDays,
        grossIncome: grossIncome,
        netSalary: netSalary,
        totalDeductions: totalDeductions,
        image: userImage,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: any) {
    console.error("Get profile error:", error);
    return NextResponse.json({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

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

    if (imageFile && typeof imageFile === "object" && typeof imageFile.size === "number" && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const originalBuffer = Buffer.from(bytes);
      const fileName = `profile_${session.userId}_${Date.now()}.jpg`;

      // ⭐ บีบอัดและย่อขนาดรูปโปรไฟล์ด้วย Sharp (จำกัดความกว้าง 600px พอดีสำหรับรูปโปรไฟล์)
      const compressedBuffer = await sharp(originalBuffer)
        .resize({ width: 600, withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("attendance-images")
        .upload(fileName, compressedBuffer, { contentType: "image/jpeg", upsert: true });

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