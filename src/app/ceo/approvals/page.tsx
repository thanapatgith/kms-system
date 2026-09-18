"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface RequestItem {
  id: string;
  user_id?: string;
  employee_code?: string;
  employee_name?: string;
  applicant_name?: string;
  site_name?: string;
  amount?: number;
  reason?: string;
  leave_type?: string;
  item_name?: string;
  equipment_name?: string;
  quantity?: number;
  status?: string;
  reject_reason?: string;
  bank_name?: string;
  bank_account?: string;
  slip_url?: string;
  created_at?: string;
  type: "loan" | "leave" | "equipment";
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

function formatThaiDateTime(dateString?: string) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate();
    const monthNamesTH = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];
    const month = monthNamesTH[date.getMonth()];
    const year = date.getFullYear() + 543;
    const time = date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

    return `${day} ${month} ${year} (${time} น.)`;
  } catch {
    return dateString;
  }
}

export default function CEOApprovalsPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentPeriod());
  const monthOptions = generateMonthOptions();

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "loan" | "leave" | "equipment">("all");
  const [subDateFilter, setSubDateFilter] = useState<"all" | "today" | "7days" | "custom">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Reject Modal State
  const [rejectingItem, setRejectingItem] = useState<RequestItem | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");

  // Transfer / Slip Modal State
  const [transferringItem, setTransferringItem] = useState<RequestItem | null>(null);
  const [slipUrlInput, setSlipUrlInput] = useState("");

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ceo/approvals?t=${Date.now()}`);
      const json = await res.json();
      if (json.ok) {
        const mappedLoans: RequestItem[] = (json.loans || []).map((item: any) => ({ ...item, type: "loan" }));
        const mappedLeaves: RequestItem[] = (json.leaves || []).map((item: any) => ({ ...item, type: "leave" }));
        const mappedEquipments: RequestItem[] = (json.equipments || []).map((item: any) => ({ ...item, type: "equipment" }));

        setRequests([...mappedLoans, ...mappedLeaves, ...mappedEquipments]);
      }
    } catch (err) {
      console.error("Fetch approvals error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  // กดอนุมัติทันทีโดยไม่ต้องบังคับใส่สลิปก่อน
  const handleApprove = async (item: RequestItem) => {
    try {
      const res = await fetch("/api/ceo/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, type: item.type, status: "APPROVED" }),
      });
      const json = await res.json();
      if (json.ok) fetchApprovals();
    } catch (err) {
      console.error("Approve error:", err);
    }
  };

  // บันทึกสลิปโอนเงิน (ใช้ได้ทั้งตอนที่อนุมัติแล้วหรือกำลังจะแนบเพิ่ม)
  const handleConfirmTransfer = async () => {
    if (!transferringItem) return;
    try {
      const res = await fetch("/api/ceo/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: transferringItem.id,
          type: transferringItem.type,
          status: "APPROVED", // คงสถานะอนุมัติไว้
          slip_url: slipUrlInput.trim(),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setTransferringItem(null);
        setSlipUrlInput("");
        fetchApprovals();
      }
    } catch (err) {
      console.error("Transfer error:", err);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    try {
      const res = await fetch("/api/ceo/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rejectingItem.id,
          type: rejectingItem.type,
          status: "REJECTED",
          reject_reason: rejectReasonInput.trim() || "ไม่ระบุเหตุผล",
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setRejectingItem(null);
        setRejectReasonInput("");
        fetchApprovals();
      }
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  const baseFilteredRequests = requests.filter((item) => {
    let matchesMonth = true;
    if (item.created_at) {
      matchesMonth = item.created_at.substring(0, 7) === selectedMonth;
    }

    let matchesSubDate = true;
    if (item.created_at) {
      const itemDate = new Date(item.created_at);
      const now = new Date();
      const diffTime = now.getTime() - itemDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (subDateFilter === "today") matchesSubDate = diffDays === 0;
      else if (subDateFilter === "7days") matchesSubDate = diffDays <= 7 && diffDays >= 0;
      else if (subDateFilter === "custom" && startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesSubDate = itemDate >= start && itemDate <= end;
      }
    }

    return matchesMonth && matchesSubDate;
  });

  const countAll = baseFilteredRequests.length;
  const countLoan = baseFilteredRequests.filter(i => i.type === "loan").length;
  const countLeave = baseFilteredRequests.filter(i => i.type === "leave").length;
  const countEquipment = baseFilteredRequests.filter(i => i.type === "equipment").length;

  const filteredRequests = baseFilteredRequests.filter((item) => {
    const itemStatus = (item.status || "PENDING").toLowerCase();
    const matchesStatus = activeTab === "all" || itemStatus === activeTab;
    const matchesCategory = categoryFilter === "all" || item.type === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  const totalLoanAmount = filteredRequests
    .filter(i => i.type === "loan")
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/ceo/dashboard" className="text-slate-400 hover:text-white transition">
              ‹
            </Link>
            <h1 className="text-sm font-bold">รายการอนุมัติคำร้อง</h1>
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
      <main className="max-w-md mx-auto px-4 mt-3 space-y-3 flex-1 flex flex-col w-full">
        {/* ตัวกรองสถานะ และช่วงเวลา */}
        <div className="grid grid-cols-2 gap-2 text-xs font-bold shrink-0">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-medium">สถานะ</label>
            <select
              value={activeTab}
              onChange={(e: any) => setActiveTab(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 rounded-xl px-2.5 py-2 text-[11px] shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
            >
              <option value="pending">⏳ รออนุมัติ</option>
              <option value="approved">✅ อนุมัติแล้ว</option>
              <option value="rejected">❌ ปฏิเสธแล้ว</option>
              <option value="all">📑 ทั้งหมด</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-medium">ช่วงเวลา</label>
            <select
              value={subDateFilter}
              onChange={(e: any) => setSubDateFilter(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 rounded-xl px-2.5 py-2 text-[11px] shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
            >
              <option value="all">📅 ทั้งงวด</option>
              <option value="today">⚡ วันนี้</option>
              <option value="7days">🗓️ 7 วันล่าสุด</option>
              <option value="custom">🔍 กำหนดช่วงวันที่</option>
            </select>
          </div>
        </div>

        {subDateFilter === "custom" && (
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2 shrink-0">
            <span className="text-[10px] font-bold text-slate-600 block">เลือกช่วงวันที่ต้องการตรวจสอบ:</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-slate-400 block mb-0.5">จากวันที่</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-0.5">ถึงวันที่</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* แถบสรุปจำนวนประเภท */}
        <div className="grid grid-cols-4 gap-1 text-[11px] shrink-0">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`py-2 px-1 rounded-xl font-bold border transition text-center cursor-pointer flex flex-col items-center justify-center ${
              categoryFilter === "all"
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>ทั้งหมด</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full mt-0.5 ${categoryFilter === "all" ? "bg-amber-400 text-slate-950 font-black" : "bg-slate-100 text-slate-600"}`}>
              {countAll}
            </span>
          </button>

          <button
            onClick={() => setCategoryFilter("loan")}
            className={`py-2 px-1 rounded-xl font-bold border transition text-center cursor-pointer flex flex-col items-center justify-center ${
              categoryFilter === "loan"
                ? "bg-purple-700 text-white border-purple-700 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>เงินล่วงหน้า</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full mt-0.5 ${categoryFilter === "loan" ? "bg-amber-300 text-slate-950 font-black" : "bg-purple-50 text-purple-700"}`}>
              {countLoan}
            </span>
          </button>

          <button
            onClick={() => setCategoryFilter("leave")}
            className={`py-2 px-1 rounded-xl font-bold border transition text-center cursor-pointer flex flex-col items-center justify-center ${
              categoryFilter === "leave"
                ? "bg-blue-700 text-white border-blue-700 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>ขอลาหยุด</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full mt-0.5 ${categoryFilter === "leave" ? "bg-amber-300 text-slate-950 font-black" : "bg-blue-50 text-blue-700"}`}>
              {countLeave}
            </span>
          </button>

          <button
            onClick={() => setCategoryFilter("equipment")}
            className={`py-2 px-1 rounded-xl font-bold border transition text-center cursor-pointer flex flex-col items-center justify-center ${
              categoryFilter === "equipment"
                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>เบิกของ</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full mt-0.5 ${categoryFilter === "equipment" ? "bg-slate-900 text-amber-300 font-black" : "bg-amber-50 text-amber-800"}`}>
              {countEquipment}
            </span>
          </button>
        </div>

        {/* กล่องสรุปยอดรวมเงิน */}
        {(categoryFilter === "all" || categoryFilter === "loan") && (
          <div className="bg-gradient-to-r from-purple-900 to-slate-900 text-white p-3.5 rounded-2xl shadow-md flex justify-between items-center shrink-0 border border-purple-800">
            <div>
              <p className="text-[10px] text-purple-300 font-medium">💰 ยอดรวมเงินล่วงหน้าตามเงื่อนไข</p>
              <p className="text-lg font-black font-mono text-amber-300">฿{totalLoanAmount.toLocaleString("th-TH")}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-purple-800/80 px-2 py-1 rounded-lg border border-purple-700 text-purple-200">
                {filteredRequests.filter(i => i.type === "loan").length} รายการ
              </span>
            </div>
          </div>
        )}

        {/* รายการคำร้อง */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700 shrink-0">
            <span>แสดงผลอยู่ ({filteredRequests.length} รายการ)</span>
            <span className="text-[10px] text-amber-600 font-bold">CEO Approval Panel</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">กำลังโหลดคำร้องจาก Database...</div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1 max-h-[calc(100vh-360px)]">
              {filteredRequests.map((item) => {
                const currentStatus = (item.status || "PENDING").toUpperCase();
                const isPending = currentStatus === "PENDING";
                const isApproved = currentStatus === "APPROVED";
                const isRejected = currentStatus === "REJECTED";

                const equipmentName = item.item_name || item.equipment_name || item.reason || "อุปกรณ์ทั่วไป";

                return (
                  <div key={item.id} className="p-4 space-y-3 hover:bg-slate-50 transition">
                    {/* ส่วนหัว */}
                    <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-2">
                      <div className="space-y-1">
                        <h2 className="text-sm font-extrabold text-slate-900">{item.employee_name || item.applicant_name || "ไม่ระบุชื่อ"}</h2>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            รหัส: {item.employee_code || item.user_id || "-"}
                          </span>
                          <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            📍 {item.site_name || "สำนักงานใหญ่"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 pt-0.5">
                          📅 ยื่นเมื่อ: {formatThaiDateTime(item.created_at)}
                        </p>
                      </div>
                      
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                          isApproved
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : isRejected
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {isApproved ? "✅ อนุมัติแล้ว" : isRejected ? "❌ ปฏิเสธแล้ว" : "⏳ รออนุมัติ"}
                      </span>
                    </div>

                    {/* ส่วนเนื้อหา */}
                    <div className="space-y-1.5 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">ประเภทคำร้อง:</span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            item.type === "loan"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : item.type === "leave"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {item.type === "loan"
                            ? "💸 เงินล่วงหน้า"
                            : item.type === "leave"
                            ? "📅 ขอลาหยุด"
                            : "📦 เบิกอุปกรณ์"}
                        </span>
                      </div>

                      {/* รายละเอียดเงินล่วงหน้า */}
                      {item.type === "loan" && (
                        <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                          <p className="text-slate-700 font-medium">
                            ยอดเงินที่เบิก: <strong className="text-emerald-600 font-mono text-sm">฿{Number(item.amount || 0).toLocaleString("th-TH")}</strong>
                          </p>
                          <div className="p-2 bg-white rounded-lg border border-slate-200 text-[11px] space-y-0.5">
                            <p className="text-slate-600 font-semibold">🏦 บัญชีรับเงินพนักงาน:</p>
                            <p className="text-slate-900 font-mono font-bold">
                              ธนาคาร: <span className="text-blue-700">{item.bank_name || "-"}</span> | เลขที่บัญชี: <span className="text-slate-900">{item.bank_account || "-"}</span>
                            </p>
                          </div>
                          {item.reason && (
                            <p className="text-slate-600">
                              เหตุผลการเบิก: <span className="text-slate-800">{item.reason}</span>
                            </p>
                          )}
                          
                          {/* แสดงสลิป หรือปุ่มแนบสลิปแยกต่างหาก */}
                          <div className="pt-1 flex flex-wrap items-center gap-2">
                            {item.slip_url ? (
                              <a
                                href={item.slip_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                              >
                                <span>📄 ดูสลิปโอนเงินที่แนบไว้</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                ⚠️ ยังไม่ได้แนบสลิป
                              </span>
                            )}

                            {/* ปุ่มเพิ่ม/แก้ไขสลิป (แสดงเฉพาะตอนที่อนุมัติแล้ว และเป็นประเภท loan) */}
                            {isApproved && (
                              <button
                                onClick={() => {
                                  setTransferringItem(item);
                                  setSlipUrlInput(item.slip_url || "");
                                }}
                                className="text-[10px] bg-slate-800 hover:bg-slate-900 text-white font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                              >
                                {item.slip_url ? "✏️ แก้ไขสลิป" : "+ แนบสลิปโอนเงิน"}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {item.type === "leave" && (
                        <div className="space-y-1 pt-1 border-t border-slate-200/60">
                          <p className="text-slate-700 font-medium">
                            ประเภทการลา: <strong className="text-slate-900">{item.leave_type || "ลาหยุด"}</strong>
                          </p>
                          {item.reason && (
                            <p className="text-slate-600">
                              เหตุผลการลา: <span className="text-slate-800">{item.reason}</span>
                            </p>
                          )}
                        </div>
                      )}

                      {item.type === "equipment" && (
                        <div className="space-y-1 pt-1 border-t border-slate-200/60">
                          <p className="text-slate-700 font-medium">
                            รายการอุปกรณ์: <strong className="text-slate-900">{equipmentName}</strong> {item.quantity ? `(${item.quantity} ชิ้น)` : ""}
                          </p>
                          {item.reason && (
                            <p className="text-slate-600">
                              เหตุผลการเบิก: <span className="text-slate-800">{item.reason}</span>
                            </p>
                          )}
                        </div>
                      )}

                      {isRejected && item.reject_reason && (
                        <div className="pt-1 mt-1 border-t border-rose-200">
                          <p className="text-rose-600 font-semibold text-[11px]">
                            ❌ เหตุผลที่ไม่อนุมัติ: <span className="font-normal">{item.reject_reason}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* ส่วนปุ่มดำเนินการ (สำหรับสถานะรออนุมัติ) */}
                    {isPending && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleApprove(item)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl transition shadow-sm cursor-pointer text-center"
                        >
                          ✓ อนุมัติทันที
                        </button>
                        <button
                          onClick={() => {
                            setRejectingItem(item);
                            setRejectReasonInput("");
                          }}
                          className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold py-2 rounded-xl transition shadow-sm cursor-pointer text-center"
                        >
                          ✕ ไม่อนุมัติ
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredRequests.length === 0 && (
                <div className="p-16 text-center text-slate-400 text-xs">ไม่พบรายการคำร้องตามเงื่อนไขนี้</div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal แนบ/แก้ไขสลิปโอนเงิน */}
      {transferringItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <span>📄</span> แนบ / อัปเดตสลิปโอนเงิน
              </h3>
              <button
                onClick={() => setTransferringItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">{transferringItem.employee_name}</p>
              <p className="text-slate-600">ยอดเงินเบิก: <strong className="text-emerald-600 font-mono">฿{Number(transferringItem.amount || 0).toLocaleString("th-TH")}</strong></p>
              <div className="pt-1 border-t border-slate-200 text-[11px] text-slate-700">
                <p>ธนาคาร: <strong className="text-blue-700">{transferringItem.bank_name || "-"}</strong></p>
                <p>เลขบัญชี: <strong className="font-mono">{transferringItem.bank_account || "-"}</strong></p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">ลิงก์รูปภาพสลิปโอนเงิน (URL):</label>
              <input
                type="text"
                placeholder="วางลิงก์รูปภาพสลิป เช่น https://..."
                value={slipUrlInput}
                onChange={(e) => setSlipUrlInput(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-900"
              />
              <span className="text-[10px] text-slate-400 block">วาง URL รูปภาพสลิปหลักฐานการโอนเงิน</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setTransferringItem(null)}
                className="flex-1 bg-slate-100 text-slate-600 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-200 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmTransfer}
                className="flex-1 bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-emerald-700 transition cursor-pointer shadow-sm"
              >
                ✓ บันทึกสลิป
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ป๊อปอัปกรอกเหตุผลกรณีไม่อนุมัติ */}
      {rejectingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-rose-600 flex items-center gap-1">
                <span>⚠️</span> ระบุเหตุผลที่ไม่ไม่อนุมัติคำร้อง
              </h3>
              <button
                onClick={() => setRejectingItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-700 font-medium">
              พนักงาน: <span className="font-bold text-slate-900">{rejectingItem.employee_name || rejectingItem.applicant_name}</span>
            </p>

            <textarea
              rows={3}
              placeholder="กรอกเหตุผลที่ไม่สามารถอนุมัติคำร้องนี้ได้..."
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-slate-900 placeholder:text-slate-400"
            />

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setRejectingItem(null)}
                className="flex-1 bg-slate-100 text-slate-600 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-200 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 bg-rose-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-rose-700 transition cursor-pointer shadow-sm"
              >
                ยืนยันไม่อนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg max-w-md mx-auto">
        <Link href="/ceo/dashboard" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📊</span>แดชบอร์ด
        </Link>
        <Link href="/ceo/revenue" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">💵</span>รายรับลูกค้า
        </Link>
        <Link href="/ceo/payroll" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">💳</span>เงินเดือน
        </Link>
        <Link href="/ceo/reports" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📝</span>รายงาน
        </Link>
      </nav>
    </div>
  );
}