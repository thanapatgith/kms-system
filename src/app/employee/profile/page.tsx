"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EmployeeProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [loanSummary, setLoanSummary] = useState({
    totalBorrowedThisMonth: 0,
    remainingCredit: 10000,
  });
  const [leavesCount, setLeavesCount] = useState(0);

  const [showNotiModal, setShowNotiModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchProfileData();
  }, []);

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

  const dailyWage = Math.round(profile?.dailyRate || 520);
  const workedDays = profile?.workedDays || 20;
  const grossEarnings = Math.round(profile?.grossIncome || (workedDays * dailyWage));
  const totalDeduction = Math.round(profile?.totalDeductions || 0);
  
  const netSalaryPayable = Math.round((profile?.netSalary || grossEarnings) - totalDeduction);

  const baseWage8Hrs = profile?.baseWage8Hrs || (dailyWage > 400 ? 400 : Math.round(dailyWage * 0.77));
  const otRate = profile?.otRate || (dailyWage - baseWage8Hrs);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-32 text-base">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-orange-500 font-extrabold text-sm rounded-lg uppercase tracking-wider shadow">
              KMS
            </span>
            <h1 className="text-lg font-bold">หน้าแรก</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProfileModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-sm font-bold transition flex items-center gap-1.5 shadow border border-slate-700 cursor-pointer"
            >
              <span className="text-base">👤</span>
              <span className="max-w-[100px] truncate">{profile?.name || "ส่วนตัว"}</span>
            </button>

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
        
        {/* การ์ดต้อนรับ & ประมาณการเงิน */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 shadow-xl space-y-4 border border-slate-700">
          <div className="flex justify-between items-start gap-2">
            <div className="space-y-1 overflow-hidden">
              <p className="text-sm text-slate-300 font-medium truncate">
                ยินดีต้อนรับ, <strong className="text-white text-base">{profile?.name || "พนักงาน"}</strong>
              </p>
              <p className="text-xs text-orange-400 font-bold truncate">
                📍 {profile?.branch || "หน่วยงานสังกัด KMS"}
              </p>
            </div>
            <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold shrink-0">
              วันเงินออก 10 ถัดไป
            </span>
          </div>

          <div className="bg-slate-800/95 p-5 rounded-2xl border border-slate-700/80 space-y-4 shadow-inner">
            {/* จัดข้อความชิดซ้าย และตัวเลขชิดขวาอย่างสมดุล ไม่ติดขอบ */}
            <div className="flex justify-between items-end px-1">
              <span className="text-xs text-slate-300 font-bold pb-1">
                💰 สุทธิคาดว่าจะได้รับเข้าบัญชี:
              </span>
              <span className="text-3xl font-black font-mono text-emerald-400 tracking-tight">
                ฿{netSalaryPayable < 0 ? 0 : netSalaryPayable.toLocaleString()}
              </span>
            </div>

            {/* เพิ่ม padding และช่องไฟให้กล่องย่อยไม่ติดขอบ */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-700/80 text-center font-mono">
              <div className="bg-slate-900/90 py-3 px-2 rounded-2xl border border-slate-800 shadow-sm">
                <span className="block text-xs font-sans text-slate-400 font-medium mb-1">ทำแล้ว</span>
                <span className="font-extrabold text-slate-100 text-base">{workedDays} วัน</span>
              </div>
              <div className="bg-slate-900/90 py-3 px-2 rounded-2xl border border-slate-800 shadow-sm">
                <span className="block text-xs font-sans text-slate-400 font-medium mb-1">ค่าจ้างสะสม</span>
                <span className="font-extrabold text-slate-100 text-sm">฿{grossEarnings.toLocaleString()}</span>
              </div>
              <div className="bg-slate-900/90 py-3 px-2 rounded-2xl border border-slate-800 shadow-sm">
                <span className="block text-xs font-sans text-slate-400 font-medium mb-1">ยอดรวมหัก</span>
                <span className="font-extrabold text-red-400 text-sm">-฿{totalDeduction.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* สรุปสิทธิ์ 2 ช่อง */}
        <div className="grid grid-cols-2 gap-3.5">
          <Link href="/employee/leaves" className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-sm space-y-2 hover:border-orange-500 transition">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-800 text-sm">📝 วันลาสะสม</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${leavesCount >= 3 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>
                {leavesCount >= 3 ? "เกิน 3 วัน" : "ปกติ"}
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {leavesCount} <span className="text-sm text-slate-600 font-bold">วัน</span>
            </p>
          </Link>

          <Link href="/employee/loans" className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-sm space-y-2 hover:border-orange-500 transition">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-800 text-sm">💰 กู้ได้อีก</span>
              <span className="text-orange-600 font-extrabold text-xs">รอบนี้</span>
            </div>
            <p className="text-xl font-black text-orange-600 font-mono">
              ฿{loanSummary.remainingCredit.toLocaleString()}
            </p>
          </Link>
        </div>

        {/* เมนูลัดบริการพนักงาน */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 px-1">
            <span>⚡</span>
            <span>เมนูลัดบริการพนักงาน</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-3.5">
            <Link
              href="/employee/leaves"
              className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm hover:border-orange-500 transition flex items-center gap-3.5"
            >
              <div className="w-12 h-12 bg-orange-100 text-orange-700 rounded-2xl flex items-center justify-center text-2xl shrink-0 font-bold shadow-sm">
                📝
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">ยื่นใบลา</h4>
                <p className="text-xs text-slate-500 font-medium">ป่วย, กิจ, พักร้อน</p>
              </div>
            </Link>

            <Link
              href="/employee/attendance"
              className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm hover:border-orange-500 transition flex items-center gap-3.5"
            >
              <div className="w-12 h-12 bg-orange-100 text-orange-700 rounded-2xl flex items-center justify-center text-2xl shrink-0 font-bold shadow-sm">
                ⏱️
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">ลงเวลาทำงาน</h4>
                <p className="text-xs text-slate-500 font-medium">สแกนเข้า-ออกงาน</p>
              </div>
            </Link>

            <Link
              href="/employee/shifts"
              className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm hover:border-orange-500 transition flex items-center gap-3.5"
            >
              <div className="w-12 h-12 bg-orange-100 text-orange-700 rounded-2xl flex items-center justify-center text-2xl shrink-0 font-bold shadow-sm">
                📅
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">ตารางเวร</h4>
                <p className="text-xs text-slate-500 font-medium">ปฏิทินกะเวร</p>
              </div>
            </Link>

            <Link
              href="/employee/reports"
              className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm hover:border-orange-500 transition flex items-center gap-3.5"
            >
              <div className="w-12 h-12 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center text-2xl shrink-0 font-bold shadow-sm">
                🛡️
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">แจ้งเหตุการณ์</h4>
                <p className="text-xs text-slate-500 font-medium">รายงานตรวจตรา</p>
              </div>
            </Link>

            <Link
              href="/employee/loans"
              className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm hover:border-orange-500 transition flex items-center gap-3.5"
            >
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center text-2xl shrink-0 font-bold shadow-sm">
                💰
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">ยื่นเรื่องกู้เงิน</h4>
                <p className="text-xs text-slate-500 font-medium">สวัสดิการกู้ยืม</p>
              </div>
            </Link>

            <Link
              href="/employee/equipment"
              className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm hover:border-orange-500 transition flex items-center gap-3.5"
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center text-2xl shrink-0 font-bold shadow-sm">
                📦
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">เบิกอุปกรณ์</h4>
                <p className="text-xs text-slate-500 font-medium">ชุดแต่งกาย/เครื่องมือ</p>
              </div>
            </Link>
          </div>
        </div>

      </main>

      {/* Modal ข้อมูลส่วนตัว */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 my-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">👤</span>
                <h3 className="text-base font-bold text-slate-900">ข้อมูลส่วนตัวพนักงาน</h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-sm text-slate-700">
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-500">ชื่อ-นามสกุล:</span>
                <span className="font-bold text-slate-900">{profile?.name || "-"}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-500">รหัสพนักงาน:</span>
                <span className="font-mono font-bold text-slate-900">{profile?.employeeCode || "-"}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-500">เลขบัตรประชาชน:</span>
                <span className="font-mono font-bold text-slate-900">{profile?.idCard || "-"}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-500">เบอร์โทรศัพท์:</span>
                <span className="font-mono font-bold text-slate-900">{profile?.phone || "-"}</span>
              </div>
              <div className="flex justify-between items-start pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-500">อัตราค่าจ้าง:</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-700 block text-base">฿{dailyWage}/วัน</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-1/2 py-3 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                🚪 ออกจากระบบ
              </button>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="w-1/2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Notification */}
      {showNotiModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <h3 className="text-base font-bold text-slate-900">การแจ้งเตือนของคุณ</h3>
              </div>
              <button onClick={() => setShowNotiModal(false)} className="text-slate-400 hover:text-slate-600 font-extrabold text-lg cursor-pointer">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-sm">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-medium">ไม่มีการแจ้งเตือนใหม่</div>
              ) : (
                notifications.map((item) => (
                  <div key={item.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                      <span className="text-xs text-slate-400 font-mono">{item.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
                  </div>
                ))
              )}
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

      {/* Bottom Navigation Bar - ปรับให้สว่าง ตัวหนังสือใหญ่ และเด่นชัดขึ้นมาก */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t-2 border-slate-800 px-3 py-3 flex justify-around items-center z-50 shadow-2xl">
        <Link href="/employee/profile" className="flex flex-col items-center text-orange-400 text-xs font-black transition scale-105">
          <span className="text-2xl mb-1">👤</span>
          หน้าแรก
        </Link>
        <Link href="/employee/attendance" className="flex flex-col items-center text-slate-200 hover:text-orange-400 text-xs font-extrabold transition">
          <span className="text-2xl mb-1">⏱️</span>
          ลงเวลาทำงาน
        </Link>
        <Link href="/employee/reports" className="flex flex-col items-center text-slate-200 hover:text-orange-400 text-xs font-extrabold transition">
          <span className="text-2xl mb-1">🛡️</span>
          รายงาน
        </Link>
        <Link href="/employee/payrolls" className="flex flex-col items-center text-slate-200 hover:text-orange-400 text-xs font-extrabold transition">
          <span className="text-2xl mb-1">💵</span>
          เงินเดือน
        </Link>
      </nav>
    </div>
  );
}