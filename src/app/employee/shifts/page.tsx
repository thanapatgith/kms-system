"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function EmployeeShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      // จำลองข้อมูลตารางเวร หรือดึงจาก API (หากมี API รองรับ)
      // หากยังไม่มี API สามารถใช้ Mock data แสดงผลตัวอย่างไปก่อนได้ครับ
      setShifts([
        { date: "9 ส.ค. 2569", shiftName: "กะเช้า (08:00 - 17:00)", location: "หน่วยงาน A", status: "ปฏิบัติงานปกติ" },
        { date: "10 ส.ค. 2569", shiftName: "กะดึก (20:00 - 05:00)", location: "หน่วยงาน B", status: "รอดำเนินการ" },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
            <h1 className="text-sm font-bold">ตารางเวรการทำงาน</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-4">
        
        {/* การ์ดหัวข้อ */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">ตารางผลัดและเวรประจำสัปดาห์</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">ตรวจสอบตารางเวลาและสถานที่ปฏิบัติงานของคุณ</p>
        </div>

        {/* รายการตารางเวร */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
            📅 ตารางเวรของคุณ
          </h3>

          {loading ? (
            <div className="text-center text-slate-400 py-6 text-xs animate-pulse">กำลังโหลดข้อมูล...</div>
          ) : shifts.length === 0 ? (
            <div className="text-center text-slate-400 py-6 text-xs">ยังไม่มีตารางเวรในระบบ</div>
          ) : (
            <div className="space-y-2.5">
              {shifts.map((shift, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block text-sm">{shift.date}</span>
                    <span className="text-orange-600 font-semibold block">{shift.shiftName}</span>
                    <span className="text-[11px] text-slate-500 block">📍 สถานที่: {shift.location}</span>
                  </div>
                  <div>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold text-[10px]">
                      {shift.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg">
        <Link href="/employee/profile" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">👤</span>
          หน้าแรก
        </Link>
        <Link href="/employee/leaves" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📝</span>
          ระบบลา
        </Link>
        <Link href="/employee/attendance" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">⏱️</span>
          ลงเวลาทำงาน
        </Link>
        <Link href="/employee/shifts" className="flex flex-col items-center text-orange-400 text-[10px] font-bold transition">
          <span className="text-base mb-0.5">📅</span>
          ตารางเวร
        </Link>
      </nav>
    </div>
  );
}