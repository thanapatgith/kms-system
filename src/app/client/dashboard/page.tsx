"use client";

import { useState, useEffect } from "react";
import ClientNavbar from "@/components/ClientNavbar";

export default function ClientDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);
  const [reportsCount, setReportsCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/client/dashboard");
      const data = await res.json();
      if (data.success) {
        setClientData(data.client);
        setReportsCount(data.reports?.length || 0);
        const unread = (data.reports || []).filter((r: any) => !r.isAcknowledged);
        setPendingCount(unread.length);
        setNotifications(
          unread.map((r: any) => ({
            title: `มีรายงานใหม่จากหน่วยงาน: ${r.siteName}`,
            time: new Date(r.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalSites = clientData?.sitesCount ?? 1;
  const totalGuards = clientData?.guardsCount ?? 0;

  return (
    <div className="min-h-screen bg-slate-100 pb-28 font-sans text-slate-800">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        {/* ขยายความกว้างสูงสุดเป็น max-w-7xl และเพิ่ม Padding ด้านข้าง */}
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏢</span>
            <div>
              <h1 className="text-base sm:text-lg font-bold">{clientData?.companyName || "Client Portal"}</h1>
              <p className="text-xs text-slate-400">ระบบตรวจสอบรายงานและจัดการบริการ</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition cursor-pointer"
              >
                <span>🔔</span>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 text-slate-800 space-y-2">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs font-bold text-slate-900">🔔 การแจ้งเตือน ({notifications.length})</span>
                    <button onClick={() => setShowNotifDropdown(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1.5">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">ไม่มีการแจ้งเตือนใหม่</p>
                    ) : (
                      notifications.map((n, idx) => (
                        <div key={idx} className="p-2.5 bg-orange-50/75 rounded-xl text-xs space-y-0.5">
                          <p className="font-bold text-orange-950">{n.title}</p>
                          <p className="text-[10px] text-slate-400">{n.time}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                fetch("/api/auth/logout", { method: "POST" }).then(() => {
                  window.location.href = "/login";
                });
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 transition"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* Navbar กลางด้านล่าง */}
      <ClientNavbar />

      {/* Main Content ขยายกรอบให้กว้างขึ้นรองรับ Desktop (max-w-7xl) */}
      <main className="max-w-7xl mx-auto px-6 mt-6 space-y-6">
        
        {/* กล่องต้อนรับ */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-lg space-y-2">
          <h2 className="text-lg sm:text-xl font-black">ยินดีต้อนรับสู่ระบบบริหารจัดการ รปภ. KMS</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            ท่านสามารถตรวจสอบภาพรวมสถิติโครงการ สถานะรายงานประจำวัน และข้อมูลการชำระเงินได้ทันที
          </p>
        </div>

        {/* ถ้ากำลังโหลด */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center flex flex-col items-center justify-center border border-slate-200 shadow-sm">
            <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-slate-400 text-sm font-semibold">กำลังโหลดข้อมูลแดชบอร์ด...</p>
          </div>
        ) : (
          /* กล่องสถิติภาพรวม: ปรับ Grid ให้แสดงผล 2 คอลัมน์บนมือถือ และ 4 คอลัมน์เต็มจอ Desktop บนจอใหญ่ */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">🏗️ โครงการ / ไซต์งาน</span>
              <p className="text-3xl font-black text-slate-900">{totalSites} <span className="text-sm font-normal text-slate-500">แห่ง</span></p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">🛡️ รปภ. ผู้ดูแล</span>
              <p className="text-3xl font-black text-orange-600">{totalGuards} <span className="text-sm font-normal text-slate-500">นาย</span></p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">📋 รายงานทั้งหมด</span>
              <p className="text-3xl font-black text-slate-900">{reportsCount} <span className="text-sm font-normal text-slate-500">ฉบับ</span></p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">⏳ รอรับทราบ</span>
              <p className="text-3xl font-black text-rose-500">{pendingCount} <span className="text-sm font-normal text-slate-500">ฉบับ</span></p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}