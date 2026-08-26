"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function EmployeeLoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [loanSummary, setLoanSummary] = useState({
    targetRound: 20 as 20 | 30,
    isWindowOpen: false,
    workedDays: 10,
    dailyWage: 520,
    maxCredit: 0,
    totalBorrowedThisMonth: 0,
    remainingCredit: 0,
  });

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

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
          workedDays: data.workedDays || 10,
          dailyWage: data.dailyWage || 520,
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

  const setQuickDate = (type: "TODAY" | "LAST_7_DAYS" | "ALL") => {
    if (type === "TODAY") {
      const today = getTodayString();
      setFromDate(today);
      setToDate(today);
    } else if (type === "LAST_7_DAYS") {
      const today = new Date();
      const past7 = new Date();
      past7.setDate(today.getDate() - 6);

      const format = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      setFromDate(format(past7));
      setToDate(format(today));
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

  // คำนวณยอดดอกเบี้ยรวมสะสมประจำเดือน
  const totalInterestAmount = loanSummary.totalBorrowedThisMonth >= 4000 
    ? loanSummary.totalBorrowedThisMonth * 0.05 
    : 0;
  const totalDeductionWithInterest = loanSummary.totalBorrowedThisMonth + totalInterestAmount;

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24">
      {/* Header ด้านบน */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-orange-500 font-bold text-[10px] rounded uppercase tracking-wider">
              EMPLOYEE
            </span>
            <h1 className="text-sm font-bold">สวัสดิการเบิกเงินล่วงหน้า & เงินกู้</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-3">
        
        {/* การ์ดสรุปวงเงิน & สิทธิ์คงเหลือ */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">
                สิทธิ์กู้ยืมสูงสุด (85% ของค่าจ้าง {loanSummary.workedDays} วัน)
              </p>
              <h2 className="text-2xl font-extrabold text-orange-400 font-mono mt-0.5">
                ฿{loanSummary.remainingCredit.toLocaleString()}
                <span className="text-xs text-slate-300 font-normal ml-1">คงเหลือที่กู้ได้</span>
              </h2>
            </div>
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
              loanSummary.isWindowOpen 
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse" 
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}>
              {loanSummary.isWindowOpen 
                ? `● รอบวันที่ ${loanSummary.targetRound} (เปิดรับยื่นเรื่อง)` 
                : `🔒 รอบวันที่ ${loanSummary.targetRound} (ปิดรับคำร้อง)`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center text-xs">
            <div className="bg-slate-800/60 p-2 rounded-xl">
              <span className="block text-[10px] text-slate-400">คิดจากวันทำงาน</span>
              <span className="font-bold text-white">{loanSummary.workedDays} วัน</span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-xl">
              <span className="block text-[10px] text-slate-400">วงเงินกู้เต็มสิทธิ์</span>
              <span className="font-bold text-white">฿{loanSummary.maxCredit.toLocaleString()}</span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-xl">
              <span className="block text-[10px] text-slate-400">กู้ไปแล้วเดือนนี้</span>
              <span className="font-bold text-amber-400">฿{loanSummary.totalBorrowedThisMonth.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ปุ่มยื่นคำขอ / สถานะช่วงเวลา */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 flex justify-between items-center gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              ยื่นคำร้องกู้ยืมเงิน (รอบวันที่ {loanSummary.targetRound})
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {loanSummary.targetRound === 20 ? "เปิดยื่น 11-17 ของเดือน" : "เปิดยื่น 18-27 ของเดือน"}
            </p>
          </div>

          {!loanSummary.isWindowOpen ? (
            <button
              disabled
              title="ไม่อยู่ในช่วงเวลาที่เปิดให้ยื่นกู้"
              className="px-3.5 py-2 bg-slate-200 text-slate-400 text-xs font-bold rounded-xl shrink-0 cursor-not-allowed border border-slate-300"
            >
              🔒 นอกช่วงเวลายื่นกู้
            </button>
          ) : loanSummary.remainingCredit <= 0 ? (
            <button
              disabled
              title="คุณใช้สิทธิ์กู้ยืมเต็มวงเงินของรอบนี้แล้ว"
              className="px-3.5 py-2 bg-slate-200 text-slate-500 text-xs font-bold rounded-xl shrink-0 cursor-not-allowed border border-slate-300"
            >
              🚫 เต็มวงเงินสิทธิ์
            </button>
          ) : (
            <Link
              href="/employee/loans/create"
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer shrink-0"
            >
              + ยื่นเรื่องกู้ยืม
            </Link>
          )}
        </div>

        {/* แจ้งเตือนเรื่องการคิดดอกเบี้ยและสรุปยอดหัก */}
        {loanSummary.totalBorrowedThisMonth >= 4000 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-1.5 shadow-sm">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <span className="text-base">⚠️</span>
              <span>แจ้งเตือนคำนวณดอกเบี้ยกู้ยืม (คิดดอกเบี้ย 5%)</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              ยอดกู้สะสมในเดือนนี้รวม <strong>฿{loanSummary.totalBorrowedThisMonth.toLocaleString()}</strong> (เข้าเกณฑ์ตั้งแต่ 4,000 บาทขึ้นไป)
            </p>
            <div className="p-2 bg-amber-100/70 rounded-xl space-y-1 text-[11px] font-mono border border-amber-200/80">
              <div className="flex justify-between">
                <span className="text-amber-800">เงินต้นกู้สะสม:</span>
                <span className="font-bold">฿{loanSummary.totalBorrowedThisMonth.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>ดอกเบี้ย 5%:</span>
                <span className="font-bold">+฿{totalInterestAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-amber-300/60 pt-1 font-bold text-amber-950 text-xs">
                <span>หักคืนวันเงินออก (10):</span>
                <span>฿{totalDeductionWithInterest.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* ตัวกรองช่วงวันที่ */}
        <div className="bg-white rounded-2xl shadow-sm p-3.5 border border-slate-200 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-800">📅 ค้นหาตามช่วงวันที่</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setQuickDate("TODAY")}
                className="px-2 py-1 bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
              >
                วันนี้
              </button>
              <button
                type="button"
                onClick={() => setQuickDate("LAST_7_DAYS")}
                className="px-2 py-1 bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
              >
                7 วันล่าสุด
              </button>
              <button
                type="button"
                onClick={() => setQuickDate("ALL")}
                className="px-2 py-1 bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
              >
                ดูทั้งหมด
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">ตั้งแต่วันที่:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">ถึงวันที่:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* ประวัติการยื่นคำขอ */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800">
              📋 ประวัติรายการของคุณ
            </h3>
            <span className="text-[10px] font-bold text-slate-400">
              พบ {filteredLoans.length} รายการ
            </span>
          </div>

          {loading ? (
            <div className="text-center text-slate-400 py-6 text-xs animate-pulse">กำลังโหลดข้อมูล...</div>
          ) : filteredLoans.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-xs bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-lg block">💳</span>
              <span>{(fromDate || toDate) ? "ไม่พบรายการในช่วงวันที่เลือก" : "ยังไม่มีประวัติการยื่นขอกู้ยืมเงิน"}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLoans.map((item) => {
                const amount = Number(item.amount) || 0;
                // คำนวณดอกเบี้ยรายรายการหากยอดรวมสะสมในเดือนนั้นเกิน/เท่ากับ 4000
                const isOverInterestThreshold = loanSummary.totalBorrowedThisMonth >= 4000;
                const interestAmount = isOverInterestThreshold ? amount * 0.05 : 0;
                const totalDeduction = amount + interestAmount;
                const createdAt = item.created_at || item.createdAt;

                return (
                  <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs shadow-sm">
                    
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-lg font-mono">
                            ฿{amount.toLocaleString()}
                          </span>
                          <span className="px-2 py-0.5 font-bold text-[10px] rounded-md bg-blue-100 text-blue-700 border border-blue-200">
                            เงินกู้สวัสดิการ
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {item.status === "PENDING" && (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px]">
                            ⏳ รออนุมัติ
                          </span>
                        )}
                        {item.status === "APPROVED" && (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                            ✓ อนุมัติแล้ว
                          </span>
                        )}
                        {item.status === "REJECTED" && (
                          <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full font-bold text-[10px]">
                            ✕ ไม่อนุมัติ
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 space-y-1.5 text-[11px] text-slate-600">
                      <div className="flex justify-between text-slate-500 text-[10px] border-b pb-1">
                        <span>เงื่อนไขชำระ:</span>
                        <span className="font-bold text-slate-700">
                          {isOverInterestThreshold 
                            ? "หักคืนวันเงินออก (วันที่ 10) + ดอกเบี้ย 5%"
                            : "หักคืนวันเงินออก (วันที่ 10) แบบไม่มีดอกเบี้ย"
                          }
                        </span>
                      </div>

                      <div className="flex justify-between text-[11px]">
                        <span>ยอดกู้ต้นเงิน:</span>
                        <span className="font-mono font-semibold text-slate-800">฿{amount.toLocaleString()}</span>
                      </div>

                      {isOverInterestThreshold && (
                        <div className="flex justify-between text-[11px] text-red-600">
                          <span>ดอกเบี้ย 5%:</span>
                          <span className="font-mono font-semibold">+฿{interestAmount.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-[11px] font-bold text-slate-900 pt-1 border-t border-slate-100">
                        <span>ยอดรวมหักคืนวันเงินออก:</span>
                        <span className="font-mono text-orange-600">฿{totalDeduction.toLocaleString()}</span>
                      </div>

                      {item.reason && (
                        <div className="pt-1 border-t border-slate-100 text-[10px]">
                          <span className="text-slate-400">เหตุผล: </span>
                          <span className="font-medium text-slate-800">"{item.reason}"</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-0.5">
                      <span className="truncate max-w-[150px]">ID: {item.id}</span>
                      <span>🗓️ {createdAt ? new Date(createdAt).toLocaleDateString('th-TH') : '-'}</span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg">
        <Link href="/employee/profile" className="flex flex-col items-center text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">👤</span>
          หน้าแรก
        </Link>
        <Link href="/employee/attendance" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">⏱️</span>
          ลงเวลาทำงาน
        </Link>
        <Link href="/employee/reports" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">🛡️</span>
          รายงาน
        </Link>
        <Link href="/employee/payrolls" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">💵</span>
          เงินเดือน
        </Link>
      </nav>
    </div>
  );
}