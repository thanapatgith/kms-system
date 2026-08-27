"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- ฟังก์ชันจัดการเลือกเดือน ---
function getCurrentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function generateMonthOptions() {
  const options = [];
  const today = new Date();
  const monthNamesTH = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];

  // ย้อนหลัง 12 เดือน ถึง ล่วงหน้า 2 เดือน
  for (let i = -2; i <= 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const value = `${year}-${month}`;
    const label = `ประจำเดือน ${monthNamesTH[d.getMonth()]} ${year + 543}`;
    options.push({ value, label });
  }
  return options;
}

export default function CEODashboardPage() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentPeriod());
  const monthOptions = generateMonthOptions();

  // ข้อมูลสถิติและการเงินจริงจากไฟล์สรุป
  const [financials] = useState({
    totalRevenue: 1052630.8, // รายรับค่าว่าจ้างจากลูกค้า 27 ราย
    totalPayrollExpense: 904145.9, // รายจ่ายเงินเดือนพนักงานรวม
    grossProfit: 148484.9, // กำไรขั้นต้น
    grossMarginPct: 14.11,
    pendingInvoices: 168200.0, // ยอดรอเก็บเงิน (AR ค้างชำระ)
    expiringContracts: 3, // สัญญาใกล้หมดอายุใน 60 วัน
    lowMarginSites: 2, // ไซต์ที่กำไรต่ำกว่า 10% (ต้องคุม OT)
    totalEmployees: 54,
    presentToday: 51,
    absentToday: 2,
    lateToday: 1,
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
            <h1 className="text-sm font-bold">CEO Dashboard</h1>
          </div>
          <button
            onClick={() => {
              window.location.href = "/login";
            }}
            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition cursor-pointer"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-4">
        {/* การ์ดต้อนรับ */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 text-white shadow-md space-y-1 border border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                Executive Portal
              </span>
              <h2 className="text-base font-bold">สวัสดีครับ คุณอภิวรรณ 👋</h2>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-900/80 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-md px-2 py-1 focus:outline-none cursor-pointer"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-slate-300 pt-1">
            สรุปผลประกอบการ วิเคราะห์กำไร และการบริหารจัดการยุทธศาสตร์
          </p>
        </div>

        {/* 🚨 Executive Alerts (แจ้งเตือนสำคัญระดับบริหาร) */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between text-amber-700 font-bold text-xs">
            <span className="flex items-center gap-1.5">
              <span>🔔</span> การแจ้งเตือนยุทธศาสตร์
            </span>
            <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
              3 เรื่อง
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between">
              <span className="text-slate-500 text-[10px]">สัญญาใกล้หมดอายุ</span>
              <span className="font-bold text-amber-600 text-sm">{financials.expiringContracts} ลูกค้า</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-rose-200 shadow-sm flex flex-col justify-between">
              <span className="text-slate-500 text-[10px]">ไซต์กำไรต่ำกว่าเกณฑ์</span>
              <span className="font-bold text-rose-600 text-sm">{financials.lowMarginSites} ไซต์งาน</span>
            </div>
          </div>
        </div>

        {/* 1. สรุปผลประกอบการทางการเงิน (Financial P&L KPI) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <span>📈</span> ผลประกอบการและกำไร (P&L)
            </span>
            <Link href="/ceo/revenue" className="text-[10px] text-amber-600 font-bold hover:underline">
              ดูรายรับลูกค้า ›
            </Link>
          </div>

          <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-md space-y-3 border border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs text-slate-400 font-medium">กำไรขั้นต้น (Gross Profit)</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Margin {financials.grossMarginPct}%
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-400 tracking-tight">
                ฿{financials.grossProfit.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </p>
              
              {/* รายรับ vs รายจ่าย */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
                <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 block text-[10px] font-medium">💵 รายรับค่าว่าจ้าง (27 ราย)</span>
                  <span className="font-bold text-emerald-400 text-xs">
                    ฿{financials.totalRevenue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 block text-[10px] font-medium">💸 รายจ่ายเงินเดือนรวม</span>
                  <span className="font-bold text-rose-400 text-xs">
                    -฿{financials.totalPayrollExpense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* สถานะกระแสเงินสด / การวางบิล */}
            <div className="pt-2 border-t border-slate-800/60 flex justify-between items-center text-[10px]">
              <span className="text-slate-400">💵 ยอดรอเก็บเงิน/ค้างชำระ (AR):</span>
              <span className="font-bold text-amber-400">
                ฿{financials.pendingInvoices.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* 2. สถิติการเข้างานประจำวัน */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <span>📊</span> สถานะกำลังพลและการปฏิบัติงานวันนี้
          </span>

          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] text-slate-400 block font-medium">พนักงานรวม</span>
              <p className="text-base font-bold text-slate-800">{financials.totalEmployees}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] text-emerald-600 block font-medium">เข้างาน</span>
              <p className="text-base font-bold text-emerald-600">{financials.presentToday}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] text-rose-500 block font-medium">ขาด/ลา</span>
              <p className="text-base font-bold text-rose-600">{financials.absentToday}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] text-amber-600 block font-medium">สาย</span>
              <p className="text-base font-bold text-amber-600">{financials.lateToday}</p>
            </div>
          </div>
        </div>

        {/* 3. ศูนย์ควบคุมบริหารจัดการ */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-800 block">⚡ ศูนย์ควบคุมบริหารจัดการ</span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/ceo/revenue"
              className="p-3 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl font-bold text-slate-800 flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">💵</span>
                <span>ค่าว่าจ้างลูกค้า</span>
              </div>
              <span className="text-slate-400 group-hover:text-amber-600">›</span>
            </Link>

            <Link
              href="/ceo/payroll"
              className="p-3 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl font-bold text-slate-800 flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">💳</span>
                <span>รายงานเงินเดือน</span>
              </div>
              <span className="text-slate-400 group-hover:text-amber-600">›</span>
            </Link>

            {/* 🆕 เพิ่มเมนูลัด "รายชื่อพนักงาน" ตรงนี้ */}
            <Link
              href="/ceo/employees"
              className="p-3 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl font-bold text-slate-800 flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">👥</span>
                <span>รายชื่อพนักงาน</span>
              </div>
              <span className="text-slate-400 group-hover:text-amber-600">›</span>
            </Link>

            <Link
              href="/ceo/reports"
              className="p-3 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl font-bold text-slate-800 flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">📋</span>
                <span>รายงานตรวจตรา</span>
              </div>
              <span className="text-slate-400 group-hover:text-amber-600">›</span>
            </Link>

            <Link
              href="/ceo/approvals"
              className="p-3 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl font-bold text-slate-800 flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">✍️</span>
                <span>รายการอนุมัติ</span>
              </div>
              <span className="text-slate-400 group-hover:text-amber-600">›</span>
            </Link>
          </div>
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