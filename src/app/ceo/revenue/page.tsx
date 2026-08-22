"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface RevenueItem {
  id: string;
  billing_period: string;
  amount: number;
  payment_status: "PAID" | "PENDING" | "OVERDUE";
  due_date: string;
  paid_at?: string;
  slip_url?: string;
  tax_doc_url?: string;
  receipt_url?: string;
  updated_by?: string;
  sites: {
    id: string;
    site_code: string;
    site_name: string;
  };
}

export default function CEORevenuePage() {
  const [selectedMonth, setSelectedMonth] = useState("2026-07");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PAID" | "PENDING" | "OVERDUE">("ALL");
  const [revenues, setRevenues] = useState<RevenueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<RevenueItem | null>(null);
  const [activeTab, setActiveTab] = useState<"SLIP" | "TAX" | "RECEIPT">("SLIP");

  useEffect(() => {
    async function fetchRevenues() {
      setLoading(true);
      try {
        const res = await fetch(`/api/ceo/revenue?period=${selectedMonth}`);
        const json = await res.json();
        if (json.ok) {
          setRevenues(json.data);
        }
      } catch (err) {
        console.error("Fetch revenues error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRevenues();
  }, [selectedMonth]);

  const totalAmount = revenues.reduce((acc, item) => acc + Number(item.amount), 0);
  const paidAmount = revenues.filter((i) => i.payment_status === "PAID").reduce((acc, item) => acc + Number(item.amount), 0);
  const pendingAmount = revenues.filter((i) => i.payment_status !== "PAID").reduce((acc, item) => acc + Number(item.amount), 0);

  const filteredData = revenues.filter((item) => {
    const matchesSearch = item.sites?.site_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || item.payment_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24 font-sans">
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/ceo/dashboard" className="text-slate-400 hover:text-white transition">
              ‹
            </Link>
            <h1 className="text-sm font-bold">รายรับค่าว่าจ้าง & ตรวจเอกสาร</h1>
          </div>
          
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-800 text-amber-300 border border-slate-700 text-[11px] font-bold rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
          >
            <option value="2026-07">งวด ก.ค. 2569</option>
            <option value="2026-06">งวด มิ.ย. 2569</option>
            <option value="2026-05">งวด พ.ค. 2569</option>
          </select>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-4 space-y-4">
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3 border border-slate-800">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs text-slate-400 font-medium">รวมยอดค่าว่าจ้างประจำงวด (DB จริง)</span>
            <span className="text-[10px] text-amber-400 font-bold">
              {selectedMonth === "2026-07" ? "กรกฎาคม 2569" : selectedMonth}
            </span>
          </div>

          <p className="text-2xl font-black text-amber-400">
            ฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
            <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
              <span className="text-slate-400 block text-[10px]">ชำระแล้ว</span>
              <span className="font-bold text-emerald-400">
                ฿{paidAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
              <span className="text-slate-400 block text-[10px]">รอชำระ / ค้างชำระ</span>
              <span className="font-bold text-amber-400">
                ฿{pendingAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="text"
            placeholder="🔍 ค้นหาชื่อบริษัท / หน่วยงาน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />

          <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1.5 rounded-xl border font-bold transition whitespace-nowrap cursor-pointer ${
                filterStatus === "ALL" ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              ทั้งหมด ({revenues.length})
            </button>
            <button
              onClick={() => setFilterStatus("PAID")}
              className={`px-3 py-1.5 rounded-xl border font-bold transition whitespace-nowrap cursor-pointer ${
                filterStatus === "PAID" ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              ✅ ชำระแล้ว ({revenues.filter((i) => i.payment_status === "PAID").length})
            </button>
            <button
              onClick={() => setFilterStatus("PENDING")}
              className={`px-3 py-1.5 rounded-xl border font-bold transition whitespace-nowrap cursor-pointer ${
                filterStatus === "PENDING" ? "bg-amber-500 text-white border-amber-500 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              ⏳ รอการชำระ ({revenues.filter((i) => i.payment_status === "PENDING").length})
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
            <span>รายการสัญญาประจำงวด ({filteredData.length})</span>
            <span className="text-[10px] text-amber-600 font-bold">Supabase Connected</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">กำลังโหลดข้อมูลจาก Database...</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredData.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    setActiveTab("SLIP");
                  }}
                  className="p-3.5 space-y-2 hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">
                        {item.sites?.site_name}
                      </span>
                    </div>
                    {item.payment_status === "PAID" && (
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full whitespace-nowrap">ชำระแล้ว</span>
                    )}
                    {item.payment_status === "PENDING" && (
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full whitespace-nowrap">รอชำระ</span>
                    )}
                    {item.payment_status === "OVERDUE" && (
                      <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full whitespace-nowrap">เกินกำหนด</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[10px]">
                    <div className="flex gap-1">
                      <span className={`px-1.5 py-0.5 rounded font-medium ${item.slip_url ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-400 border border-slate-200"}`}>
                        {item.slip_url ? "🧾 สลิป" : "❌ สลิป"}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-medium ${item.tax_doc_url ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-slate-50 text-slate-400 border border-slate-200"}`}>
                        {item.tax_doc_url ? "📄 50ทวิ" : "❌ 50ทวิ"}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-medium ${item.receipt_url ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-slate-50 text-slate-400 border border-slate-200"}`}>
                        {item.receipt_url ? "🧾 ใบเสร็จ" : "❌ ใบเสร็จ"}
                      </span>
                    </div>

                    <span className="font-bold text-slate-900 text-xs">
                      ฿{Number(item.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}

              {filteredData.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  ไม่พบรายการสัญญาตามสถานะที่เลือก
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase">
                  ตรวจสอบหลักฐาน (งวด: {selectedItem.billing_period})
                </span>
                <h3 className="text-sm font-bold text-slate-900">{selectedItem.sites?.site_name}</h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1">
                ✕
              </button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button onClick={() => setActiveTab("SLIP")} className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${activeTab === "SLIP" ? "bg-white text-slate-900 shadow-sm" : ""}`}>
                🧾 สลิปโอน
              </button>
              <button onClick={() => setActiveTab("TAX")} className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${activeTab === "TAX" ? "bg-white text-slate-900 shadow-sm" : ""}`}>
                📄 50 ทวิ
              </button>
              <button onClick={() => setActiveTab("RECEIPT")} className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${activeTab === "RECEIPT" ? "bg-white text-slate-900 shadow-sm" : ""}`}>
                🧾 ใบเสร็จ
              </button>
            </div>

            <div className="space-y-2">
              {activeTab === "SLIP" && (
                selectedItem.slip_url ? <img src={selectedItem.slip_url} alt="Slip" className="w-full h-56 object-cover rounded-xl border border-slate-200" /> : <p className="text-center py-10 text-slate-400 text-xs bg-slate-50 rounded-xl">ยังไม่ได้แนบสลิปโอนเงิน</p>
              )}
              {activeTab === "TAX" && (
                selectedItem.tax_doc_url ? <img src={selectedItem.tax_doc_url} alt="50 Tawi" className="w-full h-56 object-cover rounded-xl border border-slate-200" /> : <p className="text-center py-10 text-slate-400 text-xs bg-slate-50 rounded-xl">ยังไม่ได้แนบหนังสือ 50 ทวิ</p>
              )}
              {activeTab === "RECEIPT" && (
                selectedItem.receipt_url ? <img src={selectedItem.receipt_url} alt="Receipt" className="w-full h-56 object-cover rounded-xl border border-slate-200" /> : <p className="text-center py-10 text-slate-400 text-xs bg-slate-50 rounded-xl">ยังไม่ได้แนบใบเสร็จรับเงิน</p>
              )}
            </div>

            <button onClick={() => setSelectedItem(null)} className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl hover:bg-slate-800 transition cursor-pointer">
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg max-w-md mx-auto">
        <Link href="/ceo/dashboard" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📊</span>แดชบอร์ด
        </Link>
        <Link href="/ceo/revenue" className="flex flex-col items-center text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">💵</span>รายรับลูกค้า
        </Link>
        <Link href="/ceo/payroll" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">💳</span>เงินเดือน
        </Link>
        <Link href="/ceo/reports" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📝</span>รายงาน
        </Link>
      </nav>
    </div>
  );
}