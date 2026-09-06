"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ClientNavbar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] z-50">
      {/* เพิ่ม padding bottom เผื่อขอบจอด้านล่างของมือถือรุ่นใหม่ๆ (Safe Area) */}
      <div className="max-w-md mx-auto flex justify-between items-center px-2 py-2 pb-safe">
        
        <Link
          href="/client/dashboard"
          className={`flex flex-col items-center justify-center w-full py-1 transition ${
            isActive("/client/dashboard") ? "text-orange-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <span className={`text-xl mb-1 ${isActive("/client/dashboard") ? "drop-shadow-sm scale-110 transition-transform" : ""}`}>📊</span>
          <span className="text-[10px] font-bold">สถิติ</span>
        </Link>
        
        <Link
          href="/client/reports"
          className={`flex flex-col items-center justify-center w-full py-1 transition ${
            isActive("/client/reports") ? "text-orange-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <span className={`text-xl mb-1 ${isActive("/client/reports") ? "drop-shadow-sm scale-110 transition-transform" : ""}`}>📋</span>
          <span className="text-[10px] font-bold">รายงาน</span>
        </Link>
        
        <Link
          href="/client/billing"
          className={`flex flex-col items-center justify-center w-full py-1 transition ${
            isActive("/client/billing") ? "text-orange-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <span className={`text-xl mb-1 ${isActive("/client/billing") ? "drop-shadow-sm scale-110 transition-transform" : ""}`}>💰</span>
          <span className="text-[10px] font-bold">ชำระเงิน</span>
        </Link>
        
        <Link
          href="/client/profile"
          className={`flex flex-col items-center justify-center w-full py-1 transition ${
            isActive("/client/profile") ? "text-orange-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <span className={`text-xl mb-1 ${isActive("/client/profile") ? "drop-shadow-sm scale-110 transition-transform" : ""}`}>ℹ️</span>
          <span className="text-[10px] font-bold">ข้อมูลสัญญา</span>
        </Link>

      </div>
    </nav>
  );
}