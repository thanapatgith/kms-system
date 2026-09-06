"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ClientNavbar from "@/components/ClientNavbar";

// คอมโพเนนต์ย่อยสำหรับจัดการข้อความรายงาน (Read More / Collapse)
function ReportCardContent({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongText = content.length > 120;

  return (
    <div className="mt-2">
      <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed break-words whitespace-pre-line">
        {isExpanded || !isLongText ? content : `${content.substring(0, 120)}...`}
      </p>
      {isLongText && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] font-bold text-orange-600 hover:text-orange-700 mt-1 cursor-pointer inline-flex items-center gap-0.5"
        >
          {isExpanded ? "▲ ย่อข้อความ" : "▼ อ่านเพิ่มเติม"}
        </button>
      )}
    </div>
  );
}

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
  
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [activeImagesList, setActiveImagesList] = useState<string[]>([]);

  useEffect(() => {
    fetchReportsData();
  }, [filter, selectedSite]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
      if (data.success) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, isAcknowledged: true } : r))
        );
        showToast("บันทึกการรับทราบรายงานเรียบร้อยแล้วครับ");
      } else {
        showToast("เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err) {
      console.error(err);
      showToast("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
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
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-800 overflow-y-auto relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[100] bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs flex items-center gap-2 animate-bounce">
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">🏢</span>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold leading-tight break-words">
                {clientData?.companyName || "Client Portal"}
              </h1>
              <p className="text-[10px] text-slate-400">ระบบตรวจสอบรายงานประจำวัน</p>
            </div>
          </div>
          <button
            onClick={() => {
              fetch("/api/auth/logout", { method: "POST" }).then(() => {
                window.location.href = "/login";
              });
            }}
            className="text-[11px] text-rose-400 hover:text-rose-300 font-bold bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition shrink-0"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      <ClientNavbar />

      <main className="max-w-4xl mx-auto px-4 mt-5 space-y-4">
        
        {/* Title & Action Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">📋 รายงานประจำวัน</h2>
            <p className="text-xs text-slate-500">รายงานการปฏิบัติงานล่าสุด</p>
          </div>
          <button
            onClick={handleOpenSummaryPrint}
            className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            🖨️ <span className="hidden sm:inline">พิมพ์รายงานสรุป</span><span className="sm:hidden">พิมพ์</span>
          </button>
        </div>

        {/* Quick Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                filter === "all" ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setFilter("today")}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                filter === "today" ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              วันนี้
            </button>
            <button
              onClick={() => setFilter("7days")}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                filter === "7days" ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              7 วันล่าสุด
            </button>
            <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
            <button
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition flex items-center gap-1 cursor-pointer ${
                showAdvancedFilter || filter === "custom" || selectedSite !== "all" ? "bg-orange-100 text-orange-700 border border-orange-200" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              ⚙️ ตัวกรองเพิ่มเติม
            </button>
          </div>

          {showAdvancedFilter && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-fadeIn space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">กรองตามหน่วยงาน</label>
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">ทุกหน่วยงาน</option>
                  {availableSites.map((siteName, idx) => (
                    <option key={idx} value={siteName}>{siteName}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 border-t border-slate-100 pt-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">กรองช่วงวันที่กำหนดเอง</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <button
                  onClick={handleCustomDateSearch}
                  className="mt-2 w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow cursor-pointer"
                >
                  ค้นหาช่วงวันที่
                </button>
              </div>
            </div>
          )}
        </div>

        {/* List of Reports */}
        <div className="space-y-4 pt-2">
          {loading ? (
            <div className="bg-white rounded-2xl p-10 text-center flex flex-col items-center justify-center border border-slate-200 shadow-sm">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-slate-400 text-xs">กำลังโหลดรายงาน...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-slate-200 text-xs shadow-sm flex flex-col items-center">
              <span className="text-3xl mb-2">📭</span>
              <p>ยังไม่มีรายงานในช่วงเวลาหรือหน่วยงานที่เลือก</p>
            </div>
          ) : (
            reports.map((rep: any) => (
              <div key={rep.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                
                {/* 1. ส่วนหัวการ์ด: ประเภทรายงาน / สถานะรับทราบ */}
                <div className="flex justify-between items-center gap-2 pb-2.5 border-b border-slate-100">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg flex items-center gap-1">
                    🛡️ รายงานการปฏิบัติงาน
                  </span>

                  {rep.isAcknowledged ? (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200 flex items-center gap-1 shrink-0">
                      ✓ รับทราบแล้ว
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(rep.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg shadow-sm transition shrink-0 cursor-pointer"
                    >
                      กดรับทราบ
                    </button>
                  )}
                </div>

                {/* 2. ส่วนข้อมูล: ชื่อหน่วยงาน + วันที่และเวลา */}
                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 pt-1">
                  <span className="font-bold text-orange-600 flex items-center gap-1">
                    📍 {rep.siteName}
                  </span>
                  <span className="text-slate-400">
                    🕒 {new Date(rep.createdAt).toLocaleString("th-TH")}
                  </span>
                </div>

                {/* 3. เนื้อหารายงาน */}
                <ReportCardContent content={rep.content || rep.title || "รายงานการปฏิบัติงาน"} />

                {/* 4. รูปภาพประกอบ */}
                {rep.images && rep.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 pt-2 scrollbar-hide">
                    {rep.images.map((imgUrl: string, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setActiveImagesList(rep.images);
                          setActiveImageIndex(idx);
                        }}
                        className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 cursor-pointer relative bg-slate-100"
                      >
                        <img src={imgUrl} alt="report img" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 flex items-center justify-center transition">
                          <span className="text-white text-xs font-bold drop-shadow-md">🔍 ขยาย</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. ส่วนล่าง: ผู้รายงาน และ ความคิดเห็น */}
                <div className="pt-3 border-t border-slate-100 bg-slate-50/50 -mx-5 px-5 pb-1 mt-2">
                  <div className="flex items-center gap-2 mb-3 pt-2">
                    <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px]">👮‍♂️</div>
                    <p className="text-[11px] text-slate-500">
                      ผู้รายงาน: <span className="font-semibold text-slate-700">{rep.employeeName}</span> ({rep.employeeCode})
                    </p>
                  </div>

                  {rep.comments && rep.comments.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {rep.comments.map((comm: any, idx: number) => (
                        <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px]">
                          <span className="font-bold text-slate-800">{comm.author}: </span>
                          <span className="text-slate-600">{comm.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="เพิ่มความเห็น / ข้อเสนอแนะ..."
                      value={commentText[rep.id] || ""}
                      onChange={(e) => setCommentText({ ...commentText, [rep.id]: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-orange-500"
                    />
                    <button
                      onClick={() => handleAddComment(rep.id)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      ส่ง
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal ภาพใหญ่ */}
      {activeImageIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-2">
          <button
            onClick={() => setActiveImageIndex(null)}
            className="absolute top-4 right-4 text-white bg-slate-800/80 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold z-10 cursor-pointer"
          >✕</button>

          {activeImagesList.length > 1 && (
            <button
              onClick={() => setActiveImageIndex((prev) => (prev! > 0 ? prev! - 1 : activeImagesList.length - 1))}
              className="absolute left-2 sm:left-6 text-white bg-slate-800/80 w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold z-10 cursor-pointer"
            >‹</button>
          )}

          <div className="relative w-full max-w-4xl flex flex-col items-center">
            <img
              src={activeImagesList[activeImageIndex]}
              alt="Fullscreen"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
            <div className="mt-4 text-white text-xs bg-slate-800/80 px-3 py-1.5 rounded-full">
              รูปที่ {activeImageIndex + 1} / {activeImagesList.length}
            </div>
          </div>

          {activeImagesList.length > 1 && (
            <button
              onClick={() => setActiveImageIndex((prev) => (prev! < activeImagesList.length - 1 ? prev! + 1 : 0))}
              className="absolute right-2 sm:right-6 text-white bg-slate-800/80 w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold z-10 cursor-pointer"
            >›</button>
          )}
        </div>
      )}
    </div>
  );
}