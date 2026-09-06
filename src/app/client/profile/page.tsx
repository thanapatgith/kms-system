"use client";

import { useState, useEffect } from "react";
import ClientNavbar from "@/components/ClientNavbar";

export const dynamic = "force-dynamic";

export default function ClientProfilePage() {
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);

  useEffect(() => {
    fetchClientProfile();
  }, []);

  const fetchClientProfile = async () => {
    try {
      // ดึงข้อมูลจาก API ของฝั่ง Client (ปรับ Endpoint ตามระบบของคุณ เช่น /api/client/profile หรือใช้ร่วมกับ billing)
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

  return (
    <div className="min-h-screen bg-slate-50 pb-28 font-sans text-slate-800">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">🏢</span>
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate">
                {clientData?.companyName || clientData?.company_name || "Client Portal"}
              </h1>
              <p className="text-[10px] text-slate-400">ข้อมูลสัญญาและรายละเอียดการบริการ</p>
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
        
        {/* หัวข้อสัญญา พร้อมปุ่มเปิดดูเอกสาร PDF แบบ Dynamic */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <span className="text-[10px] bg-orange-500 text-white px-2.5 py-0.5 rounded-full font-bold">
                {clientData?.contract_number || "Document No. KMS 05/2026"}
              </span>
              <h2 className="text-base font-black mt-1">สัญญาจ้างบริการรักษาความปลอดภัย</h2>
            </div>
            
            {clientData?.contract_url ? (
              <a
                href={clientData.contract_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-1.5 w-fit"
              >
                📄 เปิดดูเอกสารฉบับเต็ม (PDF)
              </a>
            ) : (
              <span className="text-xs text-slate-400 italic">ยังไม่มีเอกสารสัญญาในระบบ</span>
            )}
          </div>
          <p className="text-xs text-slate-300 pt-1 border-t border-slate-800">
            ระยะเวลาสัญญา: <strong className="text-white">01 กันยายน 2569 - 30 กันยายน 2570</strong>
          </p>
        </div>

        {/* รายละเอียดคู่สัญญา */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b pb-2">🤝 คู่สัญญาและผู้เกี่ยวข้อง</h3>
          <div className="text-xs space-y-2 text-slate-600">
            <p><strong className="text-slate-800">ผู้ว่าจ้าง (Client):</strong> {clientData?.company_name || clientData?.companyName || "บริษัท พินกุ๊ด (ไทยแลนด์) จำกัด"}</p>
            <p><strong className="text-slate-800">ผู้รับจ้าง (Contractor):</strong> บริษัท รักษาความปลอดภัย เคเอ็ม การ์ด แอนด์ ซัพพลาย กรุ๊ป จำกัด</p>
            <p><strong className="text-slate-800">สถานที่ปฏิบัติงาน:</strong> นิคมอุตสาหกรรมอมตะซิตี้ ชลบุรี เลขที่ 700/102 ม.9 ต.มาบปอง อ.พานทอง จ.ชลบุรี 20160</p>
          </div>
        </div>

        {/* รายละเอียดอัตราค่าบริการ */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b pb-2">💰 อัตราค่าบริการและกำลังพล</h3>
          <div className="text-xs space-y-2 text-slate-600">
            <div className="flex justify-between">
              <span>กำลังพล รปภ. (กะกลางวัน + กะกลางคืน):</span>
              <span className="font-bold text-slate-900">2 นาย</span>
            </div>
            <div className="flex justify-between">
              <span>อัตราค่าบริการ:</span>
              <span className="font-bold text-slate-900">22,900 บาท / คน / เดือน</span>
            </div>
            <div className="flex justify-between">
              <span>รวมค่าบริการรายเดือน:</span>
              <span className="font-bold text-orange-600">
                {clientData?.monthly_fee ? `${clientData.monthly_fee.toLocaleString()} บาท (ไม่รวม VAT 7%)` : "45,800.00 บาท (ไม่รวม VAT 7%)"}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span>รอบการชำระเงิน:</span>
              <span className="font-bold text-slate-900">ภายในวันที่ 10 ของทุกเดือน</span>
            </div>
          </div>
        </div>

        {/* เงื่อนไขสำคัญ */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b pb-2">📌 เงื่อนไขการให้บริการ</h3>
          <ul className="text-xs space-y-2 text-slate-600 list-disc list-inside">
            <li><strong className="text-slate-800">กะเวลาปฏิบัติงาน:</strong> กะกลางวัน (06:00 - 18:00 น.) และกะกลางคืน (18:00 - 06:00 น.) ทุกวันไม่เว้นวันหยุด</li>
            <li><strong className="text-slate-800">การต่อสัญญา:</strong> สัญญาต่ออายุอัตโนมัติคราวละ 1 ปี หากไม่มีการแจ้งยกเลิกเป็นลายลักษณ์อักษรล่วงหน้า 30 วัน</li>
            <li><strong className="text-slate-800">วงเงินรับผิดชอบความเสียหาย:</strong> เป็นไปตามเงื่อนไขการพิสูจน์หลักฐานและบันทึกประจำวันสถานีตำรวจท้องที่</li>
          </ul>
        </div>

      </main>
    </div>
  );
}