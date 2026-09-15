import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }

    // 1. ดึงข้อมูลผู้ใช้งานจากตาราง users
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.userId)
      .single();

    if (userError || !user || !user.employee_code) {
      return NextResponse.json({ success: true, payrolls: [] });
    }

    const empCode = user.employee_code.trim();

    // 2. ดึงประวัติเงินเดือนจากตาราง payrolls เรียงตามงวดล่าสุด
    let { data: payrolls, error: payrollError } = await supabase
      .from("payrolls")
      .select("*")
      .eq("employee_code", empCode)
      .order("created_at", { ascending: false });

    if (payrollError) {
      throw payrollError;
    }

    // 3. เช็กประวัติย้อนหลังอัตโนมัติ (Auto-detect จากเดือนก่อนหน้า)
    let hasSocialSecurityHistory = false;
    let hasTaxHistory = false;
    let baseDaily8Hrs = 400;
    let otDaily4Hrs = 120;

    if (payrolls && payrolls.length > 0) {
      const latest = payrolls[0];
      if (Number(latest.social_security) > 0) {
        hasSocialSecurityHistory = true;
      }
      if (Number(latest.tax_withholding) > 0) {
        hasTaxHistory = true;
      }

      const rawDaily = Number(latest.daily_wage) || 520;
      baseDaily8Hrs = rawDaily > 400 ? 400 : Math.round(rawDaily * 0.77);
      otDaily4Hrs = rawDaily - baseDaily8Hrs;
    }

    // 4. ดึงยอดเบิกเงินล่วงหน้าจริงจากตาราง loan_requests (ถ้าไม่มีจะได้ 0)
    const { data: loansData } = await supabase
      .from("loan_requests")
      .select("amount, status")
      .eq("user_id", session.userId)
      .neq("status", "REJECTED");

    const totalAdvancedLoans = (loansData || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // 5. ตรวจสอบรอบปัจจุบัน (เช่น กันยายน 2026 -> "2026-09") ว่ามีใน payrolls หรือยัง
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    const hasCurrentMonth = (payrolls || []).some(p => {
      if (!p.billing_period) return false;
      return p.billing_period.includes(currentMonthKey) || p.billing_period.includes(`${currentMonth}/${currentYear}`);
    });

    // 6. ถ้ายังไม่มี ให้คำนวณงวดปัจจุบัน (Auto-calculate)
    if (!hasCurrentMonth) {
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      const workDays = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      const grossIncome = (baseDaily8Hrs + otDaily4Hrs) * workDays;

      const socialSecurity = hasSocialSecurityHistory ? Math.round(grossIncome * 0.05) : 0;
      const taxWithholding = hasTaxHistory ? Math.round(grossIncome * 0.03) : 0;
      
      const transferFee = 100; // ค่าธรรมเนียมโอนเงินถาวร
      
      // รวมยอดหักทั้งหมด: ภาษี + ประกันสังคม + ยอดเบิกจริง + ค่าธรรมเนียมโอน
      const totalDeductions = socialSecurity + taxWithholding + totalAdvancedLoans + transferFee;
      const netSalary = grossIncome - totalDeductions;

      let siteName = "KMS";
      if (user.site_id) {
        const { data: siteData } = await supabase
          .from("sites")
          .select("site_name")
          .eq("id", user.site_id)
          .maybeSingle();
        if (siteData?.site_name) siteName = siteData.site_name;
      }

      const liveCurrentPayroll = {
        id: "auto-live-current",
        employee_code: empCode,
        employee_name: user.name || "-",
        billing_period: currentMonthKey,
        daily_wage: baseDaily8Hrs + otDaily4Hrs,
        work_days: workDays,
        gross_income: grossIncome,
        social_security: socialSecurity,
        tax_withholding: taxWithholding,
        total_advance: totalAdvancedLoans, // บันทึกเฉพาะยอดเบิกจริง (ถ้ายังไม่เบิกจะเป็น 0)
        total_deductions: totalDeductions,
        net_salary: netSalary,
        site_name: siteName,
        is_live: true
      };

      payrolls = [liveCurrentPayroll, ...(payrolls || [])];
    }

    return NextResponse.json({
      success: true,
      payrolls: payrolls || [],
    });
  } catch (err: any) {
    console.error("Fetch employee payrolls error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}