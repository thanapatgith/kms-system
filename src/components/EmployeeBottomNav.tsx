"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function EmployeeBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/employee/profile", label: "หน้าแรก", icon: "👤" },
    { href: "/employee/attendance", label: "ลงเวลาทำงาน", icon: "⏱️" },
    { href: "/employee/reports", label: "รายงาน", icon: "🛡️" },
    { href: "/employee/payrolls", label: "เงินเดือน", icon: "💵" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t-2 border-slate-800 px-3 py-3 flex justify-around items-center z-50 shadow-2xl">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center text-xs transition ${
              isActive
                ? "text-orange-400 font-black scale-105"
                : "text-slate-200 hover:text-orange-400 font-extrabold"
            }`}
          >
            <span className="text-2xl mb-1">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}