"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ฟังก์ชันสร้างตัวเลือกเดือนย้อนหลัง
function generateMonthOptions() {
  const options = [];
  const today = new Date();
  const monthNamesTH = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const value = `${year}-${month}`;
    const label = `${monthNamesTH[d.getMonth()]} ${year + 543}`;
    options.push({ value, label, monthNum: d.getMonth() + 1, year });
  }
  return options;
}

export default function CEOEmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const monthOptions = generateMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

  useEffect(() => {
    fetchEmployeesData();
  }, [selectedMonth]);

  const fetchEmployeesData = async () => {
    try {
      setLoading(true);

      const [yearStr, monthStr] = selectedMonth.split("-");
      const targetMonthNum = parseInt(monthStr, 10);
      const targetYearBE = parseInt(yearStr, 10) + 543;

      // 1. ดึงข้อมูลพนักงานจากตาราง users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("name", { ascending: true });

      if (usersError) throw usersError;

      // 2. ดึงข้อมูล payrolls ทั้งหมดในระบบ (เพื่อใช้เทียบเดือนที่เลือกและหาเดือนล่าสุดสำรอง)
      const { data: payrollsData } = await supabase
        .from("payrolls")
        .select("employee_code, daily_wage, site_name, total_advance, net_salary, work_days, billing_period");

      // 3. ดึงข้อมูลคำขอกู้ยืม/เบิกเงินล่วงหน้า
      const { data: loansData } = await supabase
        .from("loan_requests")
        .select("employee_code, requested_amount, status");

      // จับคู่ข้อมูลจริงเข้าด้วยกัน
      const combined = (usersData || []).map((user) => {
        const code = (user.employee_code || "").trim();
        
        // กรอง payroll ของพนักงานคนนี้ทั้งหมด
        const empPayrolls = (payrollsData || []).filter(
          (p) => (p.employee_code || "").trim() === code
        );

        // หา payroll ของเดือนที่เลือกตรงๆ
        let matchedPayroll = empPayrolls.find((p) => {
          const bp = String(p.billing_period || "");
          return bp.includes(monthStr) || bp.includes(String(targetMonthNum)) || bp.includes(String(targetYearBE));
        });

        // ⭐ ถ้าเดือนที่ดึง "ไม่มีข้อมูล" ให้ใช้ข้อมูลของงวดล่าสุดที่มีในระบบแทน (Fallback อ้างอิงเดือนก่อนหน้า)
        if (!matchedPayroll && empPayrolls.length > 0) {
          // สมมติให้เลือกรายการล่าสุด (หรือรายการแรกที่เจอ) มาเป็นตัวอ้างอิงชั่วคราว
          matchedPayroll = empPayrolls[empPayrolls.length - 1];
        }

        // ยอดกู้/เบิก
        const empLoans = (loansData || []).filter(
          (l) => (l.employee_code || "").trim() === code && l.status === "APPROVED"
        );
        const totalLoanAmount = empLoans.reduce((sum, l) => sum + (Number(l.requested_amount) || 0), 0);
        const payrollAdvance = matchedPayroll ? Number(matchedPayroll.total_advance) || 0 : 0;
        const finalLoan = totalLoanAmount > 0 ? totalLoanAmount : payrollAdvance;

        // หน่วยงานและเรตค่าจ้าง (ถ้าไม่มีข้อมูลเดือนนี้ จะดึงจากเดือนก่อนหน้าหรือข้อมูลหลักมาแสดง)
        const actualSite = matchedPayroll?.site_name || user.branch || user.site_name || "KMS หน่วยงานหลัก";
        const dailyWage = matchedPayroll?.daily_wage || user.wage || user.daily_wage || 520;
        const workDays = matchedPayroll ? (matchedPayroll.work_days || 0) : "-";

        return {
          ...user,
          actualSite,
          dailyWage,
          workDays,
          totalLoan: finalLoan,
          isUsingFallback: !empPayrolls.find((p) => {
            const bp = String(p.billing_period || "");
            return bp.includes(monthStr) || bp.includes(String(targetMonthNum)) || bp.includes(String(targetYearBE));
          })
        };
      });

      setEmployees(combined);
    } catch (err) {
      console.error("Error fetching employees data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const name = emp.name || "";
    const code = emp.employee_code || "";
    const site = emp.actualSite || "";
    const query = searchQuery.toLowerCase();
    return (
      name.toLowerCase().includes(query) ||
      code.toLowerCase().includes(query) ||
      site.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24 font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-500 font-bold text-[10px] rounded text-slate-950 uppercase tracking-wider">
              EXECUTIVE
            </span>
            <h1 className="text-sm font-bold">ทำเนียบพนักงาน</h1>
          </div>
          <Link
            href="/ceo/dashboard"
            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
          >
            กลับแดชบอร์ด
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-3">
        {/* แผงตัวกรอง */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <span>📅</span> งวดประจำเดือน:
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 text-slate-900 border border-slate-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer shadow-sm"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="🔍 ค้นหาตามชื่อ, รหัสพนักงาน, หรือหน่วยงาน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500"
          />

          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100">
            <span>*(หากเดือนนี้ยังไม่อัปเดต จะอ้างอิงข้อมูลล่าสุดให้)*</span>
            <span className="font-bold text-slate-700">พบทั้งหมด {filteredEmployees.length} คน</span>
          </div>
        </div>

        {/* รายชื่อพนักงาน */}
        <div className="space-y-2.5">
          {loading ? (
            <div className="text-center text-slate-400 py-10 text-xs animate-pulse">กำลังโหลดข้อมูลประจำเดือน...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center text-slate-400 py-10 text-xs bg-white rounded-2xl border border-slate-200">
              ไม่พบข้อมูลพนักงาน
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div key={emp.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{emp.name || "ไม่ระบุชื่อ"}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">รหัสพนักงาน: {emp.employee_code || "-"}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] rounded-full">
                    {emp.role || "EMPLOYEE"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>เรตค่าจ้าง: <strong className="text-slate-900">฿{Number(emp.dailyWage || 0).toLocaleString()}</strong></div>
                  <div>ยอดกู้/เบิก: <strong className={emp.totalLoan > 0 ? "text-rose-600" : "text-slate-500"}>
                    {emp.totalLoan > 0 ? `฿${emp.totalLoan.toLocaleString()}` : "ไม่มี"}
                  </strong></div>
                  
                  <div className="col-span-2 pt-1 border-t border-slate-200/60 font-sans text-slate-700 flex justify-between items-center">
                    <span>
                      🏢 หน่วยงาน: <strong className="text-slate-900">{emp.actualSite}</strong>
                      {emp.isUsingFallback && <span className="text-[9px] text-amber-600 ml-1 font-normal">(อ้างอิงข้อมูลล่าสุด)</span>}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ทำงาน: {emp.workDays} วัน</span>
                  </div>

                  <div className="col-span-2 text-slate-500 font-sans border-t border-slate-200/40 pt-1">
                    📞 เบอร์โทร: <span className="text-slate-800">{emp.phone || "-"}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg max-w-md mx-auto">
        <Link href="/ceo/dashboard" className="flex flex-col items-center text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📊</span>แดชบอร์ด
        </Link>
        <Link href="/ceo/revenue" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">💵</span>รายรับลูกค้า
        </Link>
        <Link href="/ceo/payroll" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">💳</span>เงินเดือน
        </Link>
        <Link href="/ceo/reports" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📝</span>รายงาน
        </Link>
      </nav>
    </div>
  );
}