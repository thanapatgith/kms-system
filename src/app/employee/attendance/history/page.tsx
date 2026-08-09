"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function EmployeeAttendanceHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // เปลี่ยนเป็นเก็บอาเรย์ของรูปภาพทั้งหมดที่จะแสดงใน Modal
  const [activeImagesModal, setActiveImagesModal] = useState<string[] | null>(null);

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employee/attendance");
      const data = await res.json();
      if (data.ok) {
        setHistory(data.attendance || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    if (!startDate && !endDate) return true;
    const itemDateStr = item.rawDate ? new Date(item.rawDate).toISOString().split("T")[0] : "";
    if (startDate && endDate) {
      return itemDateStr >= startDate && itemDateStr <= endDate;
    } else if (startDate) {
      return itemDateStr >= startDate;
    } else if (endDate) {
      return itemDateStr <= endDate;
    }
    return true;
  });

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-20">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/employee/attendance" className="text-slate-300 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg">
              ⬅️ ย้อนกลับ
            </Link>
            <h1 className="text-sm font-bold">ประวัติการลงเวลา</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-3">
        
        {/* ตัวกรองช่วงวันที่ */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <span className="text-xs font-bold text-slate-800 block">📅 กรองประวัติการทำงานตามช่วงเวลา</span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-600 block mb-0.5 font-semibold">จากวันที่</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-semibold focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 block mb-0.5 font-semibold">ถึงวันที่</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-semibold focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(""); setEndDate(""); }}
              className="w-full py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition mt-1"
            >
              🔄 ล้างตัวกรองวันที่
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-10 text-xs animate-pulse">กำลังโหลดข้อมูล...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-500 text-xs border border-slate-200">
            ไม่พบประวัติการลงเวลาในช่วงวันที่เลือก
          </div>
        ) : (
          filteredHistory.map((item, index) => (
            <div key={index} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900 text-sm">{item.date}</span>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full">
                  รอบที่ {filteredHistory.length - index}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* ข้อมูลเข้างาน + ส่งอาเรย์รูปทั้งหมดเข้าไป */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div>
                    <span className="text-slate-600 block text-[10px] font-semibold">เวลาเข้างาน</span>
                    <span className="font-bold text-emerald-600 text-sm">{item.checkIn || "-"}</span>
                    <span className="block font-mono text-[9px] text-slate-600 truncate">📍 {item.locationIn || "-"}</span>
                  </div>
                  {item.imagesIn && item.imagesIn.length > 0 ? (
                    <button
                      onClick={() => setActiveImagesModal(item.imagesIn)}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>📸 ดูรูปเข้างาน ({item.imagesIn.length})</span>
                    </button>
                  ) : (
                    <span className="block text-[10px] text-slate-400 italic text-center py-1 bg-slate-100 rounded-md">ไม่มีรูปเข้างาน</span>
                  )}
                </div>

                {/* ข้อมูลออกงาน + ส่งอาเรย์รูปทั้งหมดเข้าไป */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div>
                    <span className="text-slate-600 block text-[10px] font-semibold">เวลาออกงาน</span>
                    <span className="font-bold text-orange-600 text-sm">{item.checkOut || "-"}</span>
                    <span className="block font-mono text-[9px] text-slate-600 truncate">📍 {item.locationOut || "-"}</span>
                  </div>
                  {item.imagesOut && item.imagesOut.length > 0 ? (
                    <button
                      onClick={() => setActiveImagesModal(item.imagesOut)}
                      className="w-full py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>📸 ดูรูปออกงาน ({item.imagesOut.length})</span>
                    </button>
                  ) : (
                    <span className="block text-[10px] text-slate-400 italic text-center py-1 bg-slate-100 rounded-md">ไม่มีรูปออกงาน</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Modal แสดงรูปภาพทั้งหมดในรอบนั้นๆ แบบเลื่อนดูได้ */}
      {activeImagesModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-sm w-full bg-white rounded-2xl overflow-hidden p-3 space-y-3 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-xs font-bold text-slate-800">📸 รูปถ่ายยืนยันทั้งหมด ({activeImagesModal.length} รูป)</span>
              <button
                onClick={() => setActiveImagesModal(null)}
                className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-xs flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {/* แสดงรูปเรียงลงมาทั้งหมด หากมีหลายรูปจะสามารถเลื่อนดูได้ */}
            <div className="overflow-y-auto space-y-2 pr-1">
              {activeImagesModal.map((imgSrc, imgIdx) => (
                <div key={imgIdx} className="w-full aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-200 relative">
                  <img src={imgSrc} alt={`Evidence ${imgIdx + 1}`} className="w-full h-full object-contain" />
                  <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md">
                    รูปที่ {imgIdx + 1} / {activeImagesModal.length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}