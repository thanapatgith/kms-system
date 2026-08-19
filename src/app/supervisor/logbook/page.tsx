"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SupervisorLogbookPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [activeImages, setActiveImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  useEffect(() => {
    fetchSupervisorData();
  }, []);

  const fetchSupervisorData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/supervisor/logbooks");
      const data = await res.json();
      if (data.ok) {
        setReports(data.reports || []);
      } else {
        setErrorMsg(data.error || "ไม่สามารถดึงข้อมูลได้");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

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

  const handleAcknowledge = async (id: string) => {
    try {
      const res = await fetch("/api/supervisor/logbooks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "ACKNOWLEDGED" }),
      });

      const data = await res.json();
      if (data.ok) {
        setReports(reports.map(r => r.id === id ? { ...r, status: "ACKNOWLEDGED" } : r));
      } else {
        alert(data.error || "ไม่สามารถบันทึกสถานะได้");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const openImageViewer = (images: string[], index: number) => {
    setActiveImages(images);
    setCurrentImageIndex(index);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % activeImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + activeImages.length) % activeImages.length);
  };

  const filteredReports = reports.filter((item) => {
    if (!item.createdAt) return true;

    const d = new Date(item.createdAt);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const itemLocalDate = `${year}-${month}-${day}`;

    if (fromDate && itemLocalDate < fromDate) return false;
    if (toDate && itemLocalDate > toDate) return false;

    return true;
  });

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24">
      {/* Header มือถือ */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded uppercase tracking-wider">
              SUPERVISOR
            </span>
            <h1 className="text-sm font-bold">รายงานพนักงาน</h1>
          </div>
          <button
            onClick={fetchSupervisorData}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
          >
            🔄 รีเฟรช
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-3">
        
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-1">
          <h2 className="text-sm font-bold text-slate-900">รายการรายงานการปฏิบัติงาน</h2>
          <p className="text-[11px] text-slate-500">
            ตรวจสอบสถานะการตรวจรอบพื้นที่และเหตุการณ์ประจำวันของเจ้าหน้าที่รักษาความปลอดภัยในสังกัด
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        {/* ตัวกรองช่วงวันที่ */}
        <div className="bg-white rounded-2xl shadow-sm p-3.5 border border-slate-200 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-800">📅 ค้นหาตามช่วงวันที่</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setQuickDate("TODAY")}
                className="px-2 py-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
              >
                วันนี้
              </button>
              <button
                type="button"
                onClick={() => setQuickDate("LAST_7_DAYS")}
                className="px-2 py-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
              >
                7 วันล่าสุด
              </button>
              <button
                type="button"
                onClick={() => setQuickDate("ALL")}
                className="px-2 py-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
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
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">ถึงวันที่:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* ประวัติรายการรายงาน */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 text-xs">
            <h3 className="font-bold text-slate-800">
              📋 ประวัติการรายงานทั้งหมด
            </h3>
            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px]">
              พบ {filteredReports.length} รายการ
            </span>
          </div>

          {loading ? (
            <div className="text-center text-slate-400 py-8 text-xs animate-pulse">
              กำลังโหลดข้อมูลรายงาน...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center text-slate-400 py-10 text-xs bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-xl block">📭</span>
              <span>{(fromDate || toDate) ? "ไม่พบรายงานในช่วงวันที่เลือก" : "ยังไม่มีรายงานจากพนักงานคนอื่นในระบบ"}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((item) => (
                <div key={item.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs shadow-sm">
                  
                  {/* หัวการ์ด: ชื่อพนักงาน และสถานะ */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">
                        👤 {item.employeeName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        🗓️ {item.date} <span className="text-amber-600 font-bold">{item.time}</span> น.
                      </span>
                    </div>

                    {item.status === "ACKNOWLEDGED" ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px] shrink-0">
                        ✓ รับทราบแล้ว
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px] animate-pulse shrink-0">
                        ⏳ รอตรวจสอบ
                      </span>
                    )}
                  </div>

                  {/* ข้อความรายงาน */}
                  <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-slate-800 font-medium text-[11px] leading-relaxed">
                    💬 {item.message}
                  </div>

                  {/* รูปภาพแนบ */}
                  {item.images && item.images.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500">📸 รูปภาพแนบ ({item.images.length} รูป):</span>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {item.images.map((imgUrl: string, imgIdx: number) => (
                          <img
                            key={imgIdx}
                            src={imgUrl}
                            alt="Incident Image"
                            onClick={() => openImageViewer(item.images, imgIdx)}
                            className="w-16 h-16 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-85 transition shrink-0 shadow-sm"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* หน่วยงาน และ พิกัด GPS */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/60 font-mono gap-1">
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 truncate max-w-[55%]">
                      🏢 {item.siteName || "-"}
                    </span>
                    <span className="text-slate-500 shrink-0">
                      📍 <span className="font-semibold text-slate-700">{item.location}</span>
                    </span>
                  </div>

                  {item.status !== "ACKNOWLEDGED" && (
                    <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                      <button
                        onClick={() => handleAcknowledge(item.id)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-[11px] transition cursor-pointer shadow-sm"
                      >
                        ✓ กดรับทราบรายงาน
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Modal ดูรูปภาพขนาดใหญ่ */}
      {activeImages.length > 0 && (
        <div 
          onClick={() => setActiveImages([])}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-lg w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setActiveImages([])}
              className="absolute -top-12 right-0 text-white text-lg font-bold bg-slate-800/80 hover:bg-slate-700 w-9 h-9 rounded-full flex items-center justify-center transition shadow-lg cursor-pointer z-10"
            >
              ✕
            </button>

            <div className="relative w-full flex items-center justify-center">
              <img 
                src={activeImages[currentImageIndex]} 
                alt="Full Size" 
                className="w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-slate-700 bg-black/40"
              />

              {activeImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 bg-slate-900/80 hover:bg-slate-900 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg transition cursor-pointer"
                  >
                    ❮
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 bg-slate-900/80 hover:bg-slate-900 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg transition cursor-pointer"
                  >
                    ❯
                  </button>
                </>
              )}
            </div>

            {activeImages.length > 1 && (
              <div className="mt-3 px-3 py-1 bg-slate-900/90 text-amber-400 font-mono text-xs font-bold rounded-full border border-slate-700 shadow-md">
                รูปที่ {currentImageIndex + 1} จาก {activeImages.length}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg max-w-md mx-auto">
        <Link href="/supervisor/dashboard" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📊</span>แดชบอร์ด
        </Link>
        <Link href="/supervisor/apply-leave" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📝</span>ระบบลา
        </Link>
        <Link href="/supervisor/attendance" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">⏱️</span>ลงเวลาทำงาน
        </Link>
        <Link href="/supervisor/shifts" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📅</span>ตารางเวร
        </Link>
      </nav>
    </div>
  );
}