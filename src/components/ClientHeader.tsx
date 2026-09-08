"use client";

import { useState, useEffect } from "react";
import { translations, getLang, setLang } from "@/locales/translations";

export default function ClientHeader() {
  const [currentLang, setCurrentLang] = useState<"th" | "en">("th");
  const [companyName, setCompanyName] = useState<string>("Client Portal");
  const [companyNameEn, setCompanyNameEn] = useState<string>("");

  useEffect(() => {
    setCurrentLang(getLang());
    const handleLangChange = () => setCurrentLang(getLang());
    window.addEventListener("app_lang_changed", handleLangChange);

    // ดึงข้อมูลชื่อบริษัทจาก API
    fetch("/api/client/billing")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.client) {
          setCompanyName(data.client.company_name || data.client.companyName || "Client Portal");
          setCompanyNameEn(data.client.company_name_en || "");
        }
      })
      .catch((err) => console.error(err));

    return () => window.removeEventListener("app_lang_changed", handleLangChange);
  }, []);

  const toggleLanguage = () => {
    const nextLang = currentLang === "th" ? "en" : "th";
    setLang(nextLang);
  };

  const t = translations[currentLang];

  // เลือกแสดงชื่อตามภาษาที่เลือก
  const displayCompanyName = currentLang === "th" 
    ? companyName 
    : (companyNameEn || companyName);

  return (
    <header className="bg-slate-900 text-white px-4 py-3 shadow-md sticky top-0 z-40">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {/* โลโก้หรือชื่อบริษัทแบบไดนามิก */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold">
            🏢
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-bold leading-tight truncate">{displayCompanyName}</h1>
            <p className="text-[10px] text-slate-400">
              {currentLang === "th" ? "ระบบตรวจสอบรายงานและจัดการบริการ" : "Report & Service Management System"}
            </p>
          </div>
        </div>

        {/* ปุ่มสลับภาษา และ ปุ่มออกจากระบบ */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-lg border border-slate-700 transition cursor-pointer"
          >
            {currentLang === "th" ? "TH" : "EN"}
          </button>

          <a
            href="/api/auth/logout"
            className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold rounded-lg border border-red-500/30 transition"
          >
            {t.logout}
          </a>
        </div>
      </div>
    </header>
  );
}