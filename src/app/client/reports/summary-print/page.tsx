"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SummaryPrintContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(searchParams.get("month") || String(currentDate.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(searchParams.get("year") || String(currentDate.getFullYear()));
  const [selectedSite, setSelectedSite] = useState(searchParams.get("site") || "all");

  const fetchMonthlySummary = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ site: selectedSite });
      const res = await fetch(`/api/client/reports?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlySummary();
  }, [selectedSite]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-sm text-slate-500">
        กำลังประมวลผลรายงานสรุปประจำเดือน...
      </div>
    );
  }

  const allReports = data?.reports || [];
  const reports = allReports.filter((r: any) => {
    const reportDate = new Date(r.createdAt);
    return (
      reportDate.getMonth() + 1 === parseInt(selectedMonth) &&
      reportDate.getFullYear() === parseInt(selectedYear)
    );
  });

  const totalCount = reports.length;
  const morningCount = reports.filter((r: any) => r.shift === "morning").length;
  const nightCount = reports.filter((r: any) => r.shift === "night").length;

  const daysInMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const guardMap: { [key: string]: { name: string; code: string; days: { [day: number]: string[] } } } = {};
  
  reports.forEach((r: any) => {
    const key = r.employeeCode || r.employeeName || "unknown";
    if (!guardMap[key]) {
      guardMap[key] = {
        name: r.employeeName || "เจ้าหน้าที่ รปภ.",
        code: r.employeeCode || "-",
        days: {},
      };
    }
    const day = new Date(r.createdAt).getDate();
    if (!guardMap[key].days[day]) {
      guardMap[key].days[day] = [];
    }
    guardMap[key].days[day].push(r.shift);
  });

  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  return (
    <div className="bg-slate-100 min-h-screen py-8 font-sans text-slate-800">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            background: white !important;
          }
        }
      `}</style>

      {/* แผงควบคุมตัวเลือก (ซ่อนตอนพิมพ์) */}
      <div className="max-w-5xl mx-auto mb-4 flex flex-wrap justify-between items-center px-4 print:hidden gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <a
            href="/client/reports"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            ← กลับหน้ารายงาน
          </a>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span>📅 เลือกเดือน:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            >
              {monthNames.map((m, idx) => (
                <option key={idx} value={idx + 1}>{m}</option>
              ))}
            </select>
            <span>พ.ศ.:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y + 543} ({y})</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
        >
          🖨️ สั่งพิมพ์เอกสาร (Print A4 Landscape)
        </button>
      </div>

      {/* หน้ากระดาษเอกสาร A4 แนวนอน */}
      <div className="max-w-5xl mx-auto bg-white p-8 shadow-lg rounded-2xl print:shadow-none print:p-2 print:max-w-none">
        
        {/* หัวกระดาษ */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-14 rounded-xl flex items-center justify-center overflow-hidden bg-white border border-slate-200 p-1">
              <img 
                src="https://www.imgz.io/image/gteUE2" 
                alt="KMS Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 tracking-wide">SECURITY KM GUARD & SUPPLY GROUP CO., LTD.</h1>
              <p className="text-[11px] text-slate-500 font-medium">ระบบรักษาความปลอดภัยและบริการครบวงจรมาตรฐานสากล</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-orange-600">หน่วยงาน: {selectedSite === "all" ? "ทุกหน่วยงานอมตะ" : selectedSite}</p>
            <p className="text-[10px] text-slate-400">วันที่พิมพ์: {new Date().toLocaleDateString("th-TH")}</p>
          </div>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-sm font-bold text-slate-800">
            รายงานสรุปผลการปฏิบัติงานและตารางบันทึกการส่งรายงานประจำเดือน {monthNames[parseInt(selectedMonth) - 1]} พ.ศ. {parseInt(selectedYear) + 543}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">บริษัทลูกค้า: {data?.client?.companyName || "อมตะ"}</p>
        </div>

        {/* บล็อกสถิติภาพรวม */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="border border-slate-200 bg-slate-50 rounded-xl p-2 text-center">
            <p className="text-[11px] text-slate-500 font-bold">รายงานรวมทั้งเดือน</p>
            <p className="text-base font-black text-slate-900">{totalCount} <span className="text-[10px] font-normal text-slate-500">ครั้ง</span></p>
          </div>
          <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-2 text-center">
            <p className="text-[11px] text-amber-700 font-bold">กะเช้า (06:00 - 18:00)</p>
            <p className="text-base font-black text-amber-800">{morningCount} <span className="text-[10px] font-normal text-amber-700">ครั้ง</span></p>
          </div>
          <div className="border border-indigo-200 bg-indigo-50/40 rounded-xl p-2 text-center">
            <p className="text-[11px] text-indigo-700 font-bold">กะกลางคืน (18:00 - 06:00)</p>
            <p className="text-base font-black text-indigo-800">{nightCount} <span className="text-[10px] font-normal text-indigo-700">ครั้ง</span></p>
          </div>
        </div>

        {/* ตาราง Timesheet รายเดือน */}
        <div className="mb-5 space-y-1">
          <div className="flex justify-between items-center text-xs">
            <h3 className="font-extrabold text-slate-900">📋 ตารางเช็คชื่อการส่งรายงานประจำวัน (Timesheet รายเดือน)</h3>
            <span className="text-[10px] text-slate-400">สัญลักษณ์: ☀️ = กะเช้า, 🌙 = กะกลางคืน</span>
          </div>
          
          <table className="w-full border-collapse border border-slate-300 text-[9px] text-slate-700">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="border border-slate-300 p-1 text-center w-12">รหัส</th>
                <th className="border border-slate-300 p-1 text-left w-28">ชื่อ - นามสกุล</th>
                {daysArray.map((day) => (
                  <th key={day} className="border border-slate-300 p-0.5 text-center">{day}</th>
                ))}
                <th className="border border-slate-300 p-1 text-center w-8 font-bold">รวม</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(guardMap).length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth + 3} className="border border-slate-300 p-5 text-center text-slate-400 text-xs">
                    ไม่พบประวัติการส่งรายงานในเดือนนี้
                  </td>
                </tr>
              ) : (
                Object.values(guardMap).map((guard, idx) => {
                  let userTotal = 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50 text-center">
                      <td className="border border-slate-300 p-1 font-mono font-bold text-slate-600">{guard.code}</td>
                      <td className="border border-slate-300 p-1 text-left font-semibold text-slate-900 truncate max-w-[110px]">{guard.name}</td>
                      {daysArray.map((day) => {
                        const shifts = guard.days[day] || [];
                        if (shifts.length > 0) userTotal += shifts.length;
                        return (
                          <td key={day} className="border border-slate-300 p-0 text-[8px] font-bold">
                            {shifts.includes("morning") && <span title="กะเช้า">☀️</span>}
                            {shifts.includes("night") && <span title="กะกลางคืน">🌙</span>}
                          </td>
                        );
                      })}
                      <td className="border border-slate-300 p-1 font-extrabold text-slate-900">{userTotal}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ลายเซ็นท้ายเอกสาร */}
        <div className="grid grid-cols-2 gap-12 pt-4 text-center text-xs text-slate-700">
          <div className="space-y-8">
            <p>ลงชื่อ.........................................................................ผู้ตรวจสอบรายงาน</p>
            <p>( ......................................................................... )</p>
            <p className="text-[10px] text-slate-400">หัวหน้าชุด / ผู้ควบคุมปฏิบัติงาน</p>
          </div>
          <div className="space-y-8">
            <p>ลงชื่อ.........................................................................ผู้รับมอบรายงาน</p>
            <p>( ......................................................................... )</p>
            <p className="text-[10px] text-slate-400">ตัวแทนผู้รับบริการ / ลูกค้า (อมตะ)</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function SummaryPrintPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">กำลังโหลด...</div>}>
      <SummaryPrintContent />
    </Suspense>
  );
}