"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ClientReportsPage() {
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      const res = await fetch("/api/client/dashboard");
      const data = await res.json();
      if (data.success) {
        setClientData(data.client);
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  const handlePrintReport = (reportId: string) => {
    window.open(`/client/reports/${reportId}/print`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm font-sans">
        กำลังโหลดรายงานประจำวัน...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-24 font-sans text-slate-800">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
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
            className="text-xs text-rose-400 hover:text-rose-300 font-bold bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 transition"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm p-3">
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-2">
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

      <main className="max-w-4xl mx-auto px-4 mt-5 space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900 px-1">📋 รายงานประจำวันทั้งหมดจากหน่วยงาน</h2>

        {reports.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-slate-200 text-xs shadow-sm">
            ยังไม่มีรายงานการปฏิบัติงานในหน่วยงานของคุณในขณะนี้
          </div>
        ) : (
          reports.map((rep: any) => (
            <div key={rep.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
                    หน่วยงาน: {rep.siteName}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1.5">
                    {rep.title || "รายงานการปฏิบัติงาน รปภ."}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    วันที่: {new Date(rep.createdAt).toLocaleString("th-TH")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintReport(rep.id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center gap-1"
                  >
                    🖨️ พิมพ์
                  </button>
                  
                  {rep.isAcknowledged ? (
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
                      ✓ รับทราบแล้ว
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(rep.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition"
                    >
                      กดรับทราบ
                    </button>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                {rep.content || rep.description || "ไม่มีรายละเอียดเพิ่มเติม"}
              </div>

              {/* ส่วนคอมเมนต์ */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-800">💬 ความเห็น / ข้อเสนอแนะจากลูกค้า</h4>
                
                {rep.comments && rep.comments.length > 0 && (
                  <div className="space-y-2">
                    {rep.comments.map((comm: any, idx: number) => (
                      <div key={idx} className="bg-orange-50/60 p-2.5 rounded-xl border border-orange-100 text-xs">
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
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={() => handleAddComment(rep.id)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                  >
                    ส่งความเห็น
                  </button>
                </div>
              </div>

            </div>
          ))
        )}

      </main>
    </div>
  );
}