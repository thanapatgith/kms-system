"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function EmployeeLoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasActiveLoan, setHasActiveLoan] = useState(false);
  const [activeLoanMsg, setActiveLoanMsg] = useState("");

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
      if (data.ok) {
        setLoans(data.loans || []);
        setHasActiveLoan(data.hasActiveLoan || false);
        setActiveLoanMsg(data.activeLoanMessage || "");
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
    if (!item.createdAt) return true;

    const d = new Date(item.createdAt);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const itemLocalDate = `${year}-${month}-${day}`;

    if (fromDate && itemLocalDate < fromDate) return false;
    if (toDate && itemLocalDate > toDate) return false;

    return true;
  });

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
        
        {/* หัวข้อและปุ่มยื่นคำขอ */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 flex justify-between items-center gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">การเงิน & สวัสดิการ</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">เบิกเงินค่าจ้างล่วงหน้า หรือยื่นขอเงินกู้สวัสดิการ</p>
          </div>

          {hasActiveLoan ? (
            <button
              disabled
              title="คุณมีคำร้องรออนุมัติอยู่ ไม่สามารถยื่นเพิ่มได้"
              className="px-3.5 py-2 bg-slate-300 text-slate-500 text-xs font-bold rounded-xl shrink-0 cursor-not-allowed border border-slate-300"
            >
              🔒 ยื่นเรื่องค้างอยู่
            </button>
          ) : (
            <Link
              href="/employee/loans/create"
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer shrink-0"
            >
              + ยื่นเรื่องคำขอ
            </Link>
          )}
        </div>

        {/* แจ้งเตือนสเตตัสกรณีมีคำร้องค้างอยู่ */}
        {hasActiveLoan && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-2 shadow-sm animate-fadeIn">
            <span className="text-base shrink-0">⏳</span>
            <div className="space-y-0.5">
              <p className="font-bold">มีคำร้องดำเนินการอยู่ในระบบ</p>
              <p className="text-[11px] text-amber-800 leading-tight">
                {activeLoanMsg}
              </p>
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
              <span>{(fromDate || toDate) ? "ไม่พบรายการในช่วงวันที่เลือก" : "ยังไม่มีประวัติการยื่นขอเบิกเงินหรือกู้เงิน"}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLoans.map((item) => (
                <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs shadow-sm">
                  
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-lg font-mono">
                          ฿{Number(item.amount).toLocaleString()}
                        </span>
                        <span className={`px-2 py-0.5 font-bold text-[10px] rounded-md ${
                          item.type === "ADVANCE" 
                            ? "bg-purple-100 text-purple-700 border border-purple-200" 
                            : "bg-blue-100 text-blue-700 border border-blue-200"
                        }`}>
                          {item.type === "ADVANCE" ? "เบิกค่าจ้างล่วงหน้า" : "เงินกู้สวัสดิการ"}
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

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 space-y-1 text-[11px] text-slate-600">
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>เงื่อนไขชำระ:</span>
                      <span className="font-bold text-slate-700">
                        {item.type === "ADVANCE" 
                          ? "หักคืนในรอบจ่ายค่าจ้างถัดไป (ดบ. 0% + ค่าธรรมเนียม 20 บาท)"
                          : `ผ่อนชำระ ${item.installments} งวด (ดอกเบี้ย 15%/ปี)`
                        }
                      </span>
                    </div>

                    {item.reason && (
                      <div className="pt-1 border-t border-slate-100">
                        <span className="text-slate-400">เหตุผล: </span>
                        <span className="font-medium text-slate-800">"{item.reason}"</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-0.5">
                    <span>เลขที่รายการ: {item.id}</span>
                    <span>🗓️ {item.date} {item.time} น.</span>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg">
        <Link href="/employee/profile" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">👤</span>
          หน้าแรก
        </Link>
        <Link href="/employee/leaves" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📝</span>
          ระบบลา
        </Link>
        <Link href="/employee/attendance" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">⏱️</span>
          ลงเวลาทำงาน
        </Link>
        <Link href="/employee/shifts" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📅</span>
          ตารางเวร
        </Link>
      </nav>
    </div>
  );
}