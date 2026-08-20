"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SupervisorDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    remainingCredit: 9340,
    usedCredit: 0,
    totalCredit: 9340,
    workedDays: 31,
    grossEarnings: 49999.9,
    netSalary: 48399.9,
    totalDeductions: 1599.997
  });
  const [loading, setLoading] = useState(true);
  const [leavesCount] = useState(4);

  const [showNotiModal, setShowNotiModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [notifications] = useState([
    { id: "noti-1", title: "มีคำขออนุมัติใบมารอการพิจารณา", message: "พนักงานในสังกัดได้ยื่นคำขอลาใหม่ กรุณาตรวจสอบ", time: "10 นาทีที่แล้ว" },
    { id: "noti-2", title: "คำขอเบิกอุปกรณ์ใหม่", message: "มีรายการขอเบิกอุปกรณ์จากพนักงานรอการอนุมัติ", time: "1 ชั่วโมงที่แล้ว" },
  ]);

  useEffect(() => {
    fetchDashboardData();
    fetchProfile();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/supervisor/dashboard");
      const data = await res.json();
      if (data.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employee/profile");
      const data = await res.json();
      if (data.ok) setProfile(data.user);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ดึงค่าจริงจาก API พร้อมปัดเศษทศนิยมให้เป็นจำนวนเต็ม
  const dailyWage = profile?.dailyRate || 520;
  const workedDays = stats.workedDays || 31;
  const grossEarnings = Math.round(stats.grossEarnings ?? (workedDays * dailyWage));
  const totalDeduction = Math.round(stats.totalDeductions ?? 0);
  const netSalaryPayable = Math.round(stats.netSalary ?? (grossEarnings - totalDeduction));

  const unreadCount = notifications.length;

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-500 font-bold text-[10px] rounded text-slate-950 uppercase tracking-wider">
              SUPERVISOR
            </span>
            <h1 className="text-sm font-bold">ผู้ควบคุมงาน</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfileModal(true)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <span>👤</span>
              <span className="max-w-[70px] truncate">{profile?.name || "โปรไฟล์"}</span>
            </button>

            <button
              onClick={() => setShowNotiModal(true)}
              className="relative p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition cursor-pointer shadow-sm"
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
      <main className="max-w-md mx-auto px-4 mt-4 space-y-4">
        
        {/* การ์ดแสดงยอดเงิน */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-4 shadow-xl space-y-3 relative overflow-hidden border border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">
                ยินดีต้อนรับ, <strong className="text-white">{profile?.name || stats.employeeName || "ผู้ควบคุมงาน"}</strong>
              </p>
              <p className="text-[10px] text-amber-400 font-semibold">
                📍 {profile?.branch || profile?.site?.siteName || "หน่วยงานสังกัด KMS"}
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
                <span className="block text-[9px] font-sans text-slate-400">รวมหัก (ภาษี/อื่นๆ)</span>
                <span className="font-bold text-red-400">
                  {totalDeduction > 0 ? `-฿${totalDeduction.toLocaleString()}` : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* สรุปสิทธิ์ 2 ช่อง */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link href="/supervisor/apply-leave" className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm space-y-1 hover:border-amber-400 transition">
            <div className="flex justify-between items-center text-slate-400 text-[10px]">
              <span className="font-bold text-slate-700">📝 วันลาสะสม</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">
                ปกติ
              </span>
            </div>
            <p className="text-base font-bold text-slate-900 font-mono">
              {leavesCount} <span className="text-xs text-slate-500 font-normal">วัน</span>
            </p>
          </Link>

          <Link href="/supervisor/loans" className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm space-y-1 hover:border-amber-400 transition">
            <div className="flex justify-between items-center text-slate-400 text-[10px]">
              <span className="font-bold text-slate-700">💰 กู้ได้อีก</span>
              <span className="text-amber-600 font-bold">รอบนี้</span>
            </div>
            <p className="text-base font-bold text-amber-600 font-mono">
              ฿{(stats.remainingCredit ?? 9340).toLocaleString()}
            </p>
          </Link>
        </div>

        {/* ⚡ เมนูลัดบริการพนักงาน */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-800 px-1 flex items-center gap-1.5">
            <span>⚡</span>
            <span>เมนูลัดบริการพนักงาน (พื้นฐาน)</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <Link href="/supervisor/apply-leave" className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 transition flex items-center gap-2.5">
              <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-lg shrink-0">📝</div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">ยื่นใบลา</h4>
                <p className="text-[9px] text-slate-400">ป่วย, กิจ, พักร้อน (ส่ง HR)</p>
              </div>
            </Link>

            <Link href="/supervisor/attendance" className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 transition flex items-center gap-2.5">
              <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-lg shrink-0">⏱️</div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">ลงเวลาทำงาน</h4>
                <p className="text-[9px] text-slate-400">สแกนเข้า-ออกงานปกติ</p>
              </div>
            </Link>

            <Link href="/supervisor/shifts" className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 transition flex items-center gap-2.5">
              <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-lg shrink-0">📅</div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">ตารางเวร</h4>
                <p className="text-[9px] text-slate-400">ตรวจสอบปฏิทินกะเวร</p>
              </div>
            </Link>

            <Link href="/supervisor/reports" className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 transition flex items-center gap-2.5">
              <div className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center text-lg shrink-0">🛡️</div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">แจ้งเหตุการณ์</h4>
                <p className="text-[9px] text-slate-400">รายงานการตรวจตรา</p>
              </div>
            </Link>

            <Link href="/supervisor/loans" className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 transition flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-lg shrink-0">💰</div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">ยื่นเรื่องกู้เงิน</h4>
                <p className="text-[9px] text-slate-400">สวัสดิการกู้ยืมเงิน</p>
              </div>
            </Link>

            <Link href="/supervisor/equipment" className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 transition flex items-center gap-2.5">
              <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-lg shrink-0">📦</div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">เบิกอุปกรณ์</h4>
                <p className="text-[9px] text-slate-400">ชุดแต่งกาย / เติมคลัง</p>
              </div>
            </Link>
          </div>
        </div>

        {/* 🛠️ เมนูจัดการพิเศษของผู้ควบคุมงาน */}
        <div className="space-y-2 pt-1">
          <h3 className="text-xs font-bold text-slate-800 px-1 flex items-center gap-1.5">
            <span>🛡️</span>
            <span>เมนูจัดการผู้ควบคุมงาน (พิเศษ)</span>
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link href="/supervisor/logbook" className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 transition flex items-center gap-3">
              <span className="text-xl">📋</span>
              <div>
                <span className="font-bold text-slate-900 block">รายงาน LogBook</span>
                <span className="text-[10px] text-slate-400">ตรวจบันทึกงานพนักงาน</span>
              </div>
            </Link>

            <Link href="/supervisor/leaves" className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 transition flex items-center gap-3">
              <span className="text-xl">📝</span>
              <div>
                <span className="font-bold text-slate-900 block">อนุมัติใบลา</span>
                <span className="text-[10px] text-slate-400">พิจารณาคำขอลาพนักงาน</span>
              </div>
            </Link>

            <Link href="/supervisor/equipment-approval" className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 transition flex items-center gap-3">
              <span className="text-xl">📦</span>
              <div>
                <span className="font-bold text-slate-900 block">อนุมัติเบิกอุปกรณ์</span>
                <span className="text-[10px] text-slate-400">ตรวจสอบคำขออุปกรณ์พนักงาน</span>
              </div>
            </Link>

            <Link href="/supervisor/random-check" className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 shadow-sm hover:bg-amber-100 transition flex items-center gap-3">
              <span className="text-xl">📍</span>
              <div>
                <span className="font-bold text-amber-900 block">สุ่มตรวจหน้างาน</span>
                <span className="text-[10px] text-amber-700">เช็กอิน & ถ่ายรูปหน่วยงาน</span>
              </div>
            </Link>
          </div>
        </div>

      </main>

      {/* Modal ข้อมูลส่วนตัว */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-slate-100 my-auto text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">👤</span>
                <h3 className="font-bold text-slate-900 text-sm">ข้อมูลส่วนตัวผู้ควบคุมงาน</h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-slate-600">
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
                <span className="font-mono font-bold text-slate-900">{profile?.idCardNumber || "-"}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-100">
                <span>เบอร์โทรศัพท์:</span>
                <span className="font-mono font-bold text-slate-900">{profile?.phone || "-"}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-100">
                <span>อัตราค่าจ้างรายวัน:</span>
                <span className="font-mono font-bold text-emerald-700">฿{dailyWage}/วัน</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-100">
                <span>ใบอนุญาต ปรก. (ธภ.7):</span>
                <span className="font-bold text-slate-700">{profile?.thop7LicenseNo || "ไม่มีข้อมูล"}</span>
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
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  router.push("/login");
                }}
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
                <h3 className="text-sm font-bold text-slate-900">การแจ้งเตือนผู้ควบคุมงาน</h3>
              </div>
              <button onClick={() => setShowNotiModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 text-xs">
              {notifications.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
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
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-40 shadow-lg max-w-md mx-auto">
        <Link href="/supervisor/dashboard" className="flex flex-col items-center text-amber-400 text-[10px] font-bold transition">
          <span className="text-base mb-0.5">📊</span>แดชบอร์ด
        </Link>
        <Link href="/supervisor/leaves" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📝</span>อนุมัติลา
        </Link>
        <Link href="/supervisor/attendance" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">⏱️</span>เช็คเวลา
        </Link>
        <Link href="/supervisor/logbook" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📋</span>Logbook
        </Link>
      </nav>
    </div>
  );
}