"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SupervisorEquipmentPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [filterStatus, setFilterStatus] = useState("ALL");

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");

  useEffect(() => {
    fetchEquipmentRequests();
  }, []);

  const fetchEquipmentRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/supervisor/equipment_requests");
      const data = await res.json();
      if (data.ok) {
        const formatted = (data.requests || []).map((item: any) => ({
          ...item,
          hasEdited: item.hasEdited || false,
        }));
        setRequests(formatted);
      } else {
        setErrorMsg(data.error || "ไม่สามารถดึงข้อมูลการเบิกได้");
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

  const handleAction = async (id: string, status: string, rejectReason?: string, isEdit = false) => {
    try {
      const targetItem = requests.find(r => r.id === id);
      if (isEdit && targetItem?.hasEdited) {
        alert("รายการนี้ถูกใช้สิทธิแก้ไขครบ 1 ครั้งแล้ว จึงไม่สามารถแก้ไขซ้ำได้อีก");
        return;
      }

      const newHasEdited = isEdit ? true : (targetItem?.hasEdited || false);

      const res = await fetch("/api/supervisor/equipment_requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          status, 
          rejectReason: rejectReason !== undefined ? rejectReason : "",
          hasEdited: newHasEdited 
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setRequests(requests.map(r => r.id === id ? { 
          ...r, 
          status, 
          rejectReason: rejectReason !== undefined ? rejectReason : r.rejectReason,
          hasEdited: newHasEdited 
        } : r));
        setRejectModalOpen(false);
        setSelectedReqId(null);
        setRejectReasonInput("");
      } else {
        alert(data.error || "ไม่สามารถอัปเดตสถานะได้");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const openRejectModal = (id: string) => {
    setSelectedReqId(id);
    setRejectReasonInput("");
    setRejectModalOpen(true);
  };

  const filteredRequests = requests.filter((item) => {
    const st = item.status || "PENDING";
    if (filterStatus === "PENDING" && !(st === "PENDING" || st === "รออนุมัติ")) return false;
    if (filterStatus === "APPROVED" && !(st === "APPROVED" || st === "อนุมัติ")) return false;
    if (filterStatus === "REJECTED" && !(st === "REJECTED" || st === "ไม่อนุมัติ")) return false;

    if (item.createdAt) {
      const d = new Date(item.createdAt);
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
    <div className="w-full min-h-screen bg-slate-100 pb-24">
      {/* Header มือถือ */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded uppercase tracking-wider">
              SUPERVISOR
            </span>
            <h1 className="text-sm font-bold">อนุมัติการเบิกอุปกรณ์</h1>
          </div>
          <button
            onClick={fetchEquipmentRequests}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
          >
            🔄 รีเฟรช
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-3">
        
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-1">
          <h2 className="text-sm font-bold text-slate-900">จัดการคำขอเบิกอุปกรณ์พนักงาน</h2>
          <p className="text-[11px] text-slate-500">
            ตรวจสอบและพิจารณาคำขอเบิกเครื่องแต่งกายและอุปกรณ์ของเจ้าหน้าที่ในสังกัด
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

        {/* แถบตัวกรองสถานะ */}
        <div className="bg-white rounded-2xl shadow-sm p-3 border border-slate-200 flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 ${
              filterStatus === "ALL" 
                ? "bg-slate-900 text-amber-400 shadow-sm" 
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setFilterStatus("PENDING")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 ${
              filterStatus === "PENDING" 
                ? "bg-amber-500 text-slate-950 shadow-sm" 
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            ⏳ รออนุมัติ
          </button>
          <button
            onClick={() => setFilterStatus("APPROVED")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 ${
              filterStatus === "APPROVED" 
                ? "bg-emerald-600 text-white shadow-sm" 
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            ✓ อนุมัติแล้ว
          </button>
          <button
            onClick={() => setFilterStatus("REJECTED")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 ${
              filterStatus === "REJECTED" 
                ? "bg-red-600 text-white shadow-sm" 
                : "bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            ✕ ไม่อนุมัติ
          </button>
        </div>

        {/* รายการคำขอเบิก */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 text-xs">
            <h3 className="font-bold text-slate-800">
              📋 รายการคำขอเบิกอุปกรณ์
            </h3>
            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px]">
              พบ {filteredRequests.length} รายการ
            </span>
          </div>

          {loading ? (
            <div className="text-center text-slate-400 py-8 text-xs animate-pulse">
              กำลังโหลดข้อมูลการเบิกอุปกรณ์...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center text-slate-400 py-10 text-xs bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-xl block">📭</span>
              <span>ไม่พบรายการคำขอเบิกอุปกรณ์ในช่วงเวลาหรือสถานะนี้</span>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((item) => {
                const isPending = !item.status || item.status === "PENDING" || item.status === "รออนุมัติ";
                const isApproved = item.status === "APPROVED" || item.status === "อนุมัติ";
                const isRejected = item.status === "REJECTED" || item.status === "ไม่อนุมัติ";

                return (
                  <div key={item.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs shadow-sm">
                    
                    {/* หัวการ์ด: ชื่อพนักงาน และสถานะ */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">
                          👤 {item.employeeName || "พนักงาน"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          🗓️ {item.date || "-"}
                        </span>
                      </div>

                      {isApproved ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px] shrink-0">
                          ✓ อนุมัติแล้ว
                        </span>
                      ) : isRejected ? (
                        <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full font-bold text-[10px] shrink-0">
                          ✕ ไม่อนุมัติ
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px] animate-pulse shrink-0">
                          ⏳ รออนุมัติ
                        </span>
                      )}
                    </div>

                    {/* รายละเอียดอุปกรณ์ */}
                    <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-slate-800 text-[11px] space-y-1 font-medium">
                      <div className="font-bold text-slate-900 text-xs">📦 รายการ: {item.equipmentName || item.item || "-"}</div>
                      <div>🔢 จำนวน: <span className="font-bold">{item.quantity || 1}</span> ชิ้น</div>
                      {item.reason && <div className="text-slate-500">💬 สาเหตุ: {item.reason}</div>}
                      {item.rejectReason && (
                        <div className="text-red-600 font-semibold pt-1 border-t border-slate-100 mt-1">
                          ❌ เหตุผลที่ไม่อนุมัติ: {item.rejectReason}
                        </div>
                      )}
                    </div>

                    {/* ปุ่มอนุมัติ / ไม่อนุมัติ / แก้ไขได้ 1 ครั้ง */}
                    <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center">
                      {!isPending && !item.hasEdited && (
                        <button
                          onClick={() => handleAction(item.id, isApproved ? "REJECTED" : "APPROVED", "", true)}
                          className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold underline cursor-pointer"
                        >
                          🔄 แก้ไขสถานะใหม่ (ให้สิทธิ 1 ครั้ง)
                        </button>
                      )}
                      {item.hasEdited && (
                        <span className="text-[10px] text-slate-400 italic">🔒 ใช้สิทธิแก้ไขครบ 1 ครั้งแล้ว (ล็อกสถานะถาวร)</span>
                      )}
                      {isPending && (
                        <span className="text-[10px] text-slate-400">รอการพิจารณา</span>
                      )}

                      {(isPending || !item.hasEdited) && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openRejectModal(item.id)}
                            className={`px-3 py-1.5 font-bold rounded-xl text-[11px] border transition cursor-pointer ${
                              isRejected 
                                ? "bg-red-600 text-white border-red-600 shadow-sm" 
                                : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                            }`}
                          >
                            ✕ ไม่อนุมัติ
                          </button>
                          <button
                            onClick={() => {
                              const isAlreadyDecided = !isPending;
                              handleAction(item.id, "APPROVED", "", isAlreadyDecided);
                            }}
                            className={`px-3 py-1.5 font-bold rounded-xl text-[11px] transition cursor-pointer shadow-sm ${
                              isApproved
                                ? "bg-emerald-700 text-white shadow-md"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
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

      {/* Modal กรอกเหตุผลกรณีไม่อนุมัติ */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">❌ ระบุเหตุผลการไม่อนุมัติ</h3>
              <button 
                onClick={() => setRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                กรุณาระบุเหตุผลที่ไม่สามารถอนุมัติคำขอนี้ได้:
              </label>
              <textarea
                rows={3}
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="เช่น อุปกรณ์ในคลังหมด หรือยังไม่ถึงกำหนดเบิก..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  if (selectedReqId) {
                    const target = requests.find(r => r.id === selectedReqId);
                    const isAlreadyDecided = target && target.status && target.status !== "PENDING" && target.status !== "รออนุมัติ";
                    handleAction(selectedReqId, "REJECTED", rejectReasonInput, isAlreadyDecided);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                ยืนยันไม่อนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg max-w-md mx-auto">
        <Link href="/supervisor/dashboard" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📊</span>แดชบอร์ด
        </Link>
        <Link href="/supervisor/leaves" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
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