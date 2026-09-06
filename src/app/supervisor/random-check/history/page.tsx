"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function RandomCheckHistoryPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State สำหรับการกรอง
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [filterMode, setFilterMode] = useState<"month" | "7days" | "today" | "all" | "custom">("all");

  // State สำหรับ Modal ดูรูปภาพขยาย
  const [activeGallery, setActiveGallery] = useState<{ images: string[]; currentIndex: number } | null>(null);

  // Helper ฟังก์ชันหา YYYY-MM-DD ตามเวลาท้องถิ่น
  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // ควบคุม คีย์บอร์ด สำหรับกดเปลี่ยนรูป / ปิด Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeGallery) return;

      if (e.key === "Escape") {
        setActiveGallery(null);
      } else if (e.key === "ArrowLeft") {
        setActiveGallery((prev) =>
          prev ? { ...prev, currentIndex: prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1 } : null
        );
      } else if (e.key === "ArrowRight") {
        setActiveGallery((prev) =>
          prev ? { ...prev, currentIndex: prev.currentIndex === prev.images.length - 1 ? 0 : prev.currentIndex + 1 } : null
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeGallery]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/supervisor/random-check");
      const data = await res.json();
      if (data.ok) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ดึงรายชื่อหน่วยงานทั้งหมดที่ไม่ซ้ำกันสำหรับใส่ Dropdown กรอง
  const siteList = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((item) => {
      if (item.siteName) set.add(item.siteName);
    });
    return Array.from(set);
  }, [logs]);

  // ปุ่มลัดเลือกช่วงเวลา
  const handleQuickFilter = (mode: "month" | "7days" | "today" | "all") => {
    setFilterMode(mode);
    const today = new Date();
    const todayStr = formatLocalDate(today);

    if (mode === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (mode === "7days") {
      const past7 = new Date();
      past7.setDate(today.getDate() - 6);
      setStartDate(formatLocalDate(past7));
      setEndDate(todayStr);
    } else if (mode === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatLocalDate(firstDay));
      setEndDate(todayStr);
    } else if (mode === "all") {
      setStartDate("");
      setEndDate("");
    }
  };

  // ฟังก์ชันกรองรายการ (ทั้งวันที่และหน่วยงาน)
  const filteredLogs = logs.filter((item) => {
    // 1. กรองตามหน่วยงาน
    if (selectedSite !== "all" && item.siteName !== selectedSite) {
      return false;
    }

    // 2. กรองตามช่วงวันที่
    if (filterMode === "all" || (!startDate && !endDate)) return true;

    const rawDate = item.createdAt || item.date;
    if (!rawDate) return true;

    const itemLocalDate = formatLocalDate(new Date(rawDate));

    if (startDate && endDate) {
      return itemLocalDate >= startDate && itemLocalDate <= endDate;
    } else if (startDate) {
      return itemLocalDate >= startDate;
    } else if (endDate) {
      return itemLocalDate <= endDate;
    }
    return true;
  });

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

  const openGallery = (images: string[], index: number) => {
    setActiveGallery({ images, currentIndex: index });
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-20 font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-slate-300 hover:text-white transition text-xs font-bold cursor-pointer"
          >
            &lt; กลับ
          </button>
          <h1 className="text-sm font-bold">รายงานการตรวจตรา</h1>
          <div className="w-8"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-4">
        {/* การ์ดตัวกรองข้อมูล */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <span>🔍</span>
              <span>ตัวกรองค้นหาประวัติ</span>
            </label>
            <button
              type="button"
              onClick={() => {
                handleQuickFilter("all");
                setSelectedSite("all");
              }}
              className="text-[10px] text-amber-600 font-bold hover:underline cursor-pointer"
            >
              ล้างตัวกรอง
            </button>
          </div>

          {/* 1. ปุ่มเลือกช่วงเวลาด่วน */}
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => handleQuickFilter("month")}
              className={`py-1.5 text-[10px] font-bold rounded-lg transition cursor-pointer text-center ${
                filterMode === "month"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              เดือนนี้
            </button>
            <button
              type="button"
              onClick={() => handleQuickFilter("7days")}
              className={`py-1.5 text-[10px] font-bold rounded-lg transition cursor-pointer text-center ${
                filterMode === "7days"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              7 วัน
            </button>
            <button
              type="button"
              onClick={() => handleQuickFilter("today")}
              className={`py-1.5 text-[10px] font-bold rounded-lg transition cursor-pointer text-center ${
                filterMode === "today"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              วันนี้
            </button>
            <button
              type="button"
              onClick={() => handleQuickFilter("all")}
              className={`py-1.5 text-[10px] font-bold rounded-lg transition cursor-pointer text-center ${
                filterMode === "all"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              ทั้งหมด
            </button>
          </div>

          {/* 2. เลือกตามชื่อหน่วยงาน */}
          <div>
            <span className="text-[10px] text-slate-400 block mb-1 font-medium">หน่วยงาน:</span>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
            >
              <option value="all">🏢 หน่วยงานทั้งหมด</option>
              {siteList.map((site, idx) => (
                <option key={idx} value={site}>
                  {site}
                </option>
              ))}
            </select>
          </div>

          {/* 3. ตั้งแต่วันที่ ถึง วันที่ (คลิกปุ๊บปฏิทินเด้งปั๊บ) */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">ตั้งแต่วันที่:</span>
              <input
                type="date"
                value={startDate}
                onClick={(e) => e.currentTarget.showPicker?.()}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setFilterMode("custom");
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">ถึงวันที่:</span>
              <input
                type="date"
                value={endDate}
                onClick={(e) => e.currentTarget.showPicker?.()}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setFilterMode("custom");
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* หัวข้อรายการที่พบ */}
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
            <span>📋</span>
            <span>ประวัติรายการทั้งหมด</span>
          </span>
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            พบ {filteredLogs.length} รายการ
          </span>
        </div>

        {/* แสดงรายการประวัติ */}
        {loading ? (
          <div className="text-center py-10 text-slate-500 text-xs animate-pulse">กำลังโหลดข้อมูล...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs shadow-sm border border-slate-200">
            ไม่พบรายการการตรวจตราตามเงื่อนไขที่เลือก
          </div>
        ) : (
          filteredLogs.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-base">👤</span>
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">{item.userName || "พนักงาน"}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      📅 {item.createdAtFormatted || item.createdAt}
                    </span>
                  </div>
                </div>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <span>⏳</span>
                  <span>รอตรวจสอบ</span>
                </span>
              </div>

              {/* หน่วยงานที่ตรวจสอบ */}
              <div className="bg-amber-50/60 border border-amber-200/60 px-3 py-2 rounded-xl flex items-center gap-2">
                <span className="text-sm">📍</span>
                <div>
                  <span className="text-[10px] text-slate-500 block leading-none font-medium">หน่วยงานที่ตรวจสอบ</span>
                  <span className="text-xs font-bold text-slate-900">{item.siteName || "ไม่ระบุหน่วยงาน"}</span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                💬 {item.details || item.message}
              </p>

              {item.images && item.images.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">
                    📷 รูปภาพแนบ ({item.images.length} รูป):
                  </span>
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {item.images.map((imgUrl: string, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openGallery(item.images, idx);
                        }}
                        className="w-20 h-20 rounded-xl overflow-hidden border border-slate-300 shadow-sm cursor-pointer hover:opacity-80 active:scale-95 transition-all relative block p-0 bg-slate-100"
                      >
                        <img
                          src={imgUrl}
                          alt={`Evidence ${idx}`}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {item.latitude && item.longitude && (
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                  <span>📍 พิกัด: {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}</span>
                </div>
              )}
            </div>
          ))
        )}
      </main>

      {/* Popup ดูรูปภาพขนาดใหญ่ */}
      {activeGallery && (
        <div
          onClick={() => setActiveGallery(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-between p-4 z-[9999] animate-fadeIn select-none"
        >
          <div className="w-full max-w-2xl flex justify-between items-center text-white pt-2">
            <span className="text-xs font-mono bg-white/20 px-3 py-1 rounded-full">
              {activeGallery.currentIndex + 1} / {activeGallery.images.length}
            </span>
            <button
              type="button"
              onClick={() => setActiveGallery(null)}
              className="bg-white/20 hover:bg-white/40 text-white w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="relative max-w-2xl w-full flex items-center justify-center my-auto px-10">
            {activeGallery.images.length > 1 && (
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-0 z-10 bg-black/50 hover:bg-black/80 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border border-white/20 transition cursor-pointer"
              >
                ‹
              </button>
            )}

            <img
              src={activeGallery.images[activeGallery.currentIndex]}
              alt="enlarged-view"
              className="max-h-[80vh] h-auto w-auto object-contain rounded-2xl shadow-2xl border border-white/10 bg-black"
              onClick={(e) => e.stopPropagation()}
            />

            {activeGallery.images.length > 1 && (
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-0 z-10 bg-black/50 hover:bg-black/80 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border border-white/20 transition cursor-pointer"
              >
                ›
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-400 pb-2">
            แตะพื้นที่ว่างเพื่อปิด หรือใช้ปุ่มลูกศรบนคีย์บอร์ด
          </div>
        </div>
      )}
    </div>
  );
}