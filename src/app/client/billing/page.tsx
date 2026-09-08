"use client";

import { useState, useEffect } from "react";
import ClientNavbar from "@/components/ClientNavbar";
import ClientHeader from "@/components/ClientHeader";
import { translations, getLang } from "@/locales/translations";

export default function ClientBillingPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const [currentLang, setCurrentLang] = useState<"th" | "en">("th");

  useEffect(() => {
    setCurrentLang(getLang());
    const handleLangChange = () => setCurrentLang(getLang());
    window.addEventListener("app_lang_changed", handleLangChange);

    fetchBillingData();

    return () => {
      window.removeEventListener("app_lang_changed", handleLangChange);
    };
  }, []);

  const fetchBillingData = async () => {
    try {
      const res = await fetch("/api/client/billing");
      const data = await res.json();
      if (data.success) {
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
        alert(currentLang === "th" ? "อัปโหลดสลิปสำเร็จ! ระบบกำลังตรวจสอบการชำระเงิน" : "Slip uploaded successfully! Verifying payment.");
        fetchBillingData();
      } else {
        alert(data.error || (currentLang === "th" ? "อัปโหลดไม่สำเร็จ" : "Upload failed"));
      }
    } catch (err) {
      console.error(err);
      alert(currentLang === "th" ? "เกิดข้อผิดพลาดในการอัปโหลด" : "An error occurred during upload");
    } finally {
      setUploadingId(null);
    }
  };

  const getFormattedDueDate = (billingMonth: string) => {
    if (!billingMonth) return currentLang === "th" ? "วันที่ 10" : "10th";
    try {
      const [yearStr, monthStr] = billingMonth.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      
      const dueDate = new Date(year, month, 10);
      return dueDate.toLocaleDateString(currentLang === "th" ? "th-TH" : "en-US", { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return currentLang === "th" ? "วันที่ 10" : "10th";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-800">
      <ClientHeader />
      <ClientNavbar />

      <main className="max-w-4xl mx-auto px-4 mt-5 space-y-4">
        
        {/* ช่องทางบัญชีสำหรับโอนเงิน */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-lg space-y-2">
          <h2 className="text-sm font-black flex items-center gap-1.5">
            <span>💳</span> {currentLang === "th" ? "ช่องทางชำระเงินค่าบริการ" : "Payment Channels"}
          </h2>
          <div className="text-xs space-y-1 text-slate-300">
            <p><strong className="text-white">{currentLang === "th" ? "ชื่อบัญชี:" : "Account Name:"}</strong> SECURITY KM GUARD AND SUPPLY GROUP Co., Ltd.</p>
            <p><strong className="text-white">{currentLang === "th" ? "เลขที่บัญชี:" : "Account No:"}</strong> <span className="text-orange-400 font-bold">013-1-31148-6</span> {currentLang === "th" ? "ธนาคารกสิกรไทย (Kasikornbank)" : "Kasikornbank"}</p>
            <p className="text-[10px] text-slate-400 pt-1">{currentLang === "th" ? "* กำหนดชำระภายในวันที่ 10 ของทุกเดือน" : "* Due by the 10th of every month"}</p>
          </div>
        </div>

        {/* รายการใบแจ้งหนี้ (Invoices) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            📋 {currentLang === "th" ? "ประวัติและรายการใบแจ้งหนี้" : "Invoice History & List"}
          </h3>

          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center flex flex-col items-center justify-center border border-slate-200 shadow-sm">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-slate-400 text-xs font-semibold">{currentLang === "th" ? "กำลังโหลดข้อมูลใบแจ้งหนี้..." : "Loading invoices..."}</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-slate-200 text-xs shadow-sm">
              <span className="text-2xl mb-1 block">📄</span>
              {currentLang === "th" ? "ยังไม่มีรายการใบแจ้งหนี้ในระบบขณะนี้" : "No invoices available at this time."}
            </div>
          ) : (
            invoices.map((inv: any) => (
              <div key={inv.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                
                {/* หัวบิล */}
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{currentLang === "th" ? "เลขที่:" : "Invoice No:"} {inv.invoice_number}</span>
                    <p className="text-[10px] text-slate-400">{currentLang === "th" ? "รอบเดือน:" : "Billing Month:"} {inv.billing_month}</p>
                  </div>
                  <div>
                    {inv.status === "PAID" ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
                        ✓ {currentLang === "th" ? "ชำระแล้ว" : "Paid"}
                      </span>
                    ) : inv.status === "PENDING_REVIEW" ? (
                      <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl border border-amber-200">
                        ⏳ {currentLang === "th" ? "รอตรวจสอบสลิป" : "Verifying Slip"}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-xl shadow-sm">
                        {currentLang === "th" ? `รอชำระเงิน (ครบกำหนด ${getFormattedDueDate(inv.billing_month)})` : `Pending (Due ${getFormattedDueDate(inv.billing_month)})`}
                      </span>
                    )}
                  </div>
                </div>

                {/* รายละเอียดราคา */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{currentLang === "th" ? "รปภ. กะกลางวัน (อัตรา 22,900 บาท/เดือน)" : "Day Shift Guard (Rate 22,900 THB/mo)"}</span>
                    <span>22,900 {currentLang === "th" ? "บาท" : "THB"}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{currentLang === "th" ? "รปภ. กะกลางคืน (อัตรา 22,900 บาท/เดือน)" : "Night Shift Guard (Rate 22,900 THB/mo)"}</span>
                    <span>22,900 {currentLang === "th" ? "บาท" : "THB"}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-100">
                    <span>{currentLang === "th" ? "รวมค่าบริการ (Subtotal)" : "Subtotal"}</span>
                    <span>{inv.subtotal?.toLocaleString()} {currentLang === "th" ? "บาท" : "THB"}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{currentLang === "th" ? "ภาษีมูลค่าเพิ่ม VAT 7%" : "VAT 7%"}</span>
                    <span>{inv.vat?.toLocaleString()} {currentLang === "th" ? "บาท" : "THB"}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-100">
                    <span>{currentLang === "th" ? "ยอดรวมทั้งสิ้น" : "Total Amount"}</span>
                    <span className="text-orange-600">{inv.total_amount?.toLocaleString()} {currentLang === "th" ? "บาท" : "THB"}</span>
                  </div>
                </div>

                {/* ส่วนอัปโหลดสลิป */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {inv.slip_url ? (
                    <a href={inv.slip_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                      🔍 {currentLang === "th" ? "ดูสลิปที่อัปโหลดแล้ว" : "View Uploaded Slip"}
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">{currentLang === "th" ? "ยังไม่ได้อัปโหลดสลิปโอนเงิน" : "Slip not uploaded yet"}</span>
                  )}

                  {inv.status !== "PAID" && (
                    <label className={`px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-sm ${uploadingId === inv.id ? "opacity-50 pointer-events-none" : ""}`}>
                      {uploadingId === inv.id ? (currentLang === "th" ? "กำลังอัปโหลด..." : "Uploading...") : (currentLang === "th" ? "📤 แนบสลิปโอนเงิน" : "📤 Upload Slip")}
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