"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function EmployeeLeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: "SICK",
    startDate: "",
    durationDays: 1,
    reason: "",
  });

  const fetchLeaves = async () => {
    try {
      const res = await fetch("/api/employee/leaves");
      const data = await res.json();
      if (data.ok || data.success) {
        setLeaves(data.leaves || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // คำนวณจำนวนวันลาสะสมที่อนุมัติ/รออนุมัติ ในปีปัจจุบัน
  const currentYear = new Date().getFullYear();
  const totalLeaveDaysThisYear = leaves.reduce((sum, item) => {
    const itemYear = new Date(item.startDate).getFullYear();
    if (itemYear === currentYear && item.status !== "REJECTED") {
      return sum + (Number(item.durationDays) || 0);
    }
    return sum;
  }, 0);

  // คำนวณวันลารวมหลังจากการยื่นครั้งนี้
  const newTotalLeaveDays = totalLeaveDaysThisYear + Number(formData.durationDays || 0);
  const isOverYearlyLimit = newTotalLeaveDays >= 3;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/employee/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || (!data.ok && !data.success)) {
        throw new Error(data.error || "ไม่สามารถยื่นใบลาได้");
      }

      setSuccessMsg("ยื่นใบลาสำเร็จ!");
      setFormData({ leaveType: "SICK", startDate: "", durationDays: 1, reason: "" });
      setShowModal(false);
      fetchLeaves();
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24">
      {/* Header ด้านบน */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-orange-500 font-bold text-[10px] rounded uppercase tracking-wider">
              EMPLOYEE
            </span>
            <h1 className="text-sm font-bold">ระบบลาพนักงาน</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-3">
        
        {/* การ์ดสรุปวันลาสะสมประจำปี */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg flex justify-between items-center">
          <div>
            <p className="text-[11px] text-slate-400 font-medium">วันลาสะสมรวมปี {currentYear}</p>
            <h2 className="text-2xl font-extrabold text-orange-400 font-mono mt-0.5">
              {totalLeaveDaysThisYear} <span className="text-xs text-slate-300 font-normal">วัน</span>
            </h2>
          </div>
          <div className="text-right">
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
              totalLeaveDaysThisYear >= 3 
                ? "bg-red-500/20 text-red-300 border-red-500/30" 
                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
            }`}>
              {totalLeaveDaysThisYear >= 3 ? "⚠️ เกินเกณฑ์สิทธิ์วันหยุดพิเศษ" : "✓ ได้รับสิทธิ์วันหยุดพิเศษ"}
            </span>
            <p className="text-[9px] text-slate-400 mt-1">* สะสมไม่เกิน 3 วัน/ปี</p>
          </div>
        </div>

        {/* หัวข้อและปุ่มยื่นใบลา */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-900">ยื่นคำขอลา</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">ลาป่วย, ลากิจ, ลาพักร้อน</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
          >
            + ยื่นใบลาใหม่
          </button>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium text-center">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        {/* ประวัติการยื่นใบลา */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
            📋 ประวัติการยื่นใบลาของคุณ
          </h3>

          {loading ? (
            <div className="text-center text-slate-400 py-6 text-xs animate-pulse">กำลังโหลดข้อมูล...</div>
          ) : leaves.length === 0 ? (
            <div className="text-center text-slate-400 py-6 text-xs">ยังไม่มีประวัติการยื่นใบลา</div>
          ) : (
            <div className="space-y-2.5">
              {leaves.map((leave) => (
                <div key={leave.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block text-sm">
                      {leave.leaveType === "SICK" && "ลาป่วย"}
                      {leave.leaveType === "PERSONAL" && "ลากิจ"}
                      {leave.leaveType === "VACATION" && "ลาพักร้อน"}
                      {leave.leaveType === "MATERNITY" && "ลาคลอด"}
                    </span>
                    <span className="text-[11px] text-slate-600 block">
                      {new Date(leave.startDate).toLocaleDateString("th-TH")} (ลา {leave.durationDays} วัน)
                    </span>
                    <span className="text-[10px] text-slate-400 italic">
                      เหตุผล: {leave.reason || "-"}
                    </span>
                  </div>
                  <div>
                    {leave.status === "PENDING" && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px] uppercase">
                        รออนุมัติ
                      </span>
                    )}
                    {leave.status === "APPROVED" && (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px] uppercase">
                        อนุมัติแล้ว
                      </span>
                    )}
                    {leave.status === "REJECTED" && (
                      <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full font-bold text-[10px] uppercase">
                        ไม่อนุมัติ
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal ยื่นใบลา */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">ยื่นคำขอลาใหม่</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">ประเภทการลา *</label>
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="SICK">ลาป่วย</option>
                  <option value="PERSONAL">ลากิจ</option>
                  <option value="VACATION">ลาพักร้อน</option>
                  <option value="MATERNITY">ลาคลอด</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 uppercase mb-1">วันที่เริ่มต้น *</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleChange}
                    onClick={(e) => {
                      try {
                        (e.target as HTMLInputElement).showPicker();
                      } catch (err) {}
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 uppercase mb-1">จำนวนวันลา *</label>
                  <input
                    type="number"
                    name="durationDays"
                    min="1"
                    required
                    value={formData.durationDays}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              {/* แจ้งเตือนสิทธิ์วันหยุดพิเศษเมื่อยอดสะสมรวม >= 3 วัน */}
              <div className={`p-3 rounded-xl text-[11px] space-y-1 transition ${
                isOverYearlyLimit
                  ? "bg-amber-100 border border-amber-300 text-amber-950 font-medium shadow-sm"
                  : "bg-amber-50 border border-amber-200 text-amber-800"
              }`}>
                <div className="flex justify-between items-center font-bold text-amber-900">
                  <span>⚠️ เงื่อนไขเงินพิเศษวันนักขัตฤกษ์</span>
                  <span className="text-[10px] font-mono bg-amber-200 px-1.5 py-0.5 rounded">
                    สะสมปีนี้: {newTotalLeaveDays} วัน
                  </span>
                </div>
                <p className="leading-tight">
                  {isOverYearlyLimit ? (
                    <strong className="text-red-600 block">
                      หากยื่นรายการนี้ ยอดวันลาสะสมในปี {currentYear} จะเป็น {newTotalLeaveDays} วัน (ตั้งแต่ 3 วันขึ้นไป) ซึ่งจะไม่ได้รับค่าจ้างพิเศษในวันนักขัตฤกษ์
                    </strong>
                  ) : (
                    `ปัจจุบันลาไปแล้ว ${totalLeaveDaysThisYear} วัน หากลาสะสมรวมใน 1 ปี ถึง 3 วันขึ้นไป จะไม่ได้รับค่าจ้างพิเศษวันนักขัตฤกษ์`
                  )}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">เหตุผลความจำเป็น *</label>
                <textarea
                  name="reason"
                  required
                  rows={3}
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="ระบุเหตุผลในการลา..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-40 cursor-pointer"
                >
                  {submitting ? "กำลังส่ง..." : "ยืนยันการยื่นลา"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg">
        <Link href="/employee/profile" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">👤</span>
          หน้าแรก
        </Link>
        <Link href="/employee/leaves" className="flex flex-col items-center text-orange-400 text-[10px] font-bold transition">
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