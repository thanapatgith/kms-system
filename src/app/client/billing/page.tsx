"use client";

import { useState, useEffect } from "react";
import ClientNavbar from "@/components/ClientNavbar";

export default function ClientBillingPage() {
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const res = await fetch("/api/client/billing");
      const data = await res.json();
      if (data.success) {
        setClientData(data.client);
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSlip = async (invoiceId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("slip", file);

    setUploadingId(invoiceId);
    try {
      const res = await fetch(`/api/client/billing/${invoiceId}/slip`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        alert("อัปโหลดสลิปสำเร็จ! ระบบกำลังตรวจสอบการชำระเงิน");
        fetchBillingData();
      } else {
        alert(data.error || "อัปโหลดไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setUploadingId(null);
    }
  };

  // ฟังก์ชันช่วยคำนวณวันครบกำหนดชำระ (วันที่ 10 ของเดือนถัดไป) จาก billing_month เช่น "2026-09" -> "10/10/2026"
  const getFormattedDueDate = (billingMonth: string) => {
    if (!billingMonth) return "วันที่ 10";
    try {
      const [yearStr, monthStr] = billingMonth.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10); // เดือนปัจจุบัน (1-12)
      
      // สร้าง Date ของวันที่ 10 ในเดือนถัดไป (เนื่องจาก month ใน JS นับ 0-11 การใส่ค่า month พอดีจะเลื่อนเป็นเดือนถัดไปให้อัตโนมัติ)
      const dueDate = new Date(year, month, 10);
      return dueDate.toLocaleDateString("th-TH", { day: 'numeric', month: 'numeric', year: 'numeric' });
    } catch {
      return "วันที่ 10";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-800">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">🏢</span>
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate">
                {clientData?.companyName || "Client Portal"}
              </h1>
              <p className="text-[10px] text-slate-400">ระบบชำระเงินค่าบริการ</p>
            </div>
          </div>
          <button
            onClick={() => {
              fetch("/api/auth/logout", { method: "POST" }).then(() => {
                window.location.href = "/login";
              });
            }}
            className="text-xs text-rose-400 hover:text-rose-300 font-bold bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 transition shrink-0"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* Navbar กลางด้านล่าง */}
      <ClientNavbar />

      <main className="max-w-4xl mx-auto px-4 mt-5 space-y-4">
        
        {/* ช่องทางบัญชีสำหรับโอนเงิน */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-lg space-y-2">
          <h2 className="text-sm font-black flex items-center gap-1.5">
            <span>💳</span> ช่องทางชำระเงินค่าบริการ
          </h2>
          <div className="text-xs space-y-1 text-slate-300">
            <p><strong className="text-white">ชื่อบัญชี:</strong> SECURITY KM GUARD AND SUPPLY GROUP Co., Ltd.</p>
            <p><strong className="text-white">เลขที่บัญชี:</strong> <span className="text-orange-400 font-bold">013-1-31148-6</span> ธนาคารกสิกรไทย (Kasikornbank)</p>
            <p className="text-[10px] text-slate-400 pt-1">* กำหนดชำระภายในวันที่ 10 ของทุกเดือน</p>
          </div>
        </div>

        {/* รายการใบแจ้งหนี้ (Invoices) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">📋 ประวัติและรายการใบแจ้งหนี้</h3>

          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center flex flex-col items-center justify-center border border-slate-200 shadow-sm">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-slate-400 text-xs font-semibold">กำลังโหลดข้อมูลใบแจ้งหนี้...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-slate-200 text-xs shadow-sm">
              <span className="text-2xl mb-1 block">📄</span>
              ยังไม่มีรายการใบแจ้งหนี้ในระบบขณะนี้
            </div>
          ) : (
            invoices.map((inv: any) => (
              <div key={inv.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                
                {/* หัวบิล */}
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-900">เลขที่: {inv.invoice_number}</span>
                    <p className="text-[10px] text-slate-400">รอบเดือน: {inv.billing_month}</p>
                  </div>
                  <div>
                    {inv.status === "PAID" ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
                        ✓ ชำระแล้ว
                      </span>
                    ) : inv.status === "PENDING_REVIEW" ? (
                      <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl border border-amber-200">
                        ⏳ รอตรวจสอบสลิป
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-xl shadow-sm">
                        รอชำระเงิน (ครบกำหนด {getFormattedDueDate(inv.billing_month)})
                      </span>
                    )}
                  </div>
                </div>

                {/* รายละเอียดราคา */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>ค่าบริการ รปภ. (กะกลางวัน + กะกลางคืน)</span>
                    <span>{inv.subtotal?.toLocaleString()} บาท</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ภาษีมูลค่าเพิ่ม VAT 7%</span>
                    <span>{inv.vat?.toLocaleString()} บาท</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-100">
                    <span>ยอดรวมทั้งสิ้น</span>
                    <span className="text-orange-600">{inv.total_amount?.toLocaleString()} บาท</span>
                  </div>
                </div>

                {/* ส่วนอัปโหลดสลิป */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {inv.slip_url ? (
                    <a href={inv.slip_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                      🔍 ดูสลิปที่อัปโหลดแล้ว
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">ยังไม่ได้อัปโหลดสลิปโอนเงิน</span>
                  )}

                  {inv.status !== "PAID" && (
                    <label className={`px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-sm ${uploadingId === inv.id ? "opacity-50 pointer-events-none" : ""}`}>
                      {uploadingId === inv.id ? "กำลังอัปโหลด..." : "📤 แนบสลิปโอนเงิน"}
                      <input type="file" accept="image/*" onChange={(e) => handleUploadSlip(inv.id, e)} className="hidden" />
                    </label>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}