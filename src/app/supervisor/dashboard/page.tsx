"use client";

import { useState } from "react";
import Link from "next/link";

export default function SupervisorDashboardPage() {
  return (
    <div className="w-full min-h-screen bg-slate-100 pb-12">
      {/* Navbar สำหรับ Supervisor */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-amber-500 font-bold text-xs rounded-lg uppercase tracking-wider text-slate-950">
              SUPERVISOR
            </span>
            <h1 className="text-lg font-bold">KMS Management Portal</h1>
          </div>

          <nav className="flex items-center gap-1.5 flex-wrap justify-center text-xs font-semibold">
            <Link href="/supervisor/dashboard" className="px-2.5 py-2 bg-slate-800 text-amber-400 rounded-lg">
              แดชบอร์ดภาพรวม
            </Link>
            <Link href="/supervisor/logbook" className="px-2.5 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              รายงาน Logbook
            </Link>
            <Link href="/supervisor/leaves" className="px-2.5 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              อนุมัติใบลา
            </Link>
            <Link href="/supervisor/shifts" className="px-2.5 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              ตารางเวร/แทน
            </Link>
            <Link href="/supervisor/attendance" className="px-2.5 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              ตรวจสอบลงเวลา
            </Link>
            <Link href="/supervisor/patrol" className="px-2.5 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              ลงชื่อตรวจตรา
            </Link>
            <Link href="/supervisor/equipment" className="px-2.5 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              อนุมัติเบิกอุปกรณ์
            </Link>
            <Link href="/employee/profile" className="px-2.5 py-2 bg-slate-800/60 hover:bg-slate-800 text-amber-200 rounded-lg transition ml-1">
              หน้าพนักงาน
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content (Dashboard โล่งๆ รอใส่การ์ดสรุปข้อมูล) */}
      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200 text-center space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">ยินดีต้อนรับเข้าสู่ระบบจัดการของผู้ควบคุมงาน (Supervisor)</h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            หน้าจอนี้ถูกเตรียมไว้สำหรับแสดงสรุปข้อมูลสถิติ ภาพรวมการปฏิบัติงาน การลงเวลา และสถานะต่างๆ ของพนักงานในสังกัด
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <Link
              href="/supervisor/logbook"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
            >
              📋 ไปที่หน้าตรวจสอบ Logbook
            </Link>
            <Link
              href="/supervisor/leaves"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-sm"
            >
              📝 ไปที่หน้าอนุมัติใบลา
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}