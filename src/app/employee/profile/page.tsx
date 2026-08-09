"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EmployeeProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State สำหรับ Notification
  const [showNotiModal, setShowNotiModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: "noti-1",
      title: "คำขอกู้เงินสวัสดิการได้รับการอนุมัติ",
      message: "รายการเบิกค่าจ้างล่วงหน้า ฿3,000 ของคุณได้รับการอนุมัติเรียบร้อยแล้ว",
      time: "10 นาทีที่แล้ว",
      isRead: false,
      type: "LOAN",
    },
    {
      id: "noti-2",
      title: "คำขอลาได้รับการอนุมัติ",
      message: "ใบป่วยวันที่ 15 ส.ค. ผ่านการอนุมัติจากหัวหน้างานแล้ว",
      time: "2 ชั่วโมงที่แล้ว",
      isRead: false,
      type: "LEAVE",
    },
    {
      id: "noti-3",
      title: "แจ้งเตือนการลงเวลาทำงาน",
      message: "อย่าลืมลงเวลาเข้างานประจำงวดเวรดึกวันนี้",
      time: "1 วันที่แล้ว",
      isRead: true,
      type: "ATTENDANCE",
    },
  ]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employee/profile");
      const data = await res.json();
      if (data.ok) {
        setProfile(data.user);
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  // นับจำนวนข้อความยังไม่ได้อ่าน
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // กดเพื่ออ่านการแจ้งเตือนทั้งหมด
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
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
            <h1 className="text-sm font-bold">หน้าแรก</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* ปุ่มกระดิ่งแจ้งเตือน (Notification Bell) */}
            <button
              onClick={() => setShowNotiModal(true)}
              className="relative p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition cursor-pointer"
            >
              <span className="text-base">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce border border-slate-900">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* ปุ่มออกจากระบบ */}
            <button
              onClick={() => router.push("/login")}
              className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition cursor-pointer"
            >
              <span>🚪</span>
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-4">
        
        {/* การ์ดข้อมูลพนักงานประจำตัว */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {profile?.name || "สมชาย ใจดี"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                รหัสพนักงาน: <span className="font-mono font-bold text-slate-800">{profile?.employeeCode || "KMS001"}</span> | ประจำหน่วยงาน:{" "}
                <span className="text-orange-600 font-bold">{profile?.branch || "ยังไม่ระบุหน่วยงาน"}</span>
              </p>
            </div>
            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 font-bold text-[10px] rounded border border-orange-200">
              EMPLOYEE
            </span>
          </div>

          {/* แถบข้อมูลเงินเดือน / รายวัน แบบเด่นชัด */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="text-sm">💵</span>
              <span>อัตราค่าจ้าง / เงินเดือน:</span>
            </div>
            <span className="font-bold text-slate-900 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              ฿650/วัน (฿19,500/เดือน)
            </span>
          </div>
        </div>

        {/* เมนูลัดเมนูลัดบริการพนักงาน */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/employee/leaves"
            className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-orange-300 transition flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-xl shrink-0">
              📝
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">ยื่นใบลา</h3>
              <p className="text-[10px] text-slate-400">ลาป่วย, ลากิจ, พักร้อน</p>
            </div>
          </Link>

          <Link
            href="/employee/attendance"
            className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-orange-300 transition flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-xl shrink-0">
              ⏱️
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">ลงเวลาทำงาน</h3>
              <p className="text-[10px] text-slate-400">เช็คอินเข้า-ออกงาน</p>
            </div>
          </Link>

          <Link
            href="/employee/shifts"
            className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-orange-300 transition flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-xl shrink-0">
              📅
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">ตารางเวร</h3>
              <p className="text-[10px] text-slate-400">ตรวจสอบผลัดการทำงาน</p>
            </div>
          </Link>

          <Link
            href="/employee/reports"
            className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-orange-300 transition flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-xl shrink-0">
              🛡️
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">แจ้งเหตุการณ์</h3>
              <p className="text-[10px] text-slate-400">รายงานการตรวจตรา</p>
            </div>
          </Link>
        </div>

        {/* สวัสดิการและคำขอพนักงาน */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span>💼</span>
            <span>สวัสดิการและคำขอพนักงาน</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/employee/loans"
              className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-orange-300 transition flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                💰
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">ยื่นเรื่องกู้เงิน</h3>
                <p className="text-[10px] text-slate-400">ขอสวัสดิการกู้ยืมเงิน</p>
              </div>
            </Link>

            <Link
              href="/employee/equipment"
              className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-orange-300 transition flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                📦
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">เบิกอุปกรณ์</h3>
                <p className="text-[10px] text-slate-400">ชุดเครื่องแต่งกาย/เครื่องมือ</p>
              </div>
            </Link>
          </div>
        </div>

        {/* ข้อมูลส่วนตัว */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-2.5 text-xs">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
            ข้อมูลส่วนตัว
          </h3>

          <div className="flex justify-between text-slate-600">
            <span>เลขบัตรประชาชน:</span>
            <span className="font-mono font-bold text-slate-900">{profile?.idCard || "1234567891234"}</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>เบอร์โทรศัพท์:</span>
            <span className="font-mono font-bold text-slate-900">{profile?.phone || "0987894561"}</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>อัตราค่าจ้างรายวัน:</span>
            <span className="font-mono font-bold text-emerald-700">650 บาท/วัน</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>ฐานเงินเดือนประเมิน:</span>
            <span className="font-mono font-bold text-emerald-700">19,500 บาท/เดือน</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>อายุ:</span>
            <span className="font-bold text-slate-900">{profile?.age ? `${profile.age} ปี` : "-"}</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>ที่อยู่:</span>
            <span className="font-bold text-slate-900">{profile?.address || "-"}</span>
          </div>
        </div>

        {/* สถานะใบอนุญาต & PDPA */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-2.5 text-xs">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
            สถานะใบอนุญาต & PDPA
          </h3>

          <div className="flex justify-between items-center text-slate-600">
            <span>ใบอนุญาต รปภ. (ธก.7):</span>
            <span className="font-bold text-slate-500">
              {profile?.licenseNo || "ยังไม่มีข้อมูลเลขใบอนุญาต"}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>การยินยอม PDPA:</span>
            {profile?.pdpaAccepted ? (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 font-bold text-[10px]">
                ✓ ยินยอมแล้ว
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded border border-red-200 font-bold text-[10px]">
                ✕ ยังไม่ได้ยินยอม
              </span>
            )}
          </div>
        </div>

      </main>

      {/* Modal / Popup การแจ้งเตือน (Notifications Drawer) */}
      {showNotiModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-100 max-h-[80vh] flex flex-col">
            
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔔</span>
                <h3 className="text-sm font-bold text-slate-900">การแจ้งเตือนของคุณ</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white font-bold text-[10px] rounded-full">
                    {unreadCount} ใหม่
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowNotiModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* รายการการแจ้งเตือน */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition ${
                    item.isRead
                      ? "bg-slate-50 border-slate-200 text-slate-600"
                      : "bg-orange-50/60 border-orange-200 text-slate-900 font-medium"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      {!item.isRead && <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>}
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{item.message}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t shrink-0">
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-orange-600 font-bold hover:underline cursor-pointer"
              >
                ✓ ทำเครื่องหมายว่าอ่านแล้วทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setShowNotiModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                ปิด
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg">
        <Link href="/employee/profile" className="flex flex-col items-center text-orange-400 text-[10px] font-semibold transition">
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
        <Link href="/employee/shifts" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📅</span>
          ตารางเวร
        </Link>
      </nav>
    </div>
  );
}