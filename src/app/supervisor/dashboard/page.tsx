"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SalarySummaryCard from "@/components/SalarySummaryCard";

export default function SupervisorDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [loanSummary, setLoanSummary] = useState({
    totalBorrowedThisMonth: 0,
    remainingCredit: 10000,
  });
  const [leavesCount] = useState(4);

  const [showNotiModal, setShowNotiModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    { id: "noti-1", title: "มีคำขออนุมัติใบลารอการพิจารณา", message: "พนักงานในสังกัดได้ยื่นคำขอลาใหม่ กรุณาตรวจสอบ", time: "10 นาทีที่แล้ว", is_read: false },
    { id: "noti-2", title: "คำขอเบิกอุปกรณ์ใหม่", message: "มีรายการขอเบิกอุปกรณ์จากพนักงานรอการอนุมัติ", time: "1 ชั่วโมงที่แล้ว", is_read: false },
  ]);

  useEffect(() => {
    fetchProfileData();
  }, []);

  // ใช้หลักการดึงข้อมูลแบบเดียวกับฝั่งพนักงาน
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const resProfile = await fetch("/api/employee/profile");
      const dataProfile = await resProfile.json();
      if (dataProfile.ok) setProfile(dataProfile.user);

      const resLoan = await fetch("/api/employee/loans");
      const dataLoan = await resLoan.json();
      if (dataLoan.success) {
        setLoanSummary({
          totalBorrowedThisMonth: dataLoan.totalBorrowedThisMonth || 0,
          remainingCredit: dataLoan.remainingCredit || 10000,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ใช้สูตรคำนวณตัวเลขและเรตค่าจ้างแบบเดียวกับฝั่งพนักงานเป๊ะๆ
  const dailyWage = Math.round(profile?.dailyRate || 560);
  const workedDays = profile?.workedDays || 5; // จะวิ่งตามรอบปฏิทินที่หลังบ้านคำนวณให้ทันที
  const grossEarnings = Math.round(profile?.grossIncome || (workedDays * dailyWage));
  const totalDeduction = Math.round(profile?.totalDeductions || 0);
  const netSalaryPayable = Math.round((profile?.netSalary || grossEarnings) - totalDeduction);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24 text-base font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-amber-500 font-extrabold text-sm rounded-lg uppercase tracking-wider text-slate-950 shadow">
              SUPERVISOR
            </span>
            <h1 className="text-lg font-bold">ผู้ควบคุมงาน</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/supervisor/settings"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-sm font-bold transition flex items-center gap-1.5 shadow border border-slate-700 cursor-pointer"
            >
              <span className="text-base">👤</span>
              <span className="max-w-[100px] truncate">{profile?.name || "ผู้ควบคุมงาน"}</span>
            </Link>

            <button
              onClick={() => setShowNotiModal(true)}
              className="relative p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition shadow border border-slate-700 cursor-pointer"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-5 space-y-4">
        
        {/* ใช้ Component ร่วมกันกับการ์ดสรุปยอดเงินและวันทำงาน */}
        <SalarySummaryCard
          name={profile?.name}
          siteName={profile?.siteName || profile?.branch}
          workedDays={workedDays}
          grossEarnings={grossEarnings}
          totalDeductions={totalDeduction}
          netSalary={netSalaryPayable}
          roleLabel="SUPERVISOR"
          roleBadgeBg="bg-amber-500"
          roleBadgeText="text-slate-950"
        />

        {/* สรุปสิทธิ์ 2 ช่อง */}
        <div className="grid grid-cols-2 gap-3.5">
          <Link href="/supervisor/apply-leave" className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-sm space-y-2 hover:border-amber-500 transition">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-800 text-sm">📝 วันลาสะสม</span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
                ปกติ
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {leavesCount} <span className="text-xs text-slate-500 font-normal">วัน</span>
            </p>
          </Link>

          <Link href="/supervisor/loans" className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-sm space-y-2 hover:border-amber-500 transition">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-800 text-sm">💰 กู้ได้อีก</span>
              <span className="text-amber-600 font-extrabold text-xs">รอบนี้</span>
            </div>
            <p className="text-xl font-black text-amber-600 font-mono">
              ฿{loanSummary.remainingCredit.toLocaleString()}
            </p>
          </Link>
        </div>

        {/* 🛡️ เมนูจัดการผู้ควบคุมงาน (พิเศษ) */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 px-1">
            <span>🛡️</span>
            <span>เมนูจัดการผู้ควบคุมงาน (พิเศษ)</span>
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Link href="/supervisor/logbook" className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm hover:border-amber-500 transition flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <span className="font-extrabold text-slate-900 block text-xs">รายงาน LogBook</span>
                <span className="text-[10px] text-slate-500">ตรวจบันทึกงานพนักงาน</span>
              </div>
            </Link>

            <Link href="/supervisor/leaves" className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm hover:border-amber-500 transition flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <span className="font-extrabold text-slate-900 block text-xs">อนุมัติใบลา</span>
                <span className="text-[10px] text-slate-500">พิจารณาคำขอลาพนักงาน</span>
              </div>
            </Link>

            <Link href="/supervisor/equipment-approval" className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm hover:border-amber-500 transition flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <span className="font-extrabold text-slate-900 block text-xs">อนุมัติเบิกอุปกรณ์</span>
                <span className="text-[10px] text-slate-500">ตรวจสอบคำขออุปกรณ์</span>
              </div>
            </Link>

            <Link href="/supervisor/random-check" className="bg-amber-50/80 p-4 rounded-2xl border-2 border-amber-300 shadow-sm hover:bg-amber-100 transition flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <span className="font-extrabold text-amber-900 block text-xs">สุ่มตรวจหน้างาน</span>
                <span className="text-[10px] text-amber-700">เช็กอิน & ถ่ายรูปหน่วยงาน</span>
              </div>
            </Link>

            <Link href="/supervisor/employees" className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm hover:border-amber-500 transition flex items-center gap-3 col-span-2">
              <span className="text-2xl">👥</span>
              <div>
                <span className="font-extrabold text-slate-900 block text-sm">จัดการบุคลากร & มอบหมายไซต์งาน</span>
                <span className="text-xs text-slate-500">เพิ่ม, แก้ไขข้อมูล รปภ. และกำหนดหน่วยงานประจำ</span>
              </div>
            </Link>
          </div>
        </div>

        {/* ⚡ เมนูลัดบริการพนักงาน (พื้นฐาน / กรณีคนขาด) */}
        <div className="space-y-3 pt-1">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 px-1">
            <span>⚡</span>
            <span>เมนูลัดบริการพนักงาน (พื้นฐาน / กรณีคนขาด)</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Link href="/supervisor/apply-leave" className="p-3.5 bg-white rounded-2xl border-2 border-slate-200 shadow-sm hover:border-amber-500 transition flex items-center gap-2.5">
              <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center text-xl shrink-0 font-bold">📝</div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">ยื่นใบลา</h4>
                <p className="text-[10px] text-slate-500">ป่วย, กิจ, พักร้อน</p>
              </div>
            </Link>

            <Link href="/supervisor/attendance" className="p-3.5 bg-white rounded-2xl border-2 border-slate-200 shadow-sm hover:border-amber-500 transition flex items-center gap-2.5">
              <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center text-xl shrink-0 font-bold">⏱️</div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">ลงเวลาทำงาน</h4>
                <p className="text-[10px] text-slate-500">สแกนเข้า-ออกงาน</p>
              </div>
            </Link>

            <Link href="/supervisor/shifts" className="p-3.5 bg-white rounded-2xl border-2 border-slate-200 shadow-sm hover:border-amber-500 transition flex items-center gap-2.5">
              <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center text-xl shrink-0 font-bold">📅</div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">ตารางเวร</h4>
                <p className="text-[10px] text-slate-500">ปฏิทินกะการทำงาน</p>
              </div>
            </Link>

            <Link href="/supervisor/reports" className="p-3.5 bg-white rounded-2xl border-2 border-slate-200 shadow-sm hover:border-amber-500 transition flex items-center gap-2.5">
              <div className="w-10 h-10 bg-red-100 text-red-700 rounded-xl flex items-center justify-center text-xl shrink-0 font-bold">🛡️</div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">แจ้งเหตุการณ์</h4>
                <p className="text-[10px] text-slate-500">รายงานการตรวจตรา</p>
              </div>
            </Link>

            <Link href="/supervisor/loans" className="p-3.5 bg-white rounded-2xl border-2 border-slate-200 shadow-sm hover:border-amber-500 transition flex items-center gap-2.5">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center text-xl shrink-0 font-bold">💰</div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">ยื่นเรื่องกู้เงิน</h4>
                <p className="text-[10px] text-slate-500">เบิกเงินล่วงหน้า</p>
              </div>
            </Link>

            <Link href="/supervisor/equipment" className="p-3.5 bg-white rounded-2xl border-2 border-slate-200 shadow-sm hover:border-amber-500 transition flex items-center gap-2.5">
              <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center text-xl shrink-0 font-bold">📦</div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">เบิกอุปกรณ์</h4>
                <p className="text-[10px] text-slate-500">ชุดแต่งกาย / คลัง</p>
              </div>
            </Link>
          </div>
        </div>

      </main>

      {/* Modal Notification */}
      {showNotiModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <h3 className="text-base font-bold text-slate-900">การแจ้งเตือนผู้ควบคุมงาน</h3>
              </div>
              <button onClick={() => setShowNotiModal(false)} className="text-slate-400 hover:text-slate-600 font-extrabold text-lg cursor-pointer">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-sm pr-1">
              {notifications.map((item) => (
                <div key={item.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{item.message}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowNotiModal(false)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition cursor-pointer shrink-0 shadow"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}