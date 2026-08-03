"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SupervisorDashboardPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchSupervisorData();
  }, []);

  const fetchSupervisorData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/supervisor/reports");
      const data = await res.json();
      if (data.ok) {
        setReports(data.reports || []);
      } else {
        setErrorMsg(data.error || "ไม่สามารถดึงข้อมูลได้");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
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
            <Link href="/supervisor/dashboard" className="px-2.5 py-2 bg-slate-800 text-amber-400 rounded-lg">
              รายงาน Logbook
            </Link>
            <Link href="/supervisor/leaves" className="px-2.5 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
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
        
        {/* Header Stats / Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">รายการรายงานการปฏิบัติงานจากพนักงาน</h2>
            <p className="text-sm text-slate-500 mt-1">ตรวจสอบสถานะการตรวจรอบพื้นที่และเหตุการณ์ประจำวันของเจ้าหน้าที่รักษาความปลอดภัย</p>
          </div>
          <button
            onClick={fetchSupervisorData}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
          >
            🔄 รีเฟรชข้อมูล
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium text-center">
            {errorMsg}
          </div>
        )}

        {/* Reports Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-base">ประวัติการรายงานทั้งหมด (Logbook)</h3>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
              ทั้งหมด {reports.length} รายการ
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-600 tracking-wider">
                  <th className="p-4 md:px-6">เจ้าหน้าที่</th>
                  <th className="p-4 md:px-6">วันที่ / เวลา</th>
                  <th className="p-4 md:px-6">ข้อความรายงานสถานการณ์</th>
                  <th className="p-4 md:px-6">พิกัด GPS</th>
                  <th className="p-4 md:px-6 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 animate-pulse">
                      กำลังโหลดข้อมูลรายงาน...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      ยังไม่มีรายงานการปฏิบัติงานส่งเข้ามาในระบบ
                    </td>
                  </tr>
                ) : (
                  reports.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition">
                      <td className="p-4 md:px-6 text-slate-900 font-bold">
                        {item.employeeName}
                      </td>
                      <td className="p-4 md:px-6 text-slate-600 whitespace-nowrap">
                        {item.date} <span className="text-amber-600 font-bold ml-1">{item.time}</span>
                      </td>
                      <td className="p-4 md:px-6 text-slate-800 font-medium">
                        {item.message}
                      </td>
                      <td className="p-4 md:px-6 text-xs font-mono text-slate-500 whitespace-nowrap">
                        {item.location}
                      </td>
                      <td className="p-4 md:px-6 text-center">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-xs">
                          รับทราบแล้ว
                        </span>
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