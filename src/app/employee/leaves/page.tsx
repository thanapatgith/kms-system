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

  // ดึงประวัติการลาของพนักงาน
  const fetchLeaves = async () => {
    try {
      const res = await fetch("/api/employee/leaves");
      const data = await res.json();
      if (data.ok) {
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

      if (!res.ok || !data.ok) {
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
    <div className="w-full min-h-screen bg-slate-100 pb-12">
      {/* Navbar */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-orange-500 font-bold text-xs rounded-lg uppercase tracking-wider">
              EMPLOYEE
            </span>
            <h1 className="text-lg font-bold">KMS Employee Portal</h1>
          </div>

          <nav className="flex items-center gap-2 flex-wrap justify-center text-sm font-semibold">
            <Link href="/employee/profile" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              หน้าแรก / โปรไฟล์
            </Link>
            <Link href="/employee/leaves" className="px-3 py-2 bg-slate-800 text-orange-400 rounded-lg">
              ระบบลา
            </Link>
            <Link href="/employee/attendance" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              ลงเวลาทำงาน
            </Link>
            <Link href="/employee/shifts" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              ตารางเวร
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">ระบบลาพนักงาน</h2>
            <p className="text-sm text-slate-500 mt-1">ยื่นคำขอลาและตรวจสอบสถานะการอนุมัติย้อนหลัง</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer"
          >
            + ยื่นใบลาใหม่
          </button>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium text-center">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium text-center">
            {errorMsg}
          </div>
        )}

        {/* Leaves Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-base">ประวัติการยื่นใบลาของคุณ</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-600 tracking-wider">
                  <th className="p-4 md:px-6">ประเภทการลา</th>
                  <th className="p-4 md:px-6">วันที่เริ่มต้น / ระยะเวลา</th>
                  <th className="p-4 md:px-6">เหตุผล</th>
                  <th className="p-4 md:px-6 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : leaves.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      ยังไม่มีประวัติการยื่นใบลา
                    </td>
                  </tr>
                ) : (
                  leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 md:px-6 font-bold text-slate-900">
                        {leave.leaveType === "SICK" && "ลาป่วย"}
                        {leave.leaveType === "PERSONAL" && "ลากิจ"}
                        {leave.leaveType === "VACATION" && "ลาพักร้อน"}
                        {leave.leaveType === "MATERNITY" && "ลาคลอด"}
                      </td>
                      <td className="p-4 md:px-6 text-slate-600 text-xs">
                        {new Date(leave.startDate).toLocaleDateString("th-TH")} (ลา {leave.durationDays} วัน)
                      </td>
                      <td className="p-4 md:px-6 text-slate-600 max-w-xs truncate">
                        {leave.reason || "-"}
                      </td>
                      <td className="p-4 md:px-6 text-center">
                        {leave.status === "PENDING" && (
                          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-xs uppercase">
                            รออนุมัติ
                          </span>
                        )}
                        {leave.status === "APPROVED" && (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-xs uppercase">
                            อนุมัติแล้ว
                          </span>
                        )}
                        {leave.status === "REJECTED" && (
                          <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full font-bold text-xs uppercase">
                            ไม่อนุมัติ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Modal ยื่นใบลา */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-xl font-bold text-slate-900">ยื่นคำขอลาใหม่</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">ประเภทการลา *</label>
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="SICK">ลาป่วย</option>
                  <option value="PERSONAL">ลากิจ</option>
                  <option value="VACATION">ลาพักร้อน</option>
                  <option value="MATERNITY">ลาคลอด</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">วันที่เริ่มต้น *</label>
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">จำนวนวันลา *</label>
                  <input
                    type="number"
                    name="durationDays"
                    min="1"
                    required
                    value={formData.durationDays}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">เหตุผลความจำเป็น *</label>
                <textarea
                  name="reason"
                  required
                  rows={3}
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="ระบุเหตุผลในการลา..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "กำลังส่งคำขอ..." : "ยืนยันการยื่นลา"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}