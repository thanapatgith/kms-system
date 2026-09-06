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

  // ควบคุมการเปิด-ปิด (ซ่อน/แสดง) ตัวกรอง
  const [showFilter, setShowFilter] = useState(false);

  // Modal สำหรับซูมดูรูปภาพแบบสไลด์ซ้าย-ขวา
  const [activeImages, setActiveImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

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
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchEmployee, setSearchEmployee] = useState<string>("");

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeImages.length === 0) return;
      if (e.key === "ArrowLeft") {
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : activeImages.length - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentImageIndex((prev) => (prev < activeImages.length - 1 ? prev + 1 : 0));
      } else if (e.key === "Escape") {
        setActiveImages([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImages]);

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

  const filteredIncidents = incidents.filter((item) => {
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

    if (selectedSite !== "ALL") {
      const itemSite = item.site_name || item.siteName || item.location;
      if (itemSite !== selectedSite) return false;
    }

    if (selectedStatus !== "ALL") {
      const isAcknowledged = item.status === "ACKNOWLEDGED" || item.status === "resolved" || item.status === "เรียบร้อย";
      if (selectedStatus === "ACKNOWLEDGED" && !isAcknowledged) return false;
      if (selectedStatus === "PENDING" && isAcknowledged) return false;
    }

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

  const hasActiveFilter = fromDate || toDate || selectedSite !== "ALL" || selectedStatus !== "ALL" || searchEmployee.trim() !== "";

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

        {/* ปุ่มกดซ่อน/แสดง ตัวกรองข้อมูล */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-xs">
          <div 
            onClick={() => setShowFilter(!showFilter)}
            className="p-3.5 bg-slate-50 hover:bg-slate-100 transition flex justify-between items-center cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">🔍 ตัวกรองข้อมูลรายงาน</span>
              {hasActiveFilter && !showFilter && (
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 font-bold text-[9px] rounded-full">
                  กำลังใช้งานตัวกรองอยู่
                </span>
              )}
            </div>
            <span className="text-slate-500 font-bold text-sm">
              {showFilter ? "▲ ซ่อน" : "▼ แสดง"}
            </span>
          </div>

          {/* แผงตัวกรอง (จะซ่อนหรือแสดงตาม state showFilter) */}
          {showFilter && (
            <div className="p-3.5 border-t border-slate-100 space-y-3 animate-fadeIn">
              <div className="flex justify-between items-center pb-1">
                <span className="text-[10px] text-slate-400 font-semibold">ปรับแต่งเงื่อนไขการค้นหา</span>
                <button
                  type="button"
                  onClick={() => { setQuickDate("ALL"); setSelectedSite("ALL"); setSelectedStatus("ALL"); setSearchEmployee(""); }}
                  className="text-[10px] text-indigo-600 hover:underline font-bold cursor-pointer"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>

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
          )}
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

                    <div className="text-[11px] text-slate-600 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span>👤 ผู้รายงาน:</span>
                        <strong className="text-slate-900">{employeeName}</strong>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono font-bold text-[10px]">
                        ID: {employeeCode}
                      </span>
                    </div>

                    <div className="bg-amber-50/60 border border-amber-200/60 p-2 rounded-xl space-y-0.5">
                      <span className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                        📍 ไซต์งานที่ปฏิบัติหน้าที่:
                      </span>
                      <p className="text-xs font-bold text-slate-900 leading-snug break-words">
                        {siteName}
                      </p>
                    </div>

                    <p className="text-slate-800 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {noteText}
                    </p>

                    {images.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-semibold">
                          🖼️ รูปภาพแนบ ({images.length} รูป) (คลิกเพื่อดูภาพใหญ่):
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                          {images.map((imgUrl: string, idx: number) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setActiveImages(images);
                                setCurrentImageIndex(idx);
                              }}
                              className="block aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 hover:opacity-95 transition cursor-pointer relative group"
                            >
                              <img src={imgUrl} alt="report-img" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs">
                                🔍
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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

      {/* Modal สำหรับแสดงรูปภาพขนาดใหญ่ พร้อมปุ่มเลื่อนซ้าย-ขวา */}
      {activeImages.length > 0 && (
        <div
          onClick={() => setActiveImages([])}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="relative max-w-xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveImages([])}
              className="absolute -top-12 right-0 text-white bg-slate-800 hover:bg-slate-700 w-9 h-9 rounded-full font-bold flex items-center justify-center transition cursor-pointer shadow-lg text-sm z-50"
            >
              ✕
            </button>

            <div className="absolute -top-12 left-0 text-white bg-slate-800/80 px-3 py-1.5 rounded-full text-xs font-bold font-mono">
              รูปที่ {currentImageIndex + 1} จาก {activeImages.length}
            </div>

            <div className="relative w-full flex items-center justify-center">
              {activeImages.length > 1 && (
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : activeImages.length - 1))}
                  className="absolute left-2 z-10 bg-black/60 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition shadow-lg cursor-pointer"
                >
                  ‹
                </button>
              )}

              <img
                src={activeImages[currentImageIndex]}
                alt={`Slide ${currentImageIndex + 1}`}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-slate-700 bg-black"
              />

              {activeImages.length > 1 && (
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev < activeImages.length - 1 ? prev + 1 : 0))}
                  className="absolute right-2 z-10 bg-black/60 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition shadow-lg cursor-pointer"
                >
                  ›
                </button>
              )}
            </div>

            <p className="text-slate-300 text-[11px] mt-4 bg-slate-900/90 px-4 py-1.5 rounded-full border border-slate-700 shadow-md">
              คลิกปุ่มลูกศรซ้าย/ขวาบนภาพ หรือกดปุ่มคีย์บอร์ด ⬅ ➡ เพื่อเปลี่ยนรูป
            </p>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-40 shadow-lg max-w-md mx-auto">
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