"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import EmployeeBottomNav from "@/components/EmployeeBottomNav";

const formatBillingPeriod = (periodStr: string) => {
  if (!periodStr) return { workPeriod: "-", payDate: "-", monthKey: "", monthName: "กันยายน", thaiYear: 2569 };
  
  let year = 2026;
  let month = 9;

  if (periodStr.includes("/")) {
    const parts = periodStr.split("/");
    if (parts.length === 3) {
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }
  } else if (periodStr.includes("-")) {
    const parts = periodStr.split("-");
    if (parts.length >= 2) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
    }
  }

  const thaiMonths = [
    "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const monthName = thaiMonths[month] || "กันยายน";
  const thaiYear = year > 2500 ? year : year + 543;
  const lastDay = new Date(year, month, 0).getDate();

  let payMonth = month + 1;
  let payYear = thaiYear;
  if (payMonth > 12) {
    payMonth = 1;
    payYear += 1;
  }
  const payMonthName = thaiMonths[payMonth] || "ตุลาคม";
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;

  return {
    workPeriod: `1 - ${lastDay} ${monthName} ${thaiYear}`,
    payDate: `10 ${payMonthName} ${payYear}`,
    monthKey,
    monthName,
    thaiYear
  };
};

export default function EmployeePayrollsPage() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-09");

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employee/payrolls");
      const data = await res.json();
      if (data.success && data.payrolls) {
        setPayrolls(data.payrolls);
      }
    } catch (err) {
      console.error("Error fetching payrolls:", err);
    } finally {
      setLoading(false);
    }
  };

  const defaultMonths = [
    { key: "2026-09", name: "กันยายน 2569" },
    { key: "2026-08", name: "สิงหาคม 2569" },
    { key: "2026-07", name: "กรกฎาคม 2569" },
    { key: "2026-06", name: "มิถุนายน 2569" },
  ];

  const filteredPayrolls = payrolls.filter((item) => {
    if (!selectedMonth) return true;
    const periodInfo = formatBillingPeriod(item.billing_period);
    return periodInfo.monthKey === selectedMonth;
  });

  const todayFormatted = new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-orange-500 font-bold text-[10px] rounded uppercase tracking-wider">
              EMPLOYEE
            </span>
            <h1 className="text-sm font-bold">ใบแจ้งเงินเดือน (Payslip)</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-3">
        
        {/* แถบแสดงสถานะรอบปัจจุบัน */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] text-orange-400 font-bold tracking-wider uppercase">รอบปัจจุบัน (กันยายน 2569)</div>
            <div className="text-xs font-bold">อัปเดตยอดสะสมถึงวันที่: {todayFormatted}</div>
          </div>
          <span className="text-xl">📊</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-3">
          
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-slate-800">
              📋 เลือกงวดประจำเดือน
            </h3>
            
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              {defaultMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center text-slate-400 py-8 text-xs animate-pulse">กำลังโหลดข้อมูล...</div>
          ) : filteredPayrolls.length === 0 ? (
            <div className="text-center text-slate-400 py-10 text-xs bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-xl block">💵</span>
              <span>ยังไม่มีข้อมูลเงินเดือนในงวดเดือนนี้ (อยู่ในระหว่างปฏิบัติงานและสะสมวันทำงาน)</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayrolls.map((item) => {
                const dailyWage = Number(item.daily_wage) || 0;
                const workDays = Number(item.work_days) || 0;
                const grossIncome = Number(item.gross_income) || (dailyWage * workDays);
                
                const base8 = 400 * workDays;
                const otTotal = grossIncome - base8 > 0 ? grossIncome - base8 : 0;
                
                const taxVal = Number(item.tax_withholding) || 0;
                const ssoVal = Number(item.social_security) || 0;
                const advanceVal = Number(item.total_advance) || 0;
                const transferFee = 100; // ค่าธรรมเนียมโอนเงินถาวร
                const totalDed = taxVal + ssoVal + advanceVal + transferFee;
                const netPay = grossIncome - totalDed;

                const periodInfo = formatBillingPeriod(item.billing_period);

                return (
                  <div key={item.id} className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm text-xs font-mono">
                    
                    {/* หัวสลิป */}
                    <div className="bg-slate-900 text-white p-3 space-y-0.5">
                      <div className="font-sans font-bold text-xs text-orange-400">บริษัท รักษาความปลอดภัย เคเอ็ม การ์ด แอนด์ ซัพพลาย กรุ๊ป จำกัด</div>
                      <div className="text-[11px] font-sans font-semibold text-slate-200">งวดประจำเดือน: {periodInfo.workPeriod}</div>
                      <div className="text-[10px] text-slate-400 font-sans">📅 วันที่จ่ายเงิน: {periodInfo.payDate} | หน่วยงาน: {item.site_name || "KMS"}</div>
                    </div>

                    {/* ข้อมูลพนักงาน */}
                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 grid grid-cols-2 gap-1 text-[11px] text-slate-600 font-sans">
                      <div>ชื่อ-นามสกุล: <strong className="text-slate-900">{item.employee_name || "-"}</strong></div>
                      <div>รหัสพนักงาน: <strong className="text-slate-900">{item.employee_code || "-"}</strong></div>
                    </div>

                    {/* ตารางแบ่ง 2 ฝั่ง รายได้ | รายการหัก */}
                    <div className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200">
                      
                      {/* ฝั่งรายได้ (Earnings) */}
                      <div className="p-3 space-y-2">
                        <div className="font-sans font-bold text-[11px] text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                          รายได้ (Earnings)
                        </div>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex justify-between text-slate-600">
                            <span>ค่าจ้างพื้นฐาน ({workDays} วัน):</span>
                            <span>฿{base8.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-orange-600 font-semibold">
                            <span>ค่าล่วงเวลา (OT):</span>
                            <span>+฿{otTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* ฝั่งรายการหัก (Deductions) */}
                      <div className="p-3 space-y-2">
                        <div className="font-sans font-bold text-[11px] text-red-800 bg-red-50 px-2 py-1 rounded border border-red-100">
                          รายการหัก (Deductions)
                        </div>
                        <div className="space-y-1.5 text-[11px] text-red-600">
                          <div className="flex justify-between">
                            <span>ภาษีหัก ณ ที่จ่าย:</span>
                            <span>-฿{taxVal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ประกันสังคม:</span>
                            <span>-฿{ssoVal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>หักเบิกเงินล่วงหน้า:</span>
                            <span>-฿{advanceVal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ค่าธรรมเนียมโอน:</span>
                            <span>-฿{transferFee.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* สรุปยอดรวม */}
                    <div className="p-3 bg-slate-50 space-y-2">
                      <div className="flex justify-between text-[11px] text-slate-600 font-sans border-b border-slate-200 pb-1.5">
                        <span>รวมรายได้ทั้งสิ้น: <strong className="text-emerald-700 font-mono">฿{grossIncome.toLocaleString()}</strong></span>
                        <span>รวมรายการหักทั้งสิ้น: <strong className="text-red-600 font-mono">-฿{totalDed.toLocaleString()}</strong></span>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex justify-between items-center">
                        <span className="font-sans font-bold text-emerald-900 text-xs">เงินรับสุทธิ (Net Pay):</span>
                        <span className="font-black text-emerald-700 text-base font-mono">
                          ฿{netPay.toLocaleString()}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <EmployeeBottomNav />
    </div>
  );
}