"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface IncidentItem {
  id: string;
  title?: string;
  incident_title?: string;
  site_name?: string;
  location?: string;
  created_at?: string;
  status?: string;
  details?: string;
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

export default function CEOReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentPeriod());
  const monthOptions = generateMonthOptions();

  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [patrolCount, setPatrolCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      try {
        const res = await fetch(`/api/ceo/reports?period=${selectedMonth}&t=${Date.now()}`);
        const json = await res.json();
        if (json.ok) {
          setIncidents(json.incidents || []);
          setPatrolCount(json.patrolCount || 0);
        }
      } catch (err) {
        console.error("Fetch reports error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [selectedMonth]);

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24 font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/ceo/dashboard" className="text-slate-400 hover:text-white transition">
              ‹
            </Link>
            <h1 className="text-sm font-bold">รายงานสรุปการตรวจตรา</h1>
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
        {/* การ์ดสรุปผลการปฏิบัติงานจริงจาก Database */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3 border border-slate-800">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs text-slate-400 font-medium">ภาพรวมความปลอดภัยตามเวลาจริง</span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Live Database
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
              <span className="text-slate-400 block text-[10px]">บันทึกการตรวจตราในระบบ</span>
              <p className="text-lg font-black text-amber-400 mt-1">
                {patrolCount} <span className="text-xs font-normal text-slate-300">รายการ</span>
              </p>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
              <span className="text-slate-400 block text-[10px]">เหตุการณ์แจ้งเตือนทั้งหมด</span>
              <p className="text-lg font-black text-rose-400 mt-1">
                {incidents.length} <span className="text-xs font-normal text-slate-300">เรื่อง</span>
              </p>
            </div>
          </div>
        </div>

        {/* รายการเหตุการณ์ดึงจริงจาก Supabase */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
            <span>บันทึกเหตุการณ์และการรายงานล่าสุด ({incidents.length})</span>
            <span className="text-[10px] text-emerald-600 font-bold">Supabase Connected</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">กำลังโหลดข้อมูลจาก Database...</div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
              {incidents.map((item) => (
                <div key={item.id} className="p-3.5 space-y-1 hover:bg-slate-50 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        {item.title || item.incident_title || "รายงานการปฏิบัติงาน"}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        ไซต์: {item.site_name || item.location || "สำนักงานใหญ่"}
                        {item.created_at && ` • ${new Date(item.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.`}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                        item.status === "resolved" || item.status === "เรียบร้อย"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-amber-100 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {item.status || "บันทึกแล้ว"}
                    </span>
                  </div>
                </div>
              ))}

              {incidents.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">ยังไม่มีรายการแจ้งเหตุการณ์ในระบบ</div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg max-w-md mx-auto">
        <Link href="/ceo/dashboard" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📊</span>แดชบอร์ด
        </Link>
        <Link href="/ceo/revenue" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">💵</span>รายรับลูกค้า
        </Link>
        <Link href="/ceo/payroll" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">💳</span>เงินเดือน
        </Link>
        <Link href="/ceo/reports" className="flex flex-col items-center text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📝</span>รายงาน
        </Link>
      </nav>
    </div>
  );
}