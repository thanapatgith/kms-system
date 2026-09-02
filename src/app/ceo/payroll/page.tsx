"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PayrollItem {
  id: string;
  user_id?: string;
  employee_code?: string;
  employee_name: string;
  gender: string;
  site_name: string;
  status: string;
  work_days: number;
  gross_income: number;
  total_advance: number;
  social_security: number;
  tax_withholding: number;
  total_deductions: number;
  net_salary: number; 
  billing_period: string;
}

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

  for (let i = -2; i <= 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const value = `${year}-${month}`;
    const label = `งวด ${monthNamesTH[d.getMonth()]} ${year + 543}`;
    options.push({ value, label });
  }
  return options;
}

export default function CEOPayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentPeriod());
  const monthOptions = generateMonthOptions();

  const [searchTerm, setSearchTerm] = useState("");
  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState<PayrollItem | null>(null);

  useEffect(() => {
    async function fetchPayroll() {
      setLoading(true);
      try {
        // ใส่ cache buster &t=${Date.now()}
        const res = await fetch(`/api/ceo/payroll?period=${selectedMonth}&t=${Date.now()}`);
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) {
          setPayrolls(json.data);
        }
      } catch (err) {
        console.error("Fetch payroll error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPayroll();
  }, [selectedMonth]);

  const totalGross = payrolls.reduce((sum, item) => sum + Number(item.gross_income), 0);
  const totalDeductions = payrolls.reduce((sum, item) => sum + Number(item.total_deductions), 0);
  const totalNet = payrolls.reduce((sum, item) => sum + Number(item.net_salary), 0);

  const filtered = payrolls.filter(
    (item) =>
      item.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.site_name && item.site_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.user_id && item.user_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24 font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/ceo/dashboard" className="text-slate-400 hover:text-white transition">
              ‹
            </Link>
            <h1 className="text-sm font-bold">รายงานสรุปเงินเดือนพนักงาน</h1>
          </div>
          
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-800 text-amber-300 border border-slate-700 text-[11px] font-bold rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} {opt.value === getCurrentPeriod() ? "(เดือนปัจจุบัน)" : ""}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-4">
        {/* การ์ดสรุปงบการเงินพนักงาน */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3 border border-slate-800">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs text-slate-400 font-medium">ยอดจ่ายเงินเดือนสุทธิ (Net Payroll)</span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              พนักงาน {payrolls.length} คน
            </span>
          </div>

          <p className="text-2xl font-black text-amber-400">
            ฿{totalNet.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
            <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
              <span className="text-slate-400 block text-[10px]">รวมเงินได้ทั้งหมด</span>
              <span className="font-bold text-slate-200">
                ฿{totalGross.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
              <span className="text-slate-400 block text-[10px]">รวมรายการหัก/เงินเบิก</span>
              <span className="font-bold text-rose-400">
                -฿{totalDeductions.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* ค้นหา */}
        <input
          type="text"
          placeholder="🔍 ค้นหาชื่อ / รหัสพนักงาน (kms...) / ไซต์งาน..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />

        {/* รายการพนักงาน */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
            <span>รายชื่อพนักงาน ({filtered.length})</span>
            <span className="text-[10px] text-amber-600 font-bold">Supabase Connected</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">กำลังโหลดข้อมูลจาก Database...</div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
              {filtered.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedEmp(item)}
                  className="p-3.5 space-y-1.5 hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
  {item.employee_code || "KMS-EMP"}
</span>
                        <span className="text-xs font-bold text-slate-800">{item.employee_name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        ไซต์: {item.site_name || "สำนักงานใหญ่"} ({item.work_days} วัน)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-600 block">
                        ฿{Number(item.net_salary).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9px] text-slate-400">สุทธิ</span>
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">ไม่พบรายชื่อพนักงาน</div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal ดูรายละเอียดเงินเดือนพนักงาน */}
      {selectedEmp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                    {selectedEmp.user_id}
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 uppercase">
                    สลิปเงินเดือน (งวด: {selectedEmp.billing_period})
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{selectedEmp.employee_name}</h3>
                <p className="text-[10px] text-slate-400">หน่วยงาน: {selectedEmp.site_name}</p>
              </div>
              <button onClick={() => setSelectedEmp(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex justify-between items-center">
                <span className="font-bold text-emerald-800">เงินเดือนคงเหลือรับสุทธิ:</span>
                <span className="text-base font-black text-emerald-700">
                  ฿{Number(selectedEmp.net_salary).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-700 block text-[11px] border-b border-slate-200 pb-1">💵 รายการเงินได้</span>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">รวมเงินที่ได้รับ:</span>
                  <span className="font-bold text-slate-800">฿{Number(selectedEmp.gross_income).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-700 block text-[11px] border-b border-slate-200 pb-1">💸 รายการหัก / เงินเบิก</span>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">เงินเบิกล่วงหน้า:</span>
                  <span className="font-medium text-rose-600">฿{Number(selectedEmp.total_advance).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">ประกันสังคม:</span>
                  <span className="font-medium text-rose-600">฿{Number(selectedEmp.social_security).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">ภาษีหัก ณ ที่จ่าย:</span>
                  <span className="font-medium text-rose-600">฿{Number(selectedEmp.tax_withholding).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-700">รวมยอดหักทั้งสิ้น:</span>
                  <span className="font-bold text-rose-600">฿{Number(selectedEmp.total_deductions).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedEmp(null)}
              className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg max-w-md mx-auto">
        <Link href="/ceo/dashboard" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📊</span>แดชบอร์ด
        </Link>
        <Link href="/ceo/revenue" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">💵</span>รายรับลูกค้า
        </Link>
        <Link href="/ceo/payroll" className="flex flex-col items-center text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">💳</span>เงินเดือน
        </Link>
        <Link href="/ceo/reports" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📝</span>รายงาน
        </Link>
      </nav>
    </div>
  );
}