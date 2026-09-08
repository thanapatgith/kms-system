"use client";

import { useState, useEffect } from "react";
import ClientNavbar from "@/components/ClientNavbar";
import ClientHeader from "@/components/ClientHeader";
import { translations, getLang } from "@/locales/translations";

export const dynamic = "force-dynamic";

export default function ClientProfilePage() {
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);
  const [currentLang, setCurrentLang] = useState<"th" | "en">("th");

  useEffect(() => {
    setCurrentLang(getLang());
    const handleLangChange = () => setCurrentLang(getLang());
    window.addEventListener("app_lang_changed", handleLangChange);

    fetchClientProfile();

    return () => {
      window.removeEventListener("app_lang_changed", handleLangChange);
    };
  }, []);

  const fetchClientProfile = async () => {
    try {
      const res = await fetch("/api/client/billing");
      const data = await res.json();
      if (data.success) {
        setClientData(data.client);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันจัดรูปแบบวันที่จาก DB ให้แสดงผลสวยงามตามภาษา
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(currentLang === "th" ? "th-TH" : "en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 font-sans text-slate-800">
      <ClientHeader />
      <ClientNavbar />

      <main className="max-w-4xl mx-auto px-4 mt-5 space-y-4">
        
        {/* หัวข้อสัญญา พร้อมปุ่มเปิดดูเอกสาร PDF แบบ Dynamic */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <span className="text-[10px] bg-orange-500 text-white px-2.5 py-0.5 rounded-full font-bold">
                {clientData?.contract_number || "Document No. KMS 05/2026"}
              </span>
              <h2 className="text-base font-black mt-1">
                {currentLang === "th" ? "สัญญาจ้างบริการรักษาความปลอดภัย" : "Security Guard Services Contract"}
              </h2>
            </div>
            
            {clientData?.contract_url ? (
              <a
                href={clientData.contract_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-1.5 w-fit"
              >
                📄 {currentLang === "th" ? "เปิดดูเอกสารฉบับเต็ม (PDF)" : "View Full Document (PDF)"}
              </a>
            ) : (
              <span className="text-xs text-slate-400 italic">
                {currentLang === "th" ? "ยังไม่มีเอกสารสัญญาในระบบ" : "No contract document in system"}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 pt-1 border-t border-slate-800">
            {currentLang === "th" ? "ระยะเวลาสัญญา:" : "Contract Period:"}{" "}
            <strong className="text-white">
              {clientData?.contract_start_date && clientData?.contract_end_date
                ? `${formatDate(clientData.contract_start_date)} - ${formatDate(clientData.contract_end_date)}`
                : (currentLang === "th" ? "01 กันยายน 2569 - 31 สิงหาคม 2570" : "01 September 2026 - 31 August 2027")}
            </strong>
          </p>
        </div>

        {/* รายละเอียดคู่สัญญา */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b pb-2">
            🤝 {currentLang === "th" ? "คู่สัญญาและผู้เกี่ยวข้อง" : "Contract Parties & Contacts"}
          </h3>
          <div className="text-xs space-y-2 text-slate-600">
            <p>
              <strong className="text-slate-800">{currentLang === "th" ? "ผู้ว่าจ้าง (Client):" : "Client:"}</strong>{" "}
              {currentLang === "th" 
                ? (clientData?.company_name || "บริษัท พินกุ๊ด (ไทยแลนด์) จำกัด") 
                : (clientData?.company_name_en || clientData?.company_name || "PINGOOD (THAILAND) Co., Ltd.")}
            </p>
            <p><strong className="text-slate-800">{currentLang === "th" ? "ผู้รับจ้าง (Contractor):" : "Contractor:"}</strong> บริษัท รักษาความปลอดภัย เคเอ็ม การ์ด แอนด์ ซัพพลาย กรุ๊ป จำกัด</p>
            <p><strong className="text-slate-800">{currentLang === "th" ? "สถานที่ปฏิบัติงาน:" : "Service Location:"}</strong> {clientData?.address || (currentLang === "th" ? "นิคมอุตสาหกรรมอมตะซิตี้ ชลบุรี เลขที่ 700/102 ม.9 ต.มาบปอง อ.พานทอง จ.ชลบุรี 20160" : "Amata City Chonburi Industrial Estate, No. 700/102 Moo 9, Map Phai Sub-district, Phan Thong District, Chonburi 20160")}</p>
          </div>
        </div>

        {/* รายละเอียดอัตราค่าบริการ */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b pb-2">
            💰 {currentLang === "th" ? "อัตราค่าบริการและกำลังพล" : "Service Rates & Manpower"}
          </h3>
          <div className="text-xs space-y-2 text-slate-600">
            <div className="flex justify-between">
              <span>{currentLang === "th" ? "กำลังพล รปภ. (กะกลางวัน + กะกลางคืน):" : "Security Manpower (Day + Night Shift):"}</span>
              <span className="font-bold text-slate-900">
                {clientData?.guards_count ?? 2} {currentLang === "th" ? "นาย" : "Persons"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{currentLang === "th" ? "อัตราค่าบริการ:" : "Service Rate:"}</span>
              <span className="font-bold text-slate-900">
                {clientData?.rate_per_person 
                  ? `${clientData.rate_per_person.toLocaleString()} ${currentLang === "th" ? "บาท / คน / เดือน" : "THB / Person / Month"}` 
                  : "22,900 THB / Person / Month"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{currentLang === "th" ? "รวมค่าบริการรายเดือน:" : "Total Monthly Fee:"}</span>
              <span className="font-bold text-orange-600">
                {clientData?.monthly_fee 
                  ? `${clientData.monthly_fee.toLocaleString()} ${currentLang === "th" ? "บาท (ไม่รวม VAT 7%)" : "THB (Excluding VAT 7%)"}`
                  : (currentLang === "th" ? "45,800.00 บาท (ไม่รวม VAT 7%)" : "45,800.00 THB (Excluding VAT 7%)")}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span>{currentLang === "th" ? "รอบการชำระเงิน:" : "Payment Terms:"}</span>
              <span className="font-bold text-slate-900">{currentLang === "th" ? "ภายในวันที่ 10 ของทุกเดือน" : "Due by the 10th of every month"}</span>
            </div>
          </div>
        </div>

        {/* เงื่อนไขสำคัญ */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b pb-2">
            📌 {currentLang === "th" ? "เงื่อนไขการให้บริการ" : "Service Terms & Conditions"}
          </h3>
          <ul className="text-xs space-y-2 text-slate-600 list-disc list-inside">
            <li>
              <strong className="text-slate-800">{currentLang === "th" ? "กะเวลาปฏิบัติงาน:" : "Working Hours:"}</strong> {currentLang === "th" ? "กะกลางวัน (06:00 - 18:00 น.) และกะกลางคืน (18:00 - 06:00 น.) ทุกวันไม่เว้นวันหยุด" : "Day Shift (06:00 - 18:00) and Night Shift (18:00 - 06:00) daily without holidays."}
            </li>
            <li>
              <strong className="text-slate-800">{currentLang === "th" ? "การต่อสัญญา:" : "Contract Renewal:"}</strong> {currentLang === "th" ? "สัญญาต่ออายุอัตโนมัติคราวละ 1 ปี หากไม่มีการแจ้งยกเลิกเป็นลายลักษณ์อักษรล่วงหน้า 30 วัน" : "Automatically renewed for 1 year unless written cancellation is given 30 days in advance."}
            </li>
            <li>
              <strong className="text-slate-800">{currentLang === "th" ? "วงเงินรับผิดชอบความเสียหาย:" : "Liability Coverage:"}</strong> {currentLang === "th" ? "เป็นไปตามเงื่อนไขการพิสูจน์หลักฐานและบันทึกประจำวันสถานีตำรวจท้องที่" : "Subject to evidence verification and local police station daily records."}
            </li>
          </ul>
        </div>

      </main>
    </div>
  );
}