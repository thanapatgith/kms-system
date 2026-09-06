"use client";

interface WageBreakdownCardProps {
  baseWage8Hrs: number;
  otRate4Hrs: number;
  dailyRate: number;
}

export default function WageBreakdownCard({
  baseWage8Hrs = 400,
  otRate4Hrs = 120,
  dailyRate = 520,
}: WageBreakdownCardProps) {
  return (
    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
      <div className="flex justify-between text-slate-600 py-0.5">
        <span>ค่าจ้างปกติ (8 ชม.):</span>
        <span className="font-mono font-bold text-slate-800">
          ฿{Number(baseWage8Hrs).toLocaleString()} / วัน
        </span>
      </div>
      <div className="flex justify-between text-slate-600 py-0.5">
        <span>ค่าจ้าง OT (4 ชม.):</span>
        <span className="font-mono font-bold text-slate-800">
          ฿{Number(otRate4Hrs).toLocaleString()} / วัน
        </span>
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
        <span className="font-bold text-slate-900">รวมอัตราค่าจ้างรายวัน:</span>
        <span className="font-mono font-black text-emerald-700 text-sm">
          ฿{Number(dailyRate).toLocaleString()} / วัน
        </span>
      </div>
    </div>
  );
}