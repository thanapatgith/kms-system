"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function EmployeeReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันหา วันที่ปัจจุบัน ในรูปแบบ YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // ตั้งค่าเริ่มต้นของช่วงวันที่ เป็นวันที่ปัจจุบัน
  const [fromDate, setFromDate] = useState<string>(getTodayString());
  const [toDate, setToDate] = useState<string>(getTodayString());

  // State สำหรับเปิด/ปิด อ่านเพิ่มเติมของข้อความยาว
  const [expandedReports, setExpandedReports] = useState<{ [key: string]: boolean }>({});

  // State สำหรับ Popup ดูรูปหลายรูป
  const [activeGallery, setActiveGallery] = useState<{ images: string[]; currentIndex: number } | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employee/reports");
      const data = await res.json();
      if (data.ok) {
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Fetch reports error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedReports((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeGallery) return;
    const newIndex = activeGallery.currentIndex === 0 ? activeGallery.images.length - 1 : activeGallery.currentIndex - 1;
    setActiveGallery({ ...activeGallery, currentIndex: newIndex });
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeGallery) return;
    const newIndex = activeGallery.currentIndex === activeGallery.images.length - 1 ? 0 : activeGallery.currentIndex + 1;
    setActiveGallery({ ...activeGallery, currentIndex: newIndex });
  };

  // ปุ่มตั้งค่าด่วนสำหรับช่วงวันที่
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

 // กรองรายงานตามช่วงวันที่โดยใช้เวลาท้องถิ่น (Local Date Timezone)
  const filteredReports = reports.filter((report) => {
    if (!report.createdAt) return true;

    // แปลงวันที่เป็น YYYY-MM-DD ตามเขตเวลาท้องถิ่น (Local Time)
    const d = new Date(report.createdAt);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const reportLocalDate = `${year}-${month}-${day}`;

    if (fromDate && reportLocalDate < fromDate) return false;
    if (toDate && reportLocalDate > toDate) return false;

    return true;
  });

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24">
      {/* Header ด้านบน */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-orange-500 font-bold text-[10px] rounded uppercase tracking-wider">
              EMPLOYEE
            </span>
            <h1 className="text-sm font-bold">แจ้งเหตุการณ์/รายงาน</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-3">
        
        {/* ปุ่มสร้างรายงานใหม่ */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 flex justify-between items-center gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">รายงานการตรวจตรา</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">แจ้งเหตุการณ์ผิดปกติ หรือรายงานการส่งเวร</p>
          </div>
          <Link
            href="/employee/reports/create"
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer shrink-0"
          >
            + สร้างรายงาน
          </Link>
        </div>

        {/* ตัวกรองช่วงวันที่ (Date Range Filter) */}
        <div className="bg-white rounded-2xl shadow-sm p-3.5 border border-slate-200 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-800">📅 ค้นหาตามช่วงวันที่</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setQuickDate("TODAY")}
                className="px-2 py-1 bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
              >
                วันนี้
              </button>
              <button
                type="button"
                onClick={() => setQuickDate("LAST_7_DAYS")}
                className="px-2 py-1 bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
              >
                7 วันล่าสุด
              </button>
              <button
                type="button"
                onClick={() => setQuickDate("ALL")}
                className="px-2 py-1 bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
              >
                ดูทั้งหมด
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">ตั้งแต่วันที่:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">ถึงวันที่:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* ประวัติการแจ้งเหตุการณ์ */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800">
              📋 ประวัติรายงานของคุณ
            </h3>
            <span className="text-[10px] font-bold text-slate-400">
              พบ {filteredReports.length} รายการ
            </span>
          </div>

          {loading ? (
            <div className="text-center text-slate-400 py-6 text-xs animate-pulse">กำลังโหลดข้อมูล...</div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-xs bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-lg block">📝</span>
              <span>{(fromDate || toDate) ? "ไม่พบรายงานในช่วงวันที่เลือก" : "ยังไม่มีประวัติการแจ้งเหตุการณ์"}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => {
                const isExpanded = !!expandedReports[report.id];
                const isLongText = report.message && report.message.length > 100;

                return (
                  <div key={report.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs shadow-sm">
                    
                    {/* Header ของการ์ด: แสดงวันที่และเวลาโดดเด่นนำหน้า */}
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                        <span className="text-sm">🗓️</span>
                        <span>{report.date}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-lg text-[10px] font-bold font-mono">
                        ⏰ {report.time} น.
                      </span>
                    </div>

                    {/* ข้อความรายงาน */}
                    <div className="space-y-1">
                      <p className={`font-medium text-slate-800 whitespace-pre-line leading-relaxed ${!isExpanded && isLongText ? "line-clamp-3" : ""}`}>
                        {report.message}
                      </p>
                      
                      {/* ปุ่มกดอ่านเพิ่มเติม / ย่อข้อความ */}
                      {isLongText && (
                        <button
                          onClick={() => toggleExpand(report.id)}
                          className="text-[11px] font-bold text-orange-600 hover:underline cursor-pointer pt-0.5 block"
                        >
                          {isExpanded ? "▲ ย่อข้อความ" : "▼ อ่านเพิ่มเติม..."}
                        </button>
                      )}
                    </div>

                    {/* แสดงรูปภาพแนบ (ถ้ามี) */}
                    {report.images && report.images.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] text-slate-500 font-semibold block">
                          📸 รูปภาพแนบ ({report.images.length} รูป):
                        </span>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {report.images.map((imgUrl: string, idx: number) => (
                            <div
                              key={idx}
                              onClick={() => setActiveGallery({ images: report.images, currentIndex: idx })}
                              className="w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-slate-300 shadow-sm cursor-pointer hover:opacity-80 transition relative"
                            >
                              <img
                                src={imgUrl}
                                alt={`report-img-${idx}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* พิกัด GPS */}
                    {(report.latitude && report.longitude) && (
                      <div className="pt-1 border-t border-slate-200/40">
                        <span className="inline-block font-mono text-[9px] text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                          📍 พิกัด: {report.location}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* Popup ดูรูปภาพขนาดใหญ่ */}
      {activeGallery && (
        <div
          onClick={() => setActiveGallery(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-between p-4 z-50 animate-fadeIn select-none"
        >
          <div className="w-full max-w-lg flex justify-between items-center text-white pt-2">
            <span className="text-xs font-mono bg-white/20 px-3 py-1 rounded-full">
              {activeGallery.currentIndex + 1} / {activeGallery.images.length}
            </span>
            <button
              onClick={() => setActiveGallery(null)}
              className="bg-white/20 hover:bg-white/40 text-white w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="relative max-w-lg w-full flex items-center justify-center my-auto">
            {activeGallery.images.length > 1 && (
              <button
                onClick={handlePrevImage}
                className="absolute left-2 z-10 bg-black/50 hover:bg-black/80 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border border-white/20 transition cursor-pointer"
              >
                ‹
              </button>
            )}

            <img
              src={activeGallery.images[activeGallery.currentIndex]}
              alt="enlarged-view"
              className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />

            {activeGallery.images.length > 1 && (
              <button
                onClick={handleNextImage}
                className="absolute right-2 z-10 bg-black/50 hover:bg-black/80 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border border-white/20 transition cursor-pointer"
              >
                ›
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-400 pb-2">
            แตะพื้นที่ว่างเพื่อปิด
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg">
        <Link href="/employee/profile" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">👤</span>
          หน้าแรก
        </Link>
        <Link href="/employee/leaves" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📝</span>
          ระบบลา
        </Link>
        <Link href="/employee/attendance" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">⏱️</span>
          ลงเวลาทำงาน
        </Link>
        <Link href="/employee/shifts" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📅</span>
          ตารางเวร
        </Link>
      </nav>
    </div>
  );
}