"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function EmployeeLoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [loanSummary, setLoanSummary] = useState({
    targetRound: 20 as 20 | 30,
    isWindowOpen: false,
    workedDays: 20,
    dailyWage: 540,
    maxCredit: 0,
    totalBorrowedThisMonth: 0,
    remainingCredit: 0,
  });

  // ฟังก์ชันคำนวณช่วงวันต่างๆ ของเดือนปัจจุบัน
  const getCurrentMonthRanges = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const format = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // รอบวันที่ 20 (วันที่ 11 - 17 ของเดือน)
    const round20Start = new Date(year, month, 11);
    const round20End = new Date(year, month, 17);

    // รอบวันที่ 30 (วันที่ 21 - 27 ของเดือน)
    const round30Start = new Date(year, month, 21);
    const round30End = new Date(year, month, 27);

    return {
      thisMonth: { start: format(firstDay), end: format(lastDay) },
      round20: { start: format(round20Start), end: format(round20End) },
      round30: { start: format(round30Start), end: format(round30End) },
    };
  };

  const ranges = getCurrentMonthRanges();

  // ตั้งค่าเริ่มต้นให้แสดง "เดือนนี้" เป็นอันดับแรก
  const [fromDate, setFromDate] = useState<string>(ranges.thisMonth.start);
  const [toDate, setToDate] = useState<string>(ranges.thisMonth.end);
  const [activeFilter, setActiveFilter] = useState<string>("THIS_MONTH");

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employee/loans");
      const data = await res.json();
      if (data.success) {
        setLoans(data.loans || []);
        setLoanSummary({
          targetRound: data.targetRound || 20,
          isWindowOpen: data.isWindowOpen,
          workedDays: data.workedDays || 20,
          dailyWage: data.dailyWage || 540,
          maxCredit: data.maxCredit || 0,
          totalBorrowedThisMonth: data.totalBorrowedThisMonth || 0,
          remainingCredit: data.remainingCredit || 0,
        });
      }
    } catch (err) {
      console.error("Fetch loans error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFilter = (type: "ROUND_20" | "ROUND_30" | "THIS_MONTH" | "ALL") => {
    setActiveFilter(type);
    const r = getCurrentMonthRanges();
    if (type === "ROUND_20") {
      setFromDate(r.round20.start);
      setToDate(r.round20.end);
    } else if (type === "ROUND_30") {
      setFromDate(r.round30.start);
      setToDate(r.round30.end);
    } else if (type === "THIS_MONTH") {
      setFromDate(r.thisMonth.start);
      setToDate(r.thisMonth.end);
    } else if (type === "ALL") {
      setFromDate("");
      setToDate("");
    }
  };

  const filteredLoans = loans.filter((item) => {
    const dateStr = item.created_at || item.createdAt;
    if (!dateStr) return true;

    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const itemLocalDate = `${year}-${month}-${day}`;

    if (fromDate && itemLocalDate < fromDate) return false;
    if (toDate && itemLocalDate > toDate) return false;

    return true;
  });

  const totalInterestAmount = loanSummary.totalBorrowedThisMonth >= 4000 
    ? loanSummary.totalBorrowedThisMonth * 0.05 
    : 0;
  const totalDeductionWithInterest = loanSummary.totalBorrowedThisMonth + totalInterestAmount;

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-32 text-base">
      {/* Header ด้านบน */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-orange-500 font-extrabold text-xs rounded-lg uppercase tracking-wider shadow">
              EMPLOYEE
            </span>
            <h1 className="text-base font-bold">สวัสดิการเบิกเงิน & เงินกู้</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-5 space-y-4">
        
       {/* การ์ดสรุปวงเงิน & สิทธิ์คงเหลือ */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 shadow-xl space-y-4 border border-slate-700">
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="text-xs text-slate-300 font-bold">
                สิทธิ์กู้ยืมสูงสุด
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                (85% ของค่าจ้าง {loanSummary.workedDays} วัน)
              </p>
            </div>
            
            <div className={`px-3 py-2 text-xs font-bold rounded-2xl border text-center shrink-0 ${
              loanSummary.isWindowOpen 
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse" 
                : "bg-slate-800 text-slate-300 border-slate-700"
            }`}>
              <span className="block text-[11px] font-semibold">รอบวันที่ {loanSummary.targetRound}</span>
              <span className="block text-xs font-extrabold mt-0.5">
                {loanSummary.isWindowOpen ? "● (เปิดรับยื่นเรื่อง)" : "🔒 (ปิดรับคำร้อง)"}
              </span>
            </div>
          </div>

          <div className="bg-slate-800/60 px-4 py-3.5 rounded-2xl border border-slate-700/50 flex justify-between items-center">
            <span className="text-xs text-slate-300 font-bold">
              คงเหลือที่กู้ได้:
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-orange-400 tracking-tight flex items-center gap-1">
              <span>฿</span>
              <span>{loanSummary.remainingCredit.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-700 text-center font-mono">
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 shadow-sm">
              <span className="block text-xs font-sans text-slate-400 font-medium mb-0.5">คิดจากวันทำงาน</span>
              <span className="font-extrabold text-white text-sm">{loanSummary.workedDays} วัน</span>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 shadow-sm">
              <span className="block text-xs font-sans text-slate-400 font-medium mb-0.5">วงเงินกู้เต็มสิทธิ์</span>
              <span className="font-extrabold text-white text-sm">฿{loanSummary.maxCredit.toLocaleString()}</span>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 shadow-sm">
              <span className="block text-xs font-sans text-slate-400 font-medium mb-0.5">กู้ไปแล้วเดือนนี้</span>
              <span className="font-extrabold text-amber-400 text-sm">฿{loanSummary.totalBorrowedThisMonth.toLocaleString()}</span>
            </div>
          </div>
        </div>

       {/* ยื่นคำร้องกู้ยืมเงิน */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border-2 border-slate-200 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
              ยื่นคำร้องกู้ยืมเงิน รอบวันที่ {loanSummary.targetRound}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              เปิดให้ยื่นเรื่องวันที่ {loanSummary.targetRound === 20 ? "11-17" : "21-27"} ของเดือนนี้
            </p>
          </div>

          <div className="w-full">
            {!loanSummary.isWindowOpen ? (
              <button
                disabled
                className="w-full py-3 bg-slate-200 text-slate-500 text-xs font-bold rounded-xl cursor-not-allowed border border-slate-300 text-center block"
              >
                🔒 นอกช่วงเวลายื่นกู้
              </button>
            ) : loanSummary.remainingCredit <= 0 ? (
              <button
                disabled
                className="w-full py-3 bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-not-allowed border border-slate-300 text-center block"
              >
                🚫 เต็มวงเงินสิทธิ์
              </button>
            ) : (
              <Link
                href="/employee/loans/create"
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-extrabold rounded-xl shadow-md transition text-center block"
              >
                + ยื่นเรื่องกู้ยืม
              </Link>
            )}
          </div>
        </div>

        {/* แจ้งเตือนเรื่องการคิดดอกเบี้ย */}
        {loanSummary.totalBorrowedThisMonth >= 4000 && (
          <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl text-amber-900 text-xs space-y-2 shadow-sm">
            <div className="flex items-center gap-2 font-extrabold text-amber-950 text-sm">
              <span className="text-lg">⚠️</span>
              <span>แจ้งเตือนคำนวณดอกเบี้ยกู้ยืม (คิดดอกเบี้ย 5%)</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              ยอดกู้สะสมในเดือนนี้รวม <strong className="font-bold">฿{loanSummary.totalBorrowedThisMonth.toLocaleString()}</strong> (เข้าเกณฑ์ตั้งแต่ 4,000 บาทขึ้นไป)
            </p>
            <div className="p-3 bg-amber-100/80 rounded-xl space-y-1.5 text-xs font-mono border border-amber-300">
              <div className="flex justify-between">
                <span className="text-amber-900 font-medium">เงินต้นกู้สะสม:</span>
                <span className="font-bold">฿{loanSummary.totalBorrowedThisMonth.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-red-600 font-bold">
                <span>ดอกเบี้ย 5%:</span>
                <span>+฿{totalInterestAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-amber-300 pt-1.5 font-black text-amber-950 text-sm">
                <span>หักคืนวันเงินออก (10):</span>
                <span>฿{totalDeductionWithInterest.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* ตัวกรองช่วงวันที่ */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border-2 border-slate-200 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-extrabold text-slate-900">📅 ค้นหาตามช่วงรอบบิล</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFilter("ROUND_20")}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${
                activeFilter === "ROUND_20"
                  ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              รอบวันที่ 20 (11-17)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFilter("ROUND_30")}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${
                activeFilter === "ROUND_30"
                  ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              รอบวันที่ 30 (21-27)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFilter("THIS_MONTH")}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${
                activeFilter === "THIS_MONTH"
                  ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              เดือนนี้ (ทั้งเดือน)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFilter("ALL")}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${
                activeFilter === "ALL"
                  ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              ดูทั้งหมด
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs pt-1 border-t border-slate-100">
            <div>
              <label className="block text-xs text-slate-500 font-semibold mb-1">ตั้งแต่วันที่:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setActiveFilter("");
                }}
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 cursor-pointer text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-semibold mb-1">ถึงวันที่:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setActiveFilter("");
                }}
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 cursor-pointer text-sm"
              />
            </div>
          </div>
        </div>

        {/* ประวัติการยื่นคำขอ */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border-2 border-slate-200 space-y-3.5">
          <div className="flex justify-between items-center border-b-2 border-slate-100 pb-2.5">
            <h3 className="text-sm font-extrabold text-slate-900">
              📋 ประวัติรายการของคุณ
            </h3>
            <span className="text-xs font-bold text-slate-500">
              พบ {filteredLoans.length} รายการ
            </span>
          </div>

          {loading ? (
            <div className="text-center text-slate-500 py-8 text-sm font-bold animate-pulse">กำลังโหลดข้อมูล...</div>
          ) : filteredLoans.length === 0 ? (
            <div className="text-center text-slate-500 py-10 text-sm font-medium bg-slate-50 rounded-2xl border-2 border-slate-100 space-y-1.5">
              <span className="text-2xl block">💳</span>
              <span>{(fromDate || toDate) ? "ไม่พบรายการในช่วงวันที่เลือก" : "ยังไม่มีประวัติการยื่นขอกู้ยืมเงิน"}</span>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredLoans.map((item) => {
                const amount = Number(item.amount) || 0;
                const isOverInterestThreshold = loanSummary.totalBorrowedThisMonth >= 4000;
                const interestAmount = isOverInterestThreshold ? amount * 0.05 : 0;
                const totalDeduction = amount + interestAmount;
                const createdAt = item.created_at || item.createdAt;
                
                // ดึงเหตุผลการไม่อนุมัติ (รองรับฟิลด์ reject_reason, admin_note, หรือ rejection_reason)
                const rejectReason = item.reject_reason || item.admin_note || item.rejection_reason;

                return (
                  <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3 text-sm shadow-sm">
                    
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-black text-slate-900 text-xl font-mono">
                            ฿{amount.toLocaleString()}
                          </span>
                          <span className="px-2.5 py-1 font-bold text-xs rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                            เงินกู้สวัสดิการ
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {item.status === "PENDING" && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full font-bold text-xs shadow-sm">
                            ⏳ รออนุมัติ
                          </span>
                        )}
                        {item.status === "APPROVED" && (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold text-xs shadow-sm">
                            ✓ อนุมัติแล้ว
                          </span>
                        )}
                        {item.status === "REJECTED" && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-300 rounded-full font-bold text-xs shadow-sm">
                            ✕ ไม่อนุมัติ
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700">
                      <div className="flex justify-between text-slate-500 text-xs border-b pb-1.5">
                        <span className="font-semibold">เงื่อนไขชำระ:</span>
                        <span className="font-bold text-slate-800">
                          {isOverInterestThreshold 
                            ? "หักคืนวันเงินออก (วันที่ 10) + ดอกเบี้ย 5%"
                            : "หักคืนวันเงินออก (วันที่ 10) แบบไม่มีดอกเบี้ย"
                          }
                        </span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="font-semibold">ยอดกู้ต้นเงิน:</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">฿{amount.toLocaleString()}</span>
                      </div>

                      {isOverInterestThreshold && (
                        <div className="flex justify-between text-xs text-red-600 font-bold">
                          <span>ดอกเบี้ย 5%:</span>
                          <span className="font-mono text-sm">+฿{interestAmount.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-xs font-extrabold text-slate-900 pt-1.5 border-t border-slate-100">
                        <span className="text-sm">ยอดรวมหักคืนวันเงินออก:</span>
                        <span className="font-mono text-orange-600 text-base">฿{totalDeduction.toLocaleString()}</span>
                      </div>

                      {item.reason && (
                        <div className="pt-1.5 border-t border-slate-100 text-xs">
                          <span className="text-slate-400 font-semibold">เหตุผลที่ขอ: </span>
                          <span className="font-bold text-slate-900">"{item.reason}"</span>
                        </div>
                      )}

                      {/* ⭐ แสดงเหตุผลไม่อนุมัติ ถ้าสถานะเป็น REJECTED และมีข้อความ */}
                      {item.status === "REJECTED" && rejectReason && (
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs space-y-0.5 mt-2">
                          <span className="font-bold text-red-700 block">❌ เหตุผลที่ไม่ผ่านอนุมัติ:</span>
                          <span className="text-red-900 font-medium">"{rejectReason}"</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-500 font-mono pt-1">
                      <span className="truncate max-w-[180px]">ID: {item.id}</span>
                      <span className="font-bold">🗓️ {createdAt ? new Date(createdAt).toLocaleDateString('th-TH') : '-'}</span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t-2 border-slate-800 px-3 py-3 flex justify-around items-center z-50 shadow-2xl">
        <Link href="/employee/profile" className="flex flex-col items-center text-slate-200 hover:text-orange-400 text-xs font-extrabold transition">
          <span className="text-2xl mb-1">👤</span>
          หน้าแรก
        </Link>
        <Link href="/employee/attendance" className="flex flex-col items-center text-slate-200 hover:text-orange-400 text-xs font-extrabold transition">
          <span className="text-2xl mb-1">⏱️</span>
          ลงเวลาทำงาน
        </Link>
        <Link href="/employee/reports" className="flex flex-col items-center text-slate-200 hover:text-orange-400 text-xs font-extrabold transition">
          <span className="text-2xl mb-1">🛡️</span>
          รายงาน
        </Link>
        <Link href="/employee/payrolls" className="flex flex-col items-center text-slate-200 hover:text-orange-400 text-xs font-extrabold transition">
          <span className="text-2xl mb-1">💵</span>
          เงินเดือน
        </Link>
      </nav>
    </div>
  );
}