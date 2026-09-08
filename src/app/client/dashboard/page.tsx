"use client";

import { useState, useEffect } from "react";
import ClientNavbar from "@/components/ClientNavbar";
import ClientHeader from "@/components/ClientHeader";
import { translations, getLang } from "@/locales/translations";

export default function ClientDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);
  const [reportsCount, setReportsCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  
  const [currentLang, setCurrentLang] = useState<"th" | "en">("th");

  useEffect(() => {
    setCurrentLang(getLang());
    const handleLangChange = () => setCurrentLang(getLang());
    window.addEventListener("app_lang_changed", handleLangChange);

    fetchDashboardData();

    return () => {
      window.removeEventListener("app_lang_changed", handleLangChange);
    };
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalSites = clientData?.sitesCount ?? 1;
  const totalGuards = clientData?.guardsCount ?? 0;
  const t = translations[currentLang];

  return (
    <div className="min-h-screen bg-slate-100 pb-28 font-sans text-slate-800">
      {/* ใช้ Header กลางที่รวมปุ่มเปลี่ยนภาษาและปุ่มออกจากระบบแล้ว */}
      <ClientHeader />

      {/* Navbar กลางด้านล่าง */}
      <ClientNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 mt-6 space-y-6">
        
        {/* กล่องต้อนรับ */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-lg space-y-2">
          <h2 className="text-lg sm:text-xl font-black">{t.welcome}</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* ถ้ากำลังโหลด */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center flex flex-col items-center justify-center border border-slate-200 shadow-sm">
            <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-slate-400 text-sm font-semibold">กำลังโหลดข้อมูลแดชบอร์ด...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">🏗️ {t.projects}</span>
              <p className="text-3xl font-black text-slate-900">{totalSites} <span className="text-sm font-normal text-slate-500">{t.units}</span></p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">🛡️ {t.guards}</span>
              <p className="text-3xl font-black text-orange-600">{totalGuards} <span className="text-sm font-normal text-slate-500">{t.persons}</span></p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">📋 {t.reports}</span>
              <p className="text-3xl font-black text-slate-900">{reportsCount} <span className="text-sm font-normal text-slate-500">{t.reportsCount}</span></p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">⏳ {t.pending}</span>
              <p className="text-3xl font-black text-rose-500">{pendingCount} <span className="text-sm font-normal text-slate-500">{t.reportsCount}</span></p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}