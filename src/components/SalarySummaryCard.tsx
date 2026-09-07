"use client";

interface SalarySummaryCardProps {
  name: string;
  siteName: string;
  workedDays: number;
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  roleLabel?: string;
  roleBadgeBg?: string;
  roleBadgeText?: string;
}

export default function SalarySummaryCard({
  name,
  siteName,
  workedDays,
  grossEarnings,
  totalDeductions,
  netSalary,
  roleLabel,
  roleBadgeBg = "bg-orange-500",
  roleBadgeText = "text-white",
}: SalarySummaryCardProps) {
  // แสดงชื่อไซต์ตามที่ส่งมา ถ้าไม่มีจริงๆ ถึงแสดงสำนักงานใหญ่
  const displaySite = (!siteName || siteName === "ยังไม่ระบุหน่วยงาน") 
    ? "สำนักงานใหญ่" 
    : siteName;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 shadow-xl space-y-4 border border-slate-700">
      <div className="flex justify-between items-start gap-2">
        <div className="space-y-1 overflow-hidden">
          <div className="flex items-center gap-2">
            {roleLabel && (
              <span className={`px-2 py-0.5 font-extrabold text-[10px] rounded uppercase tracking-wider ${roleBadgeBg} ${roleBadgeText}`}>
                {roleLabel}
              </span>
            )}
            <p className="text-sm text-slate-300 font-medium truncate">
              ยินดีต้อนรับ, <strong className="text-white text-base">{name || "ผู้ใช้งาน"}</strong>
            </p>
          </div>
          <p className="text-xs text-orange-400 font-bold truncate">
            📍 {displaySite}
          </p>
        </div>
        <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold shrink-0">
          วันเงินออก 10 ถัดไป
        </span>
      </div>

      <div className="bg-slate-800/95 p-5 rounded-2xl border border-slate-700/80 space-y-4 shadow-inner">
        <div className="flex justify-between items-end px-1">
          <span className="text-xs text-slate-300 font-bold pb-1">
            💰 สุทธิคาดว่าจะได้รับเข้าบัญชี:
          </span>
          <span className="text-3xl font-black font-mono text-emerald-400 tracking-tight">
            ฿{netSalary < 0 ? 0 : netSalary.toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-700/80 text-center font-mono">
          <div className="bg-slate-900/90 py-3 px-2 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <span className="block text-xs font-sans text-slate-300 font-bold">ทำแล้ว</span>
              <span className="block text-[10px] font-sans text-slate-400 font-normal">(นับจาก 11)</span>
            </div>
            <span className="font-extrabold text-slate-100 text-base mt-2">{workedDays} วัน</span>
          </div>
          <div className="bg-slate-900/90 py-3 px-2 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <span className="block text-xs font-sans text-slate-300 font-bold">ค่าจ้างสะสม</span>
              <span className="block text-[10px] font-sans text-transparent">&nbsp;</span>
            </div>
            <span className="font-extrabold text-slate-100 text-sm mt-2">฿{grossEarnings.toLocaleString()}</span>
          </div>
          <div className="bg-slate-900/90 py-3 px-2 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <span className="block text-xs font-sans text-slate-300 font-bold">ยอดรวมหัก</span>
              <span className="block text-[10px] font-sans text-transparent">&nbsp;</span>
            </div>
            <span className="font-extrabold text-red-400 text-sm mt-2">
              {totalDeductions > 0 ? `-฿${totalDeductions.toLocaleString()}` : "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}