"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ฟังก์ชันช่วยแปลงงวดประจำเดือนให้แสดงผลเข้าใจง่าย (เช่น 1 - 31 กรกฎาคม 2569 / จ่าย 10 สิงหาคม 2569)
const formatBillingPeriod = (periodStr: string) => {
  if (!periodStr) return { workPeriod: "-", payDate: "-" };
  
  let year = 2026;
  let month = 7;

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

  const monthName = thaiMonths[month] || "กรกฎาคม";
  const thaiYear = year > 2500 ? year : year + 543; // แปลง ค.ศ. เป็น พ.ศ.

  // คำนวณวันสุดท้ายของเดือนนั้นๆ (เช่น 31)
  const lastDay = new Date(year, month, 0).getDate();

  // เดือนที่เงินออก (วันที่ 10 ของเดือนถัดไป)
  let payMonth = month + 1;
  let payYear = thaiYear;
  if (payMonth > 12) {
    payMonth = 1;
    payYear += 1;
  }
  const payMonthName = thaiMonths[payMonth] || "สิงหาคม";

  return {
    workPeriod: `1 - ${lastDay} ${monthName} ${thaiYear}`,
    payDate: `10 ${payMonthName} ${payYear}`
  };
};

export default function EmployeePayrollsPage() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState<any>(null); // สำหรับเปิด Modal ดูสลิป

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employee/payrolls");
      const data = await res.json();
      if (data.success) {
        setPayrolls(data.payrolls || []);
      }
    } catch (err) {
      console.error("Error fetching payrolls:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-orange-500 font-bold text-[10px] rounded uppercase tracking-wider">
              EMPLOYEE
            </span>
            <h1 className="text-sm font-bold">ประวัติเงินเดือน & สลิป</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800">
              📋 รายการเงินเดือนย้อนหลัง
            </h3>
            <span className="text-[10px] font-bold text-slate-400">
              พบ {payrolls.length} งวด
            </span>
          </div>

          {loading ? (
            <div className="text-center text-slate-400 py-8 text-xs animate-pulse">กำลังโหลดข้อมูล...</div>
          ) : payrolls.length === 0 ? (
            <div className="text-center text-slate-400 py-10 text-xs bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-xl block">💵</span>
              <span>ยังไม่มีข้อมูลประวัติเงินเดือนในระบบ</span>
            </div>
          ) : (
            <div className="space-y-3">
              {payrolls.map((item) => {
                const dailyWage = Number(item.daily_wage) || 0;
                const workDays = Number(item.work_days) || 0;
                const grossIncome = Number(item.gross_income) || (dailyWage * workDays);
                const totalDeductions = Number(item.total_deductions) || 0;
                const netSalary = Number(item.net_salary) || (grossIncome - totalDeductions);

                // แยกสัดส่วนค่าจ้าง 8 ชม. และ OT 4 ชม. ต่อวัน
                const baseDaily8Hrs = dailyWage > 400 ? 400 : Math.round(dailyWage * 0.77);
                const otDaily4Hrs = dailyWage - baseDaily8Hrs;

                const totalBase8Hrs = baseDaily8Hrs * workDays;
                const totalOt4Hrs = otDaily4Hrs * workDays;

                const periodInfo = formatBillingPeriod(item.billing_period);

                return (
                  <div key={item.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs shadow-sm">
                    <div className="flex justify-between items-start border-b border-slate-200/60 pb-2">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">
                          งวดประจำเดือน: {periodInfo.workPeriod}
                        </span>
                        <p className="text-[10px] text-orange-600 font-semibold mt-0.5">
                          📅 วันที่เงินออก: {periodInfo.payDate}
                        </p>
                        <p className="text-[10px] text-slate-400">หน่วยงาน: {item.site_name || "KMS"}</p>
                      </div>
                      <button
                        onClick={() => setSelectedSlip(item)}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] rounded-xl shadow transition cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <span>📄</span> ดูสลิป
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 font-mono">
                      <div>วันทำงาน: <strong className="text-slate-900">{workDays} วัน</strong></div>
                      <div>เรตรายวัน: <strong className="text-slate-900">฿{dailyWage.toLocaleString()}</strong></div>
                      
                      {/* แจกแจงค่าจ้าง 8 ชม. และ OT 4 ชม. */}
                      <div className="col-span-2 text-[10px] text-slate-500 border-t border-slate-100 pt-1.5 space-y-0.5">
                        <div className="flex justify-between">
                          <span>• ค่าจ้างปกติ (8 ชม.):</span>
                          <span className="font-semibold text-slate-700">฿{totalBase8Hrs.toLocaleString()} (฿{baseDaily8Hrs}/วัน)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• ค่าล่วงเวลา OT (4 ชม.):</span>
                          <span className="font-semibold text-orange-600">฿{totalOt4Hrs.toLocaleString()} (฿{otDaily4Hrs}/วัน)</span>
                        </div>
                      </div>

                      <div className="col-span-2 border-t border-slate-100 pt-1.5 grid grid-cols-2">
                        <div>รายได้รวม: <strong className="text-emerald-700">฿{grossIncome.toLocaleString()}</strong></div>
                        <div>ยอดรวมหัก: <strong className="text-red-600">-฿{totalDeductions.toLocaleString()}</strong></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 font-bold text-slate-900 text-xs">
                      <span>เงินสุทธิที่ได้รับ:</span>
                      <span className="text-sm font-mono text-emerald-600">฿{netSalary.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal แสดงสลิปเงินเดือนแบบละเอียด */}
      {selectedSlip && (() => {
        const periodInfo = formatBillingPeriod(selectedSlip.billing_period);
        return (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-slate-100 my-auto max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">📄 สลิปเงินเดือน (Payslip)</h3>
                  <p className="text-[11px] text-slate-800 font-semibold mt-0.5">งวดประจำเดือน: {periodInfo.workPeriod}</p>
                  <p className="text-[10px] text-orange-600 font-medium">📅 วันที่จ่ายเงิน: {periodInfo.payDate}</p>
                </div>
                <button
                  onClick={() => setSelectedSlip(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                {/* ข้อมูลพนักงาน */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ชื่อ-นามสกุล:</span>
                    <span className="font-bold text-slate-900">{selectedSlip.employee_name || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">รหัสพนักงาน:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedSlip.employee_code || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">หน่วยงาน:</span>
                    <span className="font-bold text-slate-900">{selectedSlip.site_name || "KMS"}</span>
                  </div>
                </div>

                {/* รายการรายได้ แยก OT ชัดเจน */}
                {(() => {
                  const dWage = Number(selectedSlip.daily_wage) || 0;
                  const wDays = Number(selectedSlip.work_days) || 0;
                  const b8 = dWage > 400 ? 400 : Math.round(dWage * 0.77);
                  const o4 = dWage - b8;
                  const gInc = Number(selectedSlip.gross_income) || (dWage * wDays);

                  return (
                    <div className="space-y-1.5 font-mono">
                      <p className="font-sans font-bold text-[11px] text-slate-400 uppercase tracking-wider">รายได้ (Earnings)</p>
                      <div className="flex justify-between text-slate-600">
                        <span>ค่าจ้างปกติ (8 ชม. × {wDays} วัน):</span>
                        <span>฿{(b8 * wDays).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-orange-600 font-semibold">
                        <span>ค่าล่วงเวลา OT (4 ชม. × {wDays} วัน):</span>
                        <span>+฿{(o4 * wDays).toLocaleString()}</span>
                      </div>
                      {Number(selectedSlip.holiday_pay) > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>ค่าจ้างวันหยุด:</span>
                          <span>+฿{Number(selectedSlip.holiday_pay).toLocaleString()}</span>
                        </div>
                      )}
                      {Number(selectedSlip.substitute_pay) > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>ค่าแทนเวร ({selectedSlip.substitute_days || 0} วัน):</span>
                          <span>+฿{Number(selectedSlip.substitute_pay).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-emerald-700 border-t border-slate-100 pt-1">
                        <span>รวมรายได้ทั้งสิ้น:</span>
                        <span>฿{gInc.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* รายการหัก */}
                <div className="space-y-1.5 font-mono pt-2 border-t border-slate-100">
                  <p className="font-sans font-bold text-[11px] text-slate-400 uppercase tracking-wider">รายการหัก (Deductions)</p>
                  {Number(selectedSlip.social_security) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>ประกันสังคม:</span>
                      <span>-฿{Number(selectedSlip.social_security).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(selectedSlip.tax_withholding) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>ภาษีหัก ณ ที่จ่าย:</span>
                      <span>-฿{Number(selectedSlip.tax_withholding).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(selectedSlip.total_advance) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>หักเงินเบิกสะสม/กู้ยืม:</span>
                      <span>-฿{Number(selectedSlip.total_advance).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-red-600 border-t border-slate-100 pt-1">
                    <span>รวมรายการหักทั้งสิ้น:</span>
                    <span>-฿{Number(selectedSlip.total_deductions || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* สุทธิ */}
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex justify-between items-center font-mono">
                  <span className="font-sans font-bold text-emerald-900 text-xs">เงินสุทธิรับเข้าบัญชี:</span>
                  <span className="font-black text-emerald-700 text-base">
                    ฿{(Number(selectedSlip.net_salary) || (Number(selectedSlip.gross_income) - Number(selectedSlip.total_deductions))).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedSlip(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>

            </div>
          </div>
        );
      })()}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg">
        <Link href="/employee/profile" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">👤</span>
          หน้าแรก
        </Link>
        <Link href="/employee/attendance" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">⏱️</span>
          ลงเวลาทำงาน
        </Link>
        <Link href="/employee/reports" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">🛡️</span>
          รายงาน
        </Link>
        <Link href="/employee/payrolls" className="flex flex-col items-center text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">💵</span>
          เงินเดือน
        </Link>
      </nav>
    </div>
  );
}