"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SupervisorLeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/supervisor/leaves");
      const data = await res.json();
      if (data.ok) {
        const formatted = (data.leaves || []).map((item: any) => ({
          ...item,
          hasEdited: item.hasEdited || false,
        }));
        setLeaves(formatted);
      } else {
        setErrorMsg(data.error || "ไม่สามารถดึงข้อมูลการลาได้");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, status: string, rejectReason?: string) => {
    try {
      const targetItem = leaves.find(l => l.id === id);
      
      // ถ้ารายการนี้ถูกใช้สิทธิ์แก้ไขครบแล้ว (hasEdited เป็น true) ให้บล็อกทันที
      if (targetItem?.hasEdited) {
        alert("รายการนี้ถูกใช้สิทธิ์แก้ไขครบ 1 ครั้งแล้ว จึงไม่สามารถแก้ไขซ้ำได้อีก");
        return;
      }

      const res = await fetch("/api/supervisor/leaves", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, rejectReason: rejectReason || "" }),
      });

      const data = await res.json();
      if (data.ok) {
        setLeaves(leaves.map(l => l.id === id ? { 
          ...l, 
          status: data.data.status, 
          rejectReason: rejectReason || l.rejectReason, 
          hasEdited: data.data.hasEdited 
        } : l));
        setRejectModalOpen(false);
        setSelectedLeaveId(null);
        setRejectReasonInput("");
      } else {
        alert(data.error || "ไม่สามารถอัปเดตสถานะได้");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const handleQuickDateFilter = (type: string) => {
    const today = new Date();
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (type === "TODAY") {
      const tStr = formatDate(today);
      setFromDate(tStr);
      setToDate(tStr);
    } else if (type === "7DAYS") {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setFromDate(formatDate(past));
      setToDate(formatDate(today));
    } else {
      setFromDate("");
      setToDate("");
    }
  };

  const filteredLeaves = leaves.filter((item) => {
    const st = item.status || "PENDING";
    if (filterStatus === "PENDING" && !(st === "PENDING" || st === "รออนุมัติ")) return false;
    if (filterStatus === "APPROVED" && !(st === "APPROVED" || st === "อนุมัติ")) return false;
    if (filterStatus === "REJECTED" && !(st === "REJECTED" || st === "ไม่อนุมัติ")) return false;

    if (item.createdAt || item.startDate) {
      const targetDateStr = item.startDate || item.createdAt;
      const d = new Date(targetDateStr);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const itemLocalDate = `${year}-${month}-${day}`;
        if (fromDate && itemLocalDate < fromDate) return false;
        if (toDate && itemLocalDate > toDate) return false;
      }
    }
    return true;
  });

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24 overflow-x-hidden">
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded uppercase tracking-wider">SUPERVISOR</span>
            <h1 className="text-sm font-bold">อนุมัติใบลาพนักงาน</h1>
          </div>
          <button onClick={fetchLeaves} className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer">🔄 รีเฟรช</button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-4 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-1">
          <h2 className="text-sm font-bold text-slate-900">จัดการคำขอลาของพนักงาน</h2>
          <p className="text-[11px] text-slate-500">ตรวจสอบและพิจารณาคำขอลา (อนุญาตให้เปลี่ยนใจได้ 1 ครั้ง)</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium text-center">{errorMsg}</div>
        )}

        {/* ตัวกรองตามช่วงวันที่ */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              📅 ค้นหาตามช่วงวันที่
            </span>
            <div className="flex gap-1">
              <button onClick={() => handleQuickDateFilter("TODAY")} className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer">วันนี้</button>
              <button onClick={() => handleQuickDateFilter("7DAYS")} className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer">7 วันล่าสุด</button>
              <button onClick={() => handleQuickDateFilter("ALL")} className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer">ดูทั้งหมด</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">ตั้งแต่วันที่:</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">ถึงวันที่:</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white" />
            </div>
          </div>
        </div>

        {/* ตัวกรองสถานะแบบกระชับ */}
        <div className="bg-white rounded-2xl shadow-sm p-3 border border-slate-200 flex gap-1.5 overflow-x-auto">
          {[
            { id: "ALL", label: "ทั้งหมด" },
            { id: "PENDING", label: "⏳ รออนุมัติ" },
            { id: "APPROVED", label: "✓ อนุมัติ" },
            { id: "REJECTED", label: "✕ ไม่อนุมัติ" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 ${
                filterStatus === tab.id ? "bg-slate-900 text-amber-400 shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* รายการคำขอลา */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 text-xs">
            <h3 className="font-bold text-slate-800">📋 รายการคำขอลา</h3>
            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px]">
              พบ {filteredLeaves.length} รายการ
            </span>
          </div>

          {loading ? (
            <div className="text-center text-slate-400 py-8 text-xs animate-pulse">กำลังโหลดข้อมูลใบลา...</div>
          ) : filteredLeaves.length === 0 ? (
            <div className="text-center text-slate-400 py-10 text-xs bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-xl block">📭</span>
              <span>ไม่พบรายการคำขอลาในช่วงเวลาหรือสถานะนี้</span>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLeaves.map((item) => {
                const isPending = !item.status || item.status === "PENDING" || item.status === "รออนุมัติ";
                const isApproved = item.status === "APPROVED" || item.status === "อนุมัติ";
                const isRejected = item.status === "REJECTED" || item.status === "ไม่อนุมัติ";

                return (
                  <div key={item.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs shadow-sm">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-sm block truncate">👤 {item.employeeName || "พนักงาน"}</span>
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold mt-0.5 inline-block border border-amber-200/60">
                          ประเภท: {item.leaveType}
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] shrink-0 ${isApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : isRejected ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {isApproved ? '✓ อนุมัติแล้ว' : isRejected ? '✕ ไม่อนุมัติ' : '⏳ รออนุมัติ'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-slate-800 text-[11px] space-y-1 font-medium">
                      <div>🗓️ วันที่ลา: <span className="text-slate-900 font-bold">{item.startDate} ถึง {item.endDate}</span></div>
                      {item.reason && <div className="text-slate-500">💬 เหตุผลการลา: {item.reason}</div>}
                      {item.rejectReason && (
                        <div className="text-red-600 font-semibold pt-1 border-t border-slate-100 mt-1">
                          ❌ เหตุผลที่ไม่อนุมัติ: {item.rejectReason}
                        </div>
                      )}
                    </div>

                    {/* จัดการปุ่มกดและการล็อกสถานะ */}
                    <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[10px]">
                        {!isPending && !item.hasEdited && (
                          <span className="text-amber-700 font-semibold">
                            ⚠️ สามารถเปลี่ยนใจได้อีก 1 ครั้ง (กดปุ่มสลับสถานะด้านล่างได้เลย)
                          </span>
                        )}
                        {item.hasEdited && (
                          <span className="text-slate-400 italic">🔒 ล็อกสถานะถาวรแล้ว (ใช้สิทธิ์เปลี่ยนใจครบ 1 ครั้งแล้ว)</span>
                        )}
                        {isPending && <span className="text-slate-400">รอการพิจารณา</span>}
                      </div>

                      {item.hasEdited ? (
                        <div className="text-center text-slate-400 italic py-1 text-[10px]">ไม่สามารถแก้ไขสถานะได้อีก</div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {/* ปุ่มไม่อนุมัติ: ปิดการใช้งานถ้าน้องหรือพนักงานคนนี้ถูกกดไม่อนุมัติอยู่แล้ว */}
                          <button
                            disabled={isRejected}
                            onClick={() => { setSelectedLeaveId(item.id); setRejectModalOpen(true); }}
                            className={`w-full py-1.5 font-bold rounded-xl border text-[11px] text-center transition ${
                              isRejected 
                                ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60' 
                                : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 cursor-pointer'
                            }`}
                          >
                            ✕ ไม่อนุมัติ
                          </button>

                          {/* ปุ่มอนุมัติ: ปิดการใช้งานถ้าน้องหรือพนักงานคนนี้ถูกกดอนุมัติอยู่แล้ว */}
                          <button
                            disabled={isApproved}
                            onClick={() => handleAction(item.id, "APPROVED")}
                            className={`w-full py-1.5 font-bold rounded-xl text-[11px] text-center shadow-sm transition ${
                              isApproved 
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60' 
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                            }`}
                          >
                            ✓ อนุมัติ
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal ปฏิเสธ */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">❌ ระบุเหตุผลการไม่อนุมัติ</h3>
            <textarea
              rows={3}
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="เช่น กำลังพลไม่เพียงพอ..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setRejectModalOpen(false)} className="px-3.5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer">ยกเลิก</button>
              <button onClick={() => handleAction(selectedLeaveId!, "REJECTED", rejectReasonInput)} className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl text-xs cursor-pointer">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg max-w-md mx-auto">
        <Link href="/supervisor/dashboard" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📊</span>แดชบอร์ด
        </Link>
        <Link href="/supervisor/leaves" className="flex flex-col items-center text-amber-400 text-[10px] font-bold transition">
          <span className="text-base mb-0.5">📝</span>อนุมัติลา
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