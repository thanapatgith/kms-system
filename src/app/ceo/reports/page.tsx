"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface IncidentItem {
  id: string;
  title?: string;
  incident_title?: string;
  site_name?: string;
  siteName?: string;
  location?: string;
  created_at?: string;
  createdAt?: string;
  status?: string;
  details?: string;
  note?: string;
  description?: string;
  message?: string;
  images?: string[];
  photos?: string[];
  latitude?: number;
  lat?: number;
  longitude?: number;
  lng?: number;
  lon?: number;
  employee_name?: string;
  employeeName?: string;
  employee_code?: string;
  employeeCode?: string;
  user?: { name?: string; employee_code?: string; employeeCode?: string };
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

  // ตัวกรองข้อมูลเพิ่มเติม
  const getTodayString = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedSite, setSelectedSite] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL"); // ALL, PENDING, ACKNOWLEDGED
  const [searchEmployee, setSearchEmployee] = useState<string>(""); // ค้นหาชื่อหรือรหัสพนักงาน

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      try {
        const res = await fetch(`/api/ceo/reports?period=${selectedMonth}&t=${Date.now()}`);
        const json = await res.json();
        if (json.ok || json.success) {
          setIncidents(json.incidents || json.reports || []);
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

  // ดึงรายชื่อ Site งานทั้งหมดมารวมเป็น Dropdown
  const uniqueSites = useMemo(() => {
    const sitesSet = new Set<string>();
    incidents.forEach((item) => {
      const sName = item.site_name || item.siteName || item.location;
      if (sName) sitesSet.add(sName);
    });
    return Array.from(sitesSet);
  }, [incidents]);

  const setQuickDate = (type: "TODAY" | "LAST_7_DAYS" | "ALL") => {
    if (type === "TODAY") {
      const today = getTodayString();
      setFromDate(today);
      setToDate(today);
    } else if (type === "LAST_7_DAYS") {
      const today = new Date();
      const past7 = new Date();
      past7.setDate(today.getDate() - 6);
      const format = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };
      setFromDate(format(past7));
      setToDate(format(today));
    } else if (type === "ALL") {
      setFromDate("");
      setToDate("");
    }
  };

  // กรองข้อมูลตามเงื่อนไขทั้งหมด
  const filteredIncidents = incidents.filter((item) => {
    // 1. กรองตามช่วงวันที่
    const dateStr = item.created_at || item.createdAt;
    if (dateStr && (fromDate || toDate)) {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const itemLocalDate = `${year}-${month}-${day}`;

      if (fromDate && itemLocalDate < fromDate) return false;
      if (toDate && itemLocalDate > toDate) return false;
    }

    // 2. กรองตาม Site งาน
    if (selectedSite !== "ALL") {
      const itemSite = item.site_name || item.siteName || item.location;
      if (itemSite !== selectedSite) return false;
    }

    // 3. กรองตามสถานะการรับทราบ
    if (selectedStatus !== "ALL") {
      const isAcknowledged = item.status === "ACKNOWLEDGED" || item.status === "resolved" || item.status === "เรียบร้อย";
      if (selectedStatus === "ACKNOWLEDGED" && !isAcknowledged) return false;
      if (selectedStatus === "PENDING" && isAcknowledged) return false;
    }

    // 4. กรองตามชื่อหรือรหัสพนักงาน
    if (searchEmployee.trim() !== "") {
      const keyword = searchEmployee.toLowerCase();
      const empName = (item.employee_name || item.employeeName || item.user?.name || "").toLowerCase();
      const empCode = (item.employee_code || item.employeeCode || item.user?.employee_code || item.user?.employeeCode || "").toLowerCase();
      if (!empName.includes(keyword) && !empCode.includes(keyword)) {
        return false;
      }
    }

    return true;
  });

  const handleAcknowledge = async (id: string) => {
    try {
      const res = await fetch(`/api/ceo/reports/${id}/acknowledge`, { method: "POST" });
      const data = await res.json();
      if (data.success || data.ok) {
        setIncidents(incidents.map(r => r.id === id ? { ...r, status: "ACKNOWLEDGED" } : r));
      }
    } catch (err) {
      console.error("Acknowledge error:", err);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24 font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/ceo/dashboard" className="text-slate-400 hover:text-white transition text-base font-bold">
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

        {/* ชุดตัวกรองข้อมูล (Filter Section) */}
        <div className="bg-white rounded-2xl shadow-sm p-3.5 border border-slate-200 space-y-3 text-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800">🔍 ตัวกรองข้อมูลรายงาน</span>
            <button
              type="button"
              onClick={() => { setQuickDate("ALL"); setSelectedSite("ALL"); setSelectedStatus("ALL"); setSearchEmployee(""); }}
              className="text-[10px] text-indigo-600 hover:underline font-bold cursor-pointer"
            >
              ล้างตัวกรอง
            </button>
          </div>

          {/* ค้นหาตามชื่อหรือรหัสพนักงาน */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">ค้นหาชื่อ / รหัสพนักงาน:</label>
            <input
              type="text"
              placeholder="พิมพ์ชื่อ หรือ รหัสพนักงาน (เช่น kms048)"
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs"
            />
          </div>

          {/* 1. ปุ่มลัดช่วงเวลา: วันนี้ / 7 วัน / ทั้งหมด */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold">ช่วงเวลา:</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setQuickDate("TODAY")}
                className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
              >
                วันนี้
              </button>
              <button
                type="button"
                onClick={() => setQuickDate("LAST_7_DAYS")}
                className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
              >
                7 วันล่าสุด
              </button>
              <button
                type="button"
                onClick={() => setQuickDate("ALL")}
                className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
              >
                ทั้งหมด
              </button>
            </div>
          </div>

          {/* 2. จากวันที่ ... ถึง วันที่ ... */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">ตั้งแต่วันที่:</label>
              <input
                type="date"
                value={fromDate}
                onClick={(e) => e.currentTarget.showPicker?.()}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">ถึงวันที่:</label>
              <input
                type="date"
                value={toDate}
                onClick={(e) => e.currentTarget.showPicker?.()}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer text-xs"
              />
            </div>
          </div>

          {/* 3. ชื่อ site งาน / site งานทั้งหมด */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">ไซต์งาน (Site):</label>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer text-xs"
            >
              <option value="ALL">🏢 ไซต์งานทั้งหมด ({uniqueSites.length} ไซต์)</option>
              {uniqueSites.map((site, idx) => (
                <option key={idx} value={site}>
                  {site}
                </option>
              ))}
            </select>
          </div>

          {/* 4. สถานะรับทราบ: ทั้งหมด / ยังไม่ได้รับทราบ / รับทราบแล้ว */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">สถานะการรับทราบ:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer text-xs"
            >
              <option value="ALL">📌 ทั้งหมด</option>
              <option value="PENDING">⏳ ยังไม่ได้รับทราบ</option>
              <option value="ACKNOWLEDGED">✓ รับทราบแล้ว</option>
            </select>
          </div>
        </div>

        {/* รายการเหตุการณ์และการรายงานล่าสุด */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-slate-800">
              📋 บันทึกเหตุการณ์และการรายงาน ({filteredIncidents.length})
            </h3>
            <span className="text-[10px] text-emerald-600 font-bold">Supabase Connected</span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-400 text-xs bg-white rounded-2xl shadow-sm">กำลังโหลดข้อมูลจาก Database...</div>
          ) : filteredIncidents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xl block">📭</span>
              <span>ไม่พบรายงานตามเงื่อนไขตัวกรองที่เลือก</span>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIncidents.map((item) => {
                const createdAt = item.created_at || item.createdAt;
                const dateObj = createdAt ? new Date(createdAt) : new Date();
                const dateFormatted = dateObj.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
                const timeFormatted = dateObj.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.";
                
                const images = item.images || item.photos || [];
                const lat = item.latitude || item.lat;
                const lng = item.longitude || item.lng || item.lon;
                const siteName = item.site_name || item.siteName || item.location || "สำนักงานใหญ่";
                const employeeName = item.employee_name || item.employeeName || item.user?.name || "พนักงาน";
                const employeeCode = item.employee_code || item.employeeCode || item.user?.employee_code || item.user?.employeeCode || "-";
                const noteText = item.note || item.description || item.message || item.details || item.title || item.incident_title || "รายงานการปฏิบัติงาน";

                return (
                  <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5 text-xs">
                    
                    {/* ส่วนหัวของการ์ด: วันที่/เวลา และสถานะ */}
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px]">
                          🗓️ {dateFormatted}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md font-bold text-[10px]">
                          ⏰ {timeFormatted}
                        </span>
                      </div>
                      
                      <div>
                        {item.status === "ACKNOWLEDGED" || item.status === "resolved" || item.status === "เรียบร้อย" ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                            ✓ รับทราบแล้ว
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAcknowledge(item.id)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold text-[10px] shadow-sm transition cursor-pointer"
                          >
                            ⏳ กดรับทราบ
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ข้อมูลผู้ปฏิบัติงาน (พร้อมรหัสพนักงาน) */}
                    <div className="text-[11px] text-slate-600 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span>👤 ผู้รายงาน:</span>
                        <strong className="text-slate-900">{employeeName}</strong>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono font-bold text-[10px]">
                        ID: {employeeCode}
                      </span>
                    </div>

                    {/* ข้อมูลไซต์งาน (รองรับชื่อยาวๆ) */}
                    <div className="bg-amber-50/60 border border-amber-200/60 p-2 rounded-xl space-y-0.5">
                      <span className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                        📍 ไซต์งานที่ปฏิบัติหน้าที่:
                      </span>
                      <p className="text-xs font-bold text-slate-900 leading-snug break-words">
                        {siteName}
                      </p>
                    </div>

                    {/* ข้อความรายงาน */}
                    <p className="text-slate-800 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {noteText}
                    </p>

                    {/* รูปภาพแนบ (ถ้ามี) */}
                    {images.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-semibold">
                          🖼️ รูปภาพแนบ ({images.length} รูป):
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                          {images.map((imgUrl: string, idx: number) => (
                            <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 hover:opacity-90 transition">
                              <img src={imgUrl} alt="report-img" className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* พิกัด GPS (ถ้ามี) */}
                    {lat && lng && (
                      <div className="pt-1 flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <span>📍 พิกัด: {lat}, {lng}</span>
                      </div>
                    )}

                  </div>
                );
              })}
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