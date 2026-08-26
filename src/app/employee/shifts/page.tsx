"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function EmployeeShiftsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State สำหรับ ปฏิทิน และ Modal รายละเอียด
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayDetail, setSelectedDayDetail] = useState<{ dayNum: number; records: any[] } | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchShiftsAndAttendance();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/employee/profile");
      const data = await res.json();
      if (data.ok) {
        setProfile(data.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchShiftsAndAttendance = async () => {
    try {
      setLoading(true);
      const resAttendance = await fetch("/api/employee/attendance");
      const dataAttendance = await resAttendance.json();
      if (dataAttendance.ok || dataAttendance.success) {
        setAttendanceHistory(dataAttendance.attendance || []);
      }

      setShifts([
        { date: "18 ส.ค. 2569", shiftName: "กะเช้า (08:00 - 17:00)", location: profile?.branch || "หน่วยงาน A", status: "ปฏิบัติงานปกติ" },
        { date: "19 ส.ค. 2569", shiftName: "กะดึก (20:00 - 05:00)", location: profile?.branch || "หน่วยงาน B", status: "รอดำเนินการ" },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNamesTH = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const getRecordForDay = (dayNum: number) => {
    const targetDateStr = new Date(year, month, dayNum).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    return attendanceHistory.filter((item) => item.date === targetDateStr);
  };

  const userBranchName = profile?.branch || profile?.site || "หน่วยงานประจำตำแหน่ง";

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-orange-500 font-bold text-[10px] rounded uppercase tracking-wider">
              EMPLOYEE
            </span>
            <h1 className="text-sm font-bold">ตารางเวร & ปฏิทินเช็คอิน</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-4">
        
        {/* Calendar View - Minimal Stamp Style */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>📅</span>
              <span>{monthNamesTH[month]} {year + 543}</span>
            </h2>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                ›
              </button>
            </div>
          </div>

          {/* หัววันในสัปดาห์ */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
            <span className="text-red-500">อา</span>
            <span>จ</span>
            <span>อ</span>
            <span>พ</span>
            <span>พฤ</span>
            <span>ศ</span>
            <span className="text-blue-500">ส</span>
          </div>

          {/* ตารางปฏิทินสไตล์แสตมป์ */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12 bg-slate-50/40 rounded-xl" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const records = getRecordForDay(dayNum);
              const hasRecord = records.length > 0;
              const isToday = dayNum === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

              let hasDayShift = false;
              let hasNightShift = false;

              records.forEach((rec) => {
                const checkInTime = rec.checkIn || "";
                const hour = parseInt(checkInTime.split(":")[0] || "0", 10);
                if (hour >= 18 || hour < 6) {
                  hasNightShift = true;
                } else {
                  hasDayShift = true;
                }
              });

              const isBothShifts = hasDayShift && hasNightShift;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => {
                    if (hasRecord) {
                      setSelectedDayDetail({ dayNum, records });
                    }
                  }}
                  className={`h-12 rounded-xl border relative flex flex-col items-center justify-between p-1 transition cursor-pointer ${
                    isToday
                      ? "border-orange-500 bg-orange-50/20 shadow-sm"
                      : hasRecord
                      ? "border-emerald-200 bg-emerald-50/20 hover:border-emerald-400"
                      : "border-slate-100 bg-white"
                  }`}
                >
                  <span className={`text-[10px] font-bold font-mono ${isToday ? "text-orange-600 font-extrabold" : "text-slate-600"}`}>
                    {dayNum}
                  </span>

                  {hasRecord ? (
                    <div className="flex items-center justify-center my-auto">
                      {isBothShifts ? (
                        <div className="px-1 py-0.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full flex items-center gap-0.5 text-[8px] font-bold shadow-sm ring-2 ring-orange-300">
                          <span>☀️</span>
                          <span>🌙</span>
                        </div>
                      ) : hasNightShift ? (
                        <div className="w-5 h-5 rounded-full bg-slate-900 text-amber-300 flex items-center justify-center text-[10px] font-bold shadow-sm ring-2 ring-slate-800">
                          ✓
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm ring-2 ring-emerald-300">
                          ✓
                        </div>
                      )}
                    </div>
                  ) : isToday ? (
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mb-1 animate-ping"></span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-4 text-center text-[9px] text-slate-500 pt-2 border-t gap-1">
            <span className="flex items-center justify-center gap-1">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[7px] font-bold">✓</span>
              <span>กะเช้า</span>
            </span>
            <span className="flex items-center justify-center gap-1">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-amber-300 flex items-center justify-center text-[7px] font-bold">✓</span>
              <span>กะดึก</span>
            </span>
            <span className="flex items-center justify-center gap-1">
              <span className="px-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full text-[7px] font-bold">☀️🌙</span>
              <span>เช้า+ดึก</span>
            </span>
            <span className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span>วันนี้</span>
            </span>
          </div>
        </div>

        {/* รายการตารางเวร */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
            📋 ตารางเวรปฏิบัติงานของคุณ
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
                    <span className="text-[11px] text-slate-500 block">📍 สถานที่: {shift.location || userBranchName}</span>
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

      {/* Modal ป๊อปอัปแสดงรายละเอียด + ชื่อหน่วยงานประจำตำแหน่ง */}
      {selectedDayDetail && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-slate-100 my-auto">
            
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🗓️</span>
                <h3 className="text-xs font-bold text-slate-900">
                  ประวัติเข้างานวันที่ {selectedDayDetail.dayNum} {monthNamesTH[month]} {year + 543}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {selectedDayDetail.records.map((rec, idx) => {
                const checkInTime = rec.checkIn || "";
                const hour = parseInt(checkInTime.split(":")[0] || "0", 10);
                const isNightShift = hour >= 18 || hour < 6;

                return (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    
                    <div className="flex justify-between items-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        isNightShift 
                          ? "bg-slate-900 text-amber-300" 
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {isNightShift ? "🌙 กะดึก" : "☀️ กะเช้า"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {rec.time || checkInTime}
                      </span>
                    </div>

                    {/* แสดงชื่อหน่วยงานประจำตำแหน่ง */}
                    <div className="p-2 bg-orange-50/80 rounded-xl border border-orange-200/80 text-[11px] flex items-center gap-1.5 text-orange-950 font-medium">
                      <span className="text-xs shrink-0">📍</span>
                      <span className="truncate">
                        หน่วยงาน: <strong className="text-orange-900 font-bold">{rec.location || userBranchName}</strong>
                      </span>
                    </div>

                    {/* เวลาเช็คอิน / เช็คเอาท์ */}
                    <div className="grid grid-cols-2 gap-2 text-slate-700 bg-white p-2 rounded-xl border border-slate-100 font-mono text-[11px]">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-sans">เวลาเช็คอิน:</span>
                        <span className="font-bold text-emerald-600">🟢 {rec.checkIn || "-"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-sans">เวลาเช็คเอาท์:</span>
                        <span className="font-bold text-orange-600">🔴 {rec.checkOut || "-"}</span>
                      </div>
                    </div>

                    {rec.images && rec.images.length > 0 && (
                      <div className="flex gap-1.5 overflow-x-auto pt-1">
                        {rec.images.map((imgUrl: string, imgIdx: number) => (
                          <img
                            key={imgIdx}
                            src={imgUrl}
                            alt="Attendance Photo"
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setSelectedDayDetail(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg">
        <Link href="/employee/profile" className="flex flex-col items-center text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">👤</span>
          หน้าแรก
        </Link>
        <Link href="/employee/attendance" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">⏱️</span>
          ลงเวลาทำงาน
        </Link>
        <Link href="/employee/reports" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">🛡️</span>
          รายงาน
        </Link>
        <Link href="/employee/payrolls" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">💵</span>
          เงินเดือน
        </Link>
      </nav>
    </div>
  );
}