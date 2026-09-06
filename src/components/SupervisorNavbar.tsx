"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SupervisorNavbar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg max-w-md mx-auto">
      <Link 
        href="/supervisor/dashboard" 
        className={`flex flex-col items-center text-[10px] font-semibold transition ${isActive("/supervisor/dashboard") ? "text-amber-400" : "text-slate-400 hover:text-amber-400"}`}
      >
        <span className="text-base mb-0.5">📊</span>
        แดชบอร์ด
      </Link>
      <Link 
        href="/supervisor/random-check" 
        className={`flex flex-col items-center text-[10px] font-semibold transition ${isActive("/supervisor/random-check") ? "text-amber-400" : "text-slate-400 hover:text-amber-400"}`}
      >
        <span className="text-base mb-0.5">📍</span>
        สุ่มตรวจ
      </Link>
      <Link 
        href="/supervisor/logbook" 
        className={`flex flex-col items-center text-[10px] font-semibold transition ${isActive("/supervisor/logbook") ? "text-amber-400" : "text-slate-400 hover:text-amber-400"}`}
      >
        <span className="text-base mb-0.5">📋</span>
        Logbook
      </Link>
      <Link 
        href="/supervisor/leaves" 
        className={`flex flex-col items-center text-[10px] font-semibold transition ${isActive("/supervisor/leaves") ? "text-amber-400" : "text-slate-400 hover:text-amber-400"}`}
      >
        <span className="text-base mb-0.5">📄</span>
        อนุมัติลา
      </Link>
    </nav>
  );
}