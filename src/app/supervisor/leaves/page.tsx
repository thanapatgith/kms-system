"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SupervisorLeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/supervisor/leaves");
      const data = await res.json();
      if (data.ok) {
        setLeaves(data.leaves || []);
      } else {
        setErrorMsg(data.error || "ไม่สามารถดึงข้อมูลใบลาได้");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
    try {
      setActionLoading(leaveId);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch("/api/supervisor/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId, status }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "ไม่สามารถอัปเดตสถานะได้");
      }

      setSuccessMsg(data.message);
      fetchLeaves();
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-12">
      {/* Navbar สำหรับ Supervisor */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-amber-500 font-bold text-xs rounded-lg uppercase tracking-wider text-slate-950">
              SUPERVISOR
            </span>
            <h1 className="text-lg font-bold">KMS Management Portal</h1>
          </div>

          <nav className="flex items-center gap-1.5 flex-wrap justify-center text-xs font-semibold">
            <Link href="/supervisor/dashboard" className="px-2.5 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              แดชบอร์ดภาพรวม
            </Link>
            <Link href="/supervisor/logbook" className="px-2.5 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              รายงาน Logbook
            </Link>
            <Link href="/supervisor/leaves" className="px-2.5 py-2 bg-slate-800 text-amber-400 rounded-lg">
              อนุมัติใบลา
            </Link>
            <Link href="/supervisor/shifts" className="px-2.5 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              ตารางเวร/แทน
            </Link>
            <Link href="/supervisor/attendance" className="px-2.5 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              ตรวจสอบลงเวลา
            </Link>
            <Link href="/supervisor/patrol" className="px-2.5 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              ลงชื่อตรวจตรา
            </Link>
            <Link href="/supervisor/equipment" className="px-2.5 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              อนุมัติเบิกอุปกรณ์
            </Link>
            <Link href="/employee/profile" className="px-2.5 py-2 bg-slate-800/60 hover:bg-slate-800 text-amber-200 rounded-lg transition ml-1">
              หน้าพนักงาน
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
        
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">จัดการคำขออนุมัติวันลาของพนักงาน</h2>
            <p className="text-sm text-slate-500 mt-1">ตรวจสอบเหตุผลการลา และกดอนุมัติหรือปฏิเสธคำขอของเจ้าหน้าที่ในสังกัด</p>
          </div>
          <button
            onClick={fetchLeaves}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
          >
            🔄 รีเฟรชข้อมูล
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
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-base">ประวัติและคำขอลาทั้งหมด</h3>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
              ทั้งหมด {leaves.length} รายการ
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-600 tracking-wider">
                  <th className="p-4 md:px-6">พนักงาน</th>
                  <th className="p-4 md:px-6">ประเภทการลา</th>
                  <th className="p-4 md:px-6">ช่วงวันที่ลา</th>
                  <th className="p-4 md:px-6">เหตุผลการลา</th>
                  <th className="p-4 md:px-6 text-center">สถานะ</th>
                  <th className="p-4 md:px-6 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 animate-pulse">
                      กำลังโหลดข้อมูลใบลา...
                    </td>
                  </tr>
                ) : leaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      ยังไม่มีคำขอลาในระบบ
                    </td>
                  </tr>
                ) : (
                  leaves.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 md:px-6 text-slate-900 font-bold whitespace-nowrap">
                        {item.employeeName}
                      </td>
                      <td className="p-4 md:px-6 text-slate-800 font-semibold whitespace-nowrap">
                        {item.leaveType}
                      </td>
                      <td className="p-4 md:px-6 text-slate-600 text-xs whitespace-nowrap">
                        {item.startDate} ถึง {item.endDate}
                      </td>
                      <td className="p-4 md:px-6 text-slate-700 max-w-xs truncate">
                        {item.reason}
                      </td>
                      <td className="p-4 md:px-6 text-center whitespace-nowrap">
                        {item.status === "PENDING" && (
                          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-xs">
                            รออนุมัติ
                          </span>
                        )}
                        {item.status === "APPROVED" && (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-xs">
                            อนุมัติแล้ว
                          </span>
                        )}
                        {item.status === "REJECTED" && (
                          <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full font-bold text-xs">
                            ไม่อนุมัติ
                          </span>
                        )}
                      </td>
                      <td className="p-4 md:px-6 text-center whitespace-nowrap">
                        {item.status === "PENDING" ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleUpdateStatus(item.id, "APPROVED")}
                              disabled={actionLoading === item.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition cursor-pointer disabled:opacity-50 shadow-sm"
                            >
                              อนุมัติ
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(item.id, "REJECTED")}
                              disabled={actionLoading === item.id}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition cursor-pointer disabled:opacity-50 shadow-sm"
                            >
                              ปฏิเสธ
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">จัดการแล้ว</span>
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
    </div>
  );
}