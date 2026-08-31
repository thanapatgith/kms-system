"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ClientReportsPage() {
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

  const [filter, setFilter] = useState("all");
  const [selectedSite, setSelectedSite] = useState("all");
  const [availableSites, setAvailableSites] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [activeImagesList, setActiveImagesList] = useState<string[]>([]);

  useEffect(() => {
    fetchReportsData();
  }, [filter, selectedSite]);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      let url = `/api/client/reports?filter=${filter}&site=${encodeURIComponent(selectedSite)}`;
      if (filter === "custom" && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setClientData(data.client || { companyName: "อมตะ" });
        setReports(data.reports || []);
        if (data.sites) {
          setAvailableSites(data.sites);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateSearch = () => {
    if (!startDate || !endDate) {
      alert("กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด");
      return;
    }
    setFilter("custom");
    fetchReportsData();
  };

  const handleAcknowledge = async (reportId: string) => {
    try {
      const res = await fetch(`/api/client/reports/${reportId}/acknowledge`, { method: "POST" });
      const data = await res.json();
      if (data.success) fetchReportsData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (reportId: string) => {
    const text = commentText[reportId];
    if (!text || !text.trim()) return;

    try {
      const res = await fetch(`/api/client/reports/${reportId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: text }),
      });
      const data = await res.json();
      if (data.success) {
        setCommentText({ ...commentText, [reportId]: "" });
        fetchReportsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenSummaryPrint = () => {
    const queryParams = new URLSearchParams({
      filter,
      site: selectedSite,
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    });
    window.open(`/client/reports/summary-print?${queryParams.toString()}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-24 font-sans text-slate-800 overflow-y-scroll">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏢</span>
            <div>
              <h1 className="text-sm font-bold">{clientData?.companyName || "Client Portal"}</h1>
              <p className="text-[10px] text-slate-400">ระบบตรวจสอบรายงานประจำวัน</p>
            </div>
          </div>
          <button
            onClick={() => {
              fetch("/api/auth/logout", { method: "POST" }).then(() => {
                window.location.href = "/login";
              });
            }}
            className="text-xs text-rose-400 hover:text-rose-300 font-bold bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-700 transition"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm p-3">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/client/dashboard" className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition text-center flex items-center justify-center gap-1.5">
            <span>📊</span> ภาพรวมสถิติ
          </Link>
          <Link href="/client/reports" className="px-4 py-2.5 bg-orange-600 text-white text-xs font-bold rounded-xl shadow shadow-orange-500/20 text-center flex items-center justify-center gap-1.5">
            <span>📋</span> รายงานประจำวัน
          </Link>
          <Link href="/client/billing" className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition text-center flex items-center justify-center gap-1.5">
            <span>💰</span> ชำระเงินค่าบริการ
          </Link>
          <Link href="/client/profile" className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition text-center flex items-center justify-center gap-1.5">
            <span>ℹ️</span> ข้อมูลสัญญา
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 mt-6 space-y-5 min-h-[600px]">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">📋 รายงานประจำวันทั้งหมดจากหน่วยงาน</h2>
            <p className="text-xs text-slate-500">ตรวจสอบและรับทราบรายงานการปฏิบัติงานของเจ้าหน้าที่ รปภ.</p>
          </div>
          <button
            onClick={handleOpenSummaryPrint}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
          >
            🖨️ พิมพ์สรุปรายงานภาพรวม (ประจำเดือน)
          </button>
        </div>

        {/* แผงตัวกรอง */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 mr-2">🔍 กรองช่วงเวลา:</span>
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  filter === "all" ? "bg-orange-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilter("today")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  filter === "today" ? "bg-orange-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                วันนี้
              </button>
              <button
                onClick={() => setFilter("7days")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  filter === "7days" ? "bg-orange-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                7 วันล่าสุด
              </button>
            </div>

            {/* Dropdown เลือกหน่วยงาน */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">🏢 หน่วยงาน:</span>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="all">ทุกหน่วยงาน</option>
                {availableSites.map((siteName, idx) => (
                  <option key={idx} value={siteName}>
                    {siteName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ช่องเลือกช่วงวันที่กำหนดเอง */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-500 font-medium">จากวันที่:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 cursor-pointer"
            />
            <span className="text-slate-500 font-medium">ถึง:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 cursor-pointer"
            />
            <button
              onClick={handleCustomDateSearch}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition shadow"
            >
              ค้นหาช่วงวันที่
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200 text-xs shadow-sm">
            กำลังโหลดรายงาน...
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200 text-xs shadow-sm">
            ยังไม่มีรายการรายงานการปฏิบัติงานในช่วงเวลาหรือหน่วยงานที่คุณเลือก
          </div>
        ) : (
          reports.map((rep: any) => (
            <div key={rep.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              
              {/* ส่วนหัวการ์ด: หน่วยงาน & ปุ่มรับทราบ */}
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-xs bg-orange-50 text-orange-800 px-3.5 py-1 rounded-full font-bold">
                  🏢 หน่วยงาน: {rep.siteName}
                </span>
                {rep.isAcknowledged ? (
                  <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1">
                    ✓ รับทราบแล้ว
                  </span>
                ) : (
                  <button
                    onClick={() => handleAcknowledge(rep.id)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition"
                  >
                    กดรับทราบ
                  </button>
                )}
              </div>

              {/* ข้อความรายงานและข้อมูลผู้รายงาน */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                  {rep.content || rep.title || "รายงานการปฏิบัติงาน รปภ."}
                </h3>
                <p className="text-[11px] text-slate-400">
                  ผู้รายงาน: <span className="text-slate-700 font-semibold">{rep.employeeName} ({rep.employeeCode})</span> • วันที่: {new Date(rep.createdAt).toLocaleString("th-TH")}
                </p>
              </div>

              {/* ส่วนแสดงรูปภาพแบบเลื่อนแถวเดียว (Horizontal Scroll) */}
              {rep.images && rep.images.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600">📷 รูปภาพประกอบ ({rep.images.length} รูป - คลิกเพื่อดูรูปใหญ่):</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300">
                    {rep.images.map((imgUrl: string, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setActiveImagesList(rep.images);
                          setActiveImageIndex(idx);
                        }}
                        className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 cursor-pointer group relative bg-slate-900 shadow-sm"
                      >
                        <img src={imgUrl} alt="report image" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                          🔍 ขยาย
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ส่วนคอมเมนต์ */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800">💬 ความเห็น / ข้อเสนอแนะจากลูกค้า</h4>
                
                {rep.comments && rep.comments.length > 0 && (
                  <div className="space-y-2">
                    {rep.comments.map((comm: any, idx: number) => (
                      <div key={idx} className="bg-orange-50/60 p-3 rounded-xl border border-orange-100 text-xs">
                        <span className="font-bold text-orange-900">{comm.author}: </span>
                        <span className="text-slate-700">{comm.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="พิมพ์ข้อเสนอแนะหรือแจ้งปัญหา..."
                    value={commentText[rep.id] || ""}
                    onChange={(e) => setCommentText({ ...commentText, [rep.id]: e.target.value })}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={() => handleAddComment(rep.id)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow"
                  >
                    ส่งความเห็น
                  </button>
                </div>
              </div>

            </div>
          ))
        )}

      </main>

      {/* Modal สไลด์รูปภาพซ้าย-ขวา */}
      {activeImageIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setActiveImageIndex(null)}
            className="absolute top-5 right-5 text-white bg-slate-800/80 hover:bg-slate-700 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition z-10"
          >
            ✕
          </button>

          {/* ปุ่มเลื่อนซ้าย */}
          {activeImagesList.length > 1 && (
            <button
              onClick={() => setActiveImageIndex((prev) => (prev! > 0 ? prev! - 1 : activeImagesList.length - 1))}
              className="absolute left-5 text-white bg-slate-800/80 hover:bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition z-10"
            >
              ‹
            </button>
          )}

          {/* รูปภาพปัจจุบัน */}
          <div className="max-w-4xl max-h-[85vh] flex items-center justify-center relative">
            <img
              src={activeImagesList[activeImageIndex]}
              alt="Fullscreen preview"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <div className="absolute bottom-[-30px] text-white text-xs bg-slate-800/80 px-3 py-1 rounded-full">
              รูปที่ {activeImageIndex + 1} จาก {activeImagesList.length}
            </div>
          </div>

          {/* ปุ่มเลื่อนขวา */}
          {activeImagesList.length > 1 && (
            <button
              onClick={() => setActiveImageIndex((prev) => (prev! < activeImagesList.length - 1 ? prev! + 1 : 0))}
              className="absolute right-5 text-white bg-slate-800/80 hover:bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition z-10"
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}