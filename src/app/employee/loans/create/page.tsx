"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateLoanPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [loanSummary, setLoanSummary] = useState({
    targetRound: 20 as 20 | 30,
    isWindowOpen: false,
    workedDays: 10,
    dailyWage: 520,
    maxCredit: 0,
    totalBorrowedThisMonth: 0,
    remainingCredit: 0,
  });

  const [formData, setFormData] = useState({
    amount: "",
    reason: "",
    acceptedTerms: false,
  });

  const [showContractModal, setShowContractModal] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const contractScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfile();
    fetchLoanSummary();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/employee/profile");
      const data = await res.json();
      if (data.ok) {
        setProfile(data.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLoanSummary = async () => {
    try {
      const res = await fetch("/api/employee/loans");
      const data = await res.json();
      if (data.success) {
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
      console.error("Fetch loan summary error:", err);
    }
  };

  const openContractModal = () => {
    setShowContractModal(true);
    // เช็คว่าถ้ากล่องข้อความสั้นจนไม่มี Scrollbar ให้ปลดล็อกได้ทันที
    setTimeout(() => {
      if (contractScrollRef.current) {
        const { scrollHeight, clientHeight } = contractScrollRef.current;
        if (scrollHeight <= clientHeight + 10) {
          setHasScrolledToBottom(true);
        }
      }
    }, 100);
  };

  const handleContractScroll = () => {
    if (contractScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contractScrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const reqAmt = Number(formData.amount) || 0;
  const isOverLimit = reqAmt > loanSummary.remainingCredit;
  const newTotalAfterThis = loanSummary.totalBorrowedThisMonth + reqAmt;
  const willHaveInterest = newTotalAfterThis > 4000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!loanSummary.isWindowOpen) {
      setErrorMsg("ไม่อยู่ในช่วงเวลาที่เปิดให้ยื่นกู้");
      return;
    }

    if (!reqAmt || reqAmt <= 0) {
      setErrorMsg("กรุณาระบุจำนวนเงินที่ต้องการให้ถูกต้อง");
      return;
    }

    if (isOverLimit) {
      setErrorMsg(`จำนวนเงินเกินสิทธิ์คงเหลือที่กู้ได้ (กู้ได้สูงสุด ฿${loanSummary.remainingCredit.toLocaleString()})`);
      return;
    }

    if (!formData.acceptedTerms) {
      setErrorMsg("กรุณากดอ่านหนังสือสัญญาและกดยอมรับเงื่อนไขในหน้าสัญญาฉบับเต็มก่อนยื่นเรื่อง");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/employee/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: reqAmt,
          reason: formData.reason,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการยื่นคำขอ");
      }

      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push("/employee/loans");
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24">
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/employee/loans" className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1">
            ‹ กลับ
          </Link>
          <h1 className="text-sm font-bold">ยื่นคำขอกู้ยืมเงินสวัสดิการ</h1>
          <div className="w-8"></div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-4 space-y-4">
        
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {/* ข้อมูลพนักงาน */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2 text-xs">
          <h3 className="font-bold text-slate-800 border-b pb-2">👤 ข้อมูลผู้ยื่นเรื่อง (พนักงาน)</h3>
          <div className="flex justify-between text-slate-600">
            <span>ชื่อ-นามสกุล:</span>
            <span className="font-bold text-slate-900">{profile?.name || "พนักงาน KMS"}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>อัตราค่าจ้างรายวัน:</span>
            <span className="font-bold text-slate-900">฿{loanSummary.dailyWage}/วัน (รวมโอที)</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>หน่วยงานสังกัด:</span>
            <span className="font-bold text-orange-600">{profile?.branch || "ยังไม่ระบุหน่วยงาน"}</span>
          </div>
        </div>

        {/* ฟอร์มยื่นคำขอ */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5 text-xs">
            
            {/* สรุปสิทธิ์วงเงินตามรอบ */}
            <div className="p-3 bg-orange-50/80 rounded-2xl border border-orange-200 text-[11px] text-orange-950 space-y-1">
              <div className="flex justify-between items-center font-bold text-orange-900 border-b border-orange-200/60 pb-1">
                <span>💡 รอบการยื่นกู้ปัจจุบัน:</span>
                <span className="text-xs bg-orange-200 px-2 py-0.5 rounded-full">
                  รอบวันที่ {loanSummary.targetRound}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span>สิทธิ์คิดจากจำนวนวันทำงาน:</span>
                <span className="font-bold">{loanSummary.workedDays} วัน</span>
              </div>
              <div className="flex justify-between items-center">
                <span>ยอดค่าจ้างสะสมจริง ({loanSummary.workedDays} วัน × ฿{loanSummary.dailyWage}):</span>
                <span className="font-mono">฿{(loanSummary.workedDays * loanSummary.dailyWage).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>ยอดสิทธิ์กู้สูงสุด (85%):</span>
                <span className="font-mono font-bold">฿{loanSummary.maxCredit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-amber-900">
                <span>กู้ไปแล้วในเดือนนี้:</span>
                <span className="font-mono">฿{loanSummary.totalBorrowedThisMonth.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-emerald-700 text-xs pt-1 border-t border-orange-200/60">
                <span>วงเงินคงเหลือที่กู้ได้ในรอบนี้:</span>
                <span className="font-mono text-sm">฿{loanSummary.remainingCredit.toLocaleString()}</span>
              </div>
            </div>

            {/* จำนวนเงินที่ต้องการ */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-800">
                  จำนวนเงินที่ต้องการกู้ (บาท) *
                </label>
                <span className="text-[10px] font-bold text-slate-400">
                  กู้ได้อีกสูงสุด ฿{loanSummary.remainingCredit.toLocaleString()}
                </span>
              </div>
              
              <input
                type="number"
                name="amount"
                min="100"
                step="100"
                required
                placeholder={`กรอกจำนวนเงินไม่เกิน ฿${loanSummary.remainingCredit.toLocaleString()}`}
                value={formData.amount}
                onChange={handleChange}
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl font-mono text-sm outline-none transition ${
                  isOverLimit
                    ? "border-red-500 text-red-600 bg-red-50/50 focus:ring-2 focus:ring-red-500"
                    : "border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500"
                }`}
              />

              {isOverLimit && (
                <div className="mt-1.5 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[10px] font-bold flex items-center gap-1.5 animate-fadeIn">
                  <span>⚠️</span>
                  <span>
                    ยอดที่คุณกรอกเกินสิทธิ์คงเหลือที่กู้ได้ (กู้ได้ไม่เกิน ฿{loanSummary.remainingCredit.toLocaleString()})
                  </span>
                </div>
              )}

              {willHaveInterest && reqAmt > 0 && !isOverLimit && (
                <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[10px] font-medium flex items-start gap-1.5 animate-fadeIn">
                  <span className="text-xs shrink-0">⚠️</span>
                  <span>
                    <strong>แจ้งเตือนเรื่องดอกเบี้ย:</strong> ยอดกู้สะสมรวมในเดือนนี้จะเป็น ฿{newTotalAfterThis.toLocaleString()} (เกิน 4,000 บาท) จะมีการคิดดอกเบี้ยระยะสั้น 5% ยอดหักคืนวันเงินออกจะเป็น ฿{(reqAmt * 1.05).toLocaleString()} บาท
                  </span>
                </div>
              )}
            </div>

            {/* เหตุผลความจำเป็น */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">เหตุผลความจำเป็น *</label>
              <textarea
                name="reason"
                rows={3}
                required
                value={formData.reason}
                onChange={handleChange}
                placeholder="ระบุเหตุผลความจำเป็นในการขอกู้ยืมเงิน..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none resize-none"
              />
            </div>

          </div>

          {/* หนังสือสัญญา */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-slate-800">📜 หนังสือสัญญากู้ยืมและข้อตกลงยินยอม</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              พนักงานต้องกดปุ่มอ่านหนังสือสัญญาฉบับเต็มและเลื่อนอ่านลงไปให้สุดเพื่อกดยินยอม
            </p>

            <button
              type="button"
              onClick={openContractModal}
              className="w-full py-2.5 bg-slate-100 hover:bg-orange-50 border border-slate-300 hover:border-orange-300 text-slate-800 font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>📑</span>
              <span>{formData.acceptedTerms ? "✓ อ่านสัญญาเรียบร้อยแล้ว (เปิดอ่านอีกครั้ง)" : "กดเพื่ออ่านหนังสือสัญญาฉบับเต็ม"}</span>
            </button>

            {/* ล็อก Checkbox ไม่ให้คลิกตรงๆ ได้ ต้องอ่านผ่าน Modal เท่านั้น */}
            <div 
              onClick={openContractModal} 
              className="flex items-start gap-2.5 cursor-pointer pt-1"
            >
              <input
                type="checkbox"
                name="acceptedTerms"
                readOnly
                checked={formData.acceptedTerms}
                className="mt-0.5 rounded text-orange-600 focus:ring-orange-500 w-4 h-4 shrink-0 pointer-events-none cursor-pointer"
              />
              <span className={`text-[11px] leading-snug ${formData.acceptedTerms ? "text-emerald-700 font-semibold" : "text-slate-500"}`}>
                ข้าพเจ้าได้อ่านหนังสือสัญญากู้ยืมเงิน และยินยอมให้บริษัทฯ หักเงินจากค่าจ้างในวันเงินออก (วันที่ 10) ตามเงื่อนไขทุกประการ
              </span>
            </div>
          </div>

          {/* ปุ่มส่งคำขอ */}
          <button
            type="submit"
            disabled={submitting || !formData.acceptedTerms || isOverLimit || loanSummary.remainingCredit <= 0 || !loanSummary.isWindowOpen}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/20 transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "กำลังส่งข้อมูล..." : "🚀 ยืนยันการส่งเรื่องกู้เงิน"}
          </button>

        </form>

      </main>

      {/* Modal ป๊อปอัปอ่านสัญญา */}
      {showContractModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-100 my-auto flex flex-col max-h-[85vh]">
            
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">📜</span>
                <h3 className="text-xs font-bold text-slate-900">หนังสือสัญญากู้ยืมเงินพนักงาน</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowContractModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div
              ref={contractScrollRef}
              onScroll={handleContractScroll}
              className="flex-1 overflow-y-auto p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-700 space-y-3 leading-relaxed font-sans max-h-[300px]"
            >
              <div className="text-center space-y-1 pb-2 border-b">
                <p className="font-bold text-slate-900 text-xs">
                  บริษัท รักษาความปลอดภัย เคเอ็ม การ์ด แอนด์ ซัพพลาย กรุ๊ป จำกัด
                </p>
                <p className="text-[10px] text-slate-500">
                  หนังสือสัญญากู้ยืมเงินพนักงาน และหนังสือยินยอมให้หักเงินค่าจ้าง
                </p>
              </div>

              <p>
                สัญญาฉบับนี้ทำขึ้นระหว่าง <strong>บริษัท รักษาความปลอดภัย เคเอ็ม การ์ด แอนด์ ซัพพลาย กรุ๊ป จำกัด</strong> (ผู้ให้กู้) กับ พนักงาน (ผู้กู้) โดยตกลงเงื่อนไขสวัสดิการกู้ยืมเงินดังนี้:
              </p>

              <p>
                <strong>ข้อ 1. วงเงินสิทธิ์การกู้ยืม:</strong> ยื่นกู้ได้ไม่เกิน 85% ของค่าจ้างตามจำนวนวันทำงานจริงในรอบนั้นๆ (รอบวันที่ 20 คิดจากวันทำงาน 10 วัน, รอบวันที่ 30 คิดจากวันทำงาน 20 วัน)
              </p>

              <p>
                <strong>ข้อ 2. ดอกเบี้ย:</strong> หากยอดกู้สะสมรวมในเดือนไม่เกิน 4,000 บาท คิดดอกเบี้ยร้อยละ 0% หากยอดกู้สะสมเกิน 4,000 บาทขึ้นไป จะคิดดอกเบี้ยระยะสั้นร้อยละ 5%
              </p>

              <p>
                <strong>ข้อ 3. กำหนดการชำระคืน:</strong> ยินยอมให้หักชำระคืนจากเงินเดือนในงวดจ่ายค่าจ้างถัดไป (ทุกวันที่ 10 ของเดือน)
              </p>

              <p className="bg-orange-50 p-2 rounded-xl border border-orange-200 text-orange-900">
                <strong>ข้อ 4. การยินยอมหักเงินค่าจ้าง:</strong> ผู้กู้ยินยอมและมอบอำนาจให้บริษัทฯ ดำเนินการหักเงินต้นและดอกเบี้ยจากเงินเดือน หรือค่าจ้างในงวดออกเงินเดือนได้ทันที
              </p>

              <p>
                <strong>ข้อ 5. เงื่อนไขการอนุมัติ:</strong> การขอกู้ยืมเงินสวัสดิการขึ้นอยู่กับการพิจารณาและอนุมัติของฝ่ายบริหารและฝ่ายบัญชีเป็นสำคัญ
              </p>

              <div className="pt-2 text-[10px] text-slate-400 text-center font-mono border-t">
                --- สิ้นสุดข้อความสัญญา (โปรดเลื่อนลงให้สุดเพื่อกดยินยอม) ---
              </div>
            </div>

            {!hasScrolledToBottom && (
              <p className="text-[10px] text-orange-600 font-bold text-center animate-pulse shrink-0">
                👇 กรุณาเลื่อนอ่านข้อความสัญญาลงไปให้สุดด้านล่างเพื่อเปิดปุ่มยินยอม
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t shrink-0">
              <button
                type="button"
                onClick={() => setShowContractModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
              <button
                type="button"
                disabled={!hasScrolledToBottom}
                onClick={() => {
                  setFormData({ ...formData, acceptedTerms: true });
                  setShowContractModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-40 cursor-pointer"
              >
                ✓ ยอมรับเงื่อนไขสัญญา
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Custom Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-100 my-auto">
            
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold border-4 border-emerald-50 shadow-inner">
              ✓
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                ยื่นเรื่องกู้ยืมสำเร็จ!
              </h3>
              <p className="text-xs text-slate-500">
                คำขอกู้ยืมเงินของคุณถูกส่งไปยังระบบเรียบร้อยแล้ว สามารถติดตามสถานะได้ที่หน้าประวัติ
              </p>
            </div>

            <button
              type="button"
              onClick={handleSuccessClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              ตกลง (กลับหน้าประวัติ)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}