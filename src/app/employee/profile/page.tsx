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

  // ดึงข้อมูลจริงจากตาราง payrolls ผ่าน profile ที่ดึงมา
  const dailyWage = Math.round(profile?.dailyRate || 520);
  const workedDays = profile?.workedDays || 20;
  const grossEarnings = Math.round(profile?.grossIncome || (workedDays * dailyWage));
  const totalDeduction = Math.round(profile?.totalDeductions || 0);
  
  // คำนวณสุทธิคาดว่าจะได้รับ (รายได้รวม - ยอดรวมหัก)
  const netSalaryPayable = Math.round((profile?.netSalary || grossEarnings) - totalDeduction);

  // คำนวณแยกสัดส่วนค่าจ้าง 8 ชม. และ OT 4 ชม.
  const baseWage8Hrs = profile?.baseWage8Hrs || (dailyWage > 400 ? 400 : Math.round(dailyWage * 0.77));
  const otRate = profile?.otRate || (dailyWage - baseWage8Hrs);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-orange-500 font-bold text-[10px] rounded uppercase tracking-wider">
              KMS
            </span>
            <h1 className="text-sm font-bold">หน้าแรก</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfileModal(true)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>👤</span>
              <span className="max-w-[70px] truncate">{profile?.name || "ส่วนตัว"}</span>
            </button>

            <button
              onClick={() => setShowNotiModal(true)}
              className="relative p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition cursor-pointer"
            >
              <span className="text-base">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-slate-900">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-3.5">
        
        {/* การ์ดต้อนรับ & ประมาณการเงินที่จะได้รับวันเงินออก */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-4 shadow-xl space-y-3 relative overflow-hidden border border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">
                ยินดีต้อนรับ, <strong className="text-white">{profile?.name || "พนักงานใหม่"}</strong>
              </p>
              <p className="text-[10px] text-orange-400 font-semibold">
                📍 {profile?.branch || "หน่วยงานสังกัด KMS"}
              </p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
              วันเงินออก 10 ถัดไป
            </span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] text-slate-300 font-medium">
                💰 สุทธิคาดว่าจะได้รับเข้าบัญชี:
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                ฿{netSalaryPayable < 0 ? 0 : netSalaryPayable.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-700/60 text-center font-mono text-[10px]">
              <div className="bg-slate-900/50 p-1.5 rounded-xl">
                <span className="block text-[9px] font-sans text-slate-400">ทำแล้ว</span>
                <span className="font-bold text-slate-200">{workedDays} วัน</span>
              </div>
              <div className="bg-slate-900/50 p-1.5 rounded-xl">
                <span className="block text-[9px] font-sans text-slate-400">ค่าจ้างสะสม</span>
                <span className="font-bold text-slate-200">฿{grossEarnings.toLocaleString()}</span>
              </div>
              <div className="bg-slate-900/50 p-1.5 rounded-xl">
                <span className="block text-[9px] font-sans text-slate-400">ยอดรวมหัก</span>
                <span className="font-bold text-red-400">-฿{totalDeduction.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* สรุปสิทธิ์ 2 ช่อง */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link href="/employee/leaves" className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm space-y-1 hover:border-orange-300 transition">
            <div className="flex justify-between items-center text-slate-400 text-[10px]">
              <span className="font-bold text-slate-700">📝 วันลาสะสม</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${leavesCount >= 3 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
                {leavesCount >= 3 ? "เกิน 3 วัน" : "ปกติ"}
              </span>
            </div>
            <p className="text-base font-bold text-slate-900 font-mono">
              {leavesCount} <span className="text-xs text-slate-500 font-normal">วัน</span>
            </p>
          </Link>

          <Link href="/employee/loans" className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm space-y-1 hover:border-orange-300 transition">
            <div className="flex justify-between items-center text-slate-400 text-[10px]">
              <span className="font-bold text-slate-700">💰 กู้ได้อีก</span>
              <span className="text-orange-600 font-bold">รอบนี้</span>
            </div>
            <p className="text-base font-bold text-orange-600 font-mono">
              ฿{loanSummary.remainingCredit.toLocaleString()}
            </p>
          </Link>
        </div>

        {/* เมนูลัดบริการพนักงาน */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span>⚡</span>
            <span>เมนูลัดบริการพนักงาน</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/employee/leaves"
              className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-orange-300 transition flex items-center gap-2.5"
            >
              <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-lg shrink-0">
                📝
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">ยื่นใบลา</h4>
                <p className="text-[9px] text-slate-400">ป่วย, กิจ, พักร้อน</p>
              </div>
            </Link>

            <Link
              href="/employee/attendance"
              className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-orange-300 transition flex items-center gap-2.5"
            >
              <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-lg shrink-0">
                ⏱️
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">ลงเวลาทำงาน</h4>
                <p className="text-[9px] text-slate-400">สแกนเข้า-ออกงาน</p>
              </div>
            </Link>

            <Link
              href="/employee/shifts"
              className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-orange-300 transition flex items-center gap-2.5"
            >
              <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-lg shrink-0">
                📅
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">ตารางเวร</h4>
                <p className="text-[9px] text-slate-400">ตรวจสอบปฏิทินกะเวร</p>
              </div>
            </Link>

            <Link
              href="/employee/reports"
              className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-orange-300 transition flex items-center gap-2.5"
            >
              <div className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center text-lg shrink-0">
                🛡️
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">แจ้งเหตุการณ์</h4>
                <p className="text-[9px] text-slate-400">รายงานการตรวจตรา</p>
              </div>
            </Link>

            <Link
              href="/employee/loans"
              className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-orange-300 transition flex items-center gap-2.5"
            >
              <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-lg shrink-0">
                💰
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">ยื่นเรื่องกู้เงิน</h4>
                <p className="text-[9px] text-slate-400">สวัสดิการกู้ยืมเงิน</p>
              </div>
            </Link>

            <Link
              href="/employee/equipment"
              className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-orange-300 transition flex items-center gap-2.5"
            >
              <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-lg shrink-0">
                📦
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">เบิกอุปกรณ์</h4>
                <p className="text-[9px] text-slate-400">ชุดแต่งกาย/เครื่องมือ</p>
              </div>
            </Link>
          </div>
        </div>

      </main>

      {/* Modal ข้อมูลส่วนตัว */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-slate-100 my-auto">
            
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">👤</span>
                <h3 className="text-xs font-bold text-slate-900">ข้อมูลส่วนตัวพนักงาน</h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between pb-1 border-b border-slate-100">
                <span>ชื่อ-นามสกุล:</span>
                <span className="font-bold text-slate-900">{profile?.name || "-"}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-100">
                <span>รหัสพนักงาน:</span>
                <span className="font-mono font-bold text-slate-900">{profile?.employeeCode || "-"}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-100">
                <span>เลขบัตรประชาชน:</span>
                <span className="font-mono font-bold text-slate-900">{profile?.idCard || "-"}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-100">
                <span>เบอร์โทรศัพท์:</span>
                <span className="font-mono font-bold text-slate-900">{profile?.phone || "-"}</span>
              </div>
              <div className="flex justify-between items-start pb-1 border-b border-slate-100">
                <span>อัตราค่าจ้างรายวัน:</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-700 block">฿{dailyWage}/วัน</span>
                  <span className="text-[10px] text-slate-400 block">
                    (ค่าจ้าง 8 ชม. ฿{baseWage8Hrs} + OT 4 ชม. ฿{otRate})
                  </span>
                </div>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-100">
                <span>ใบอนุญาต รปภ. (ธก.7):</span>
                <span className="font-bold text-slate-700">{profile?.licenseNo || "ไม่มีข้อมูล"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>การยินยอม PDPA:</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 font-bold text-[10px]">
                  ✓ ยินยอมแล้ว
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-1/2 py-2.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                🚪 ออกจากระบบ
              </button>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="w-1/2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Notification */}
      {showNotiModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-100 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔔</span>
                <h3 className="text-sm font-bold text-slate-900">การแจ้งเตือนของคุณ</h3>
              </div>
              <button onClick={() => setShowNotiModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 text-xs">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-slate-400">ไม่มีการแจ้งเตือนใหม่</div>
              ) : (
                notifications.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{item.message}</p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowNotiModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
            >
              ปิด
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