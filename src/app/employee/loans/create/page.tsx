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

  // ค่าสมมติฐานเงินเดือนและค่าจ้างรายวัน
  const dailyWage = 650;
  const baseSalary = 19500;
  const currentDay = new Date().getDate(); // วันที่ปัจจุบัน เช่น 10
  const accumulatedWage = currentDay * dailyWage; // 10 x 650 = 6,500
  const maxAdvanceLimit = Math.floor(accumulatedWage * 0.5); // 50% = 3,250 บาท
  const maxLoanLimit = baseSalary; // 19,500 บาท

  const [formData, setFormData] = useState({
    type: "ADVANCE",
    amount: "",
    installments: "1",
    reason: "",
    acceptedTerms: false,
  });

  const [showContractModal, setShowContractModal] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const contractScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfile();
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

  const handleContractScroll = () => {
    if (contractScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contractScrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 15) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const currentLimit = formData.type === "ADVANCE" ? maxAdvanceLimit : maxLoanLimit;
  const isOverLimit = Number(formData.amount) > currentLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const reqAmt = Number(formData.amount);

    if (!reqAmt || reqAmt <= 0) {
      setErrorMsg("กรุณาระบุจำนวนเงินที่ต้องการให้ถูกต้อง");
      return;
    }

    if (isOverLimit) {
      setErrorMsg(`จำนวนเงินที่คุณระบุ (฿${reqAmt.toLocaleString()}) เกินสิทธิ์สูงสุดที่ได้รับ (฿${currentLimit.toLocaleString()})`);
      return;
    }

    if (!formData.acceptedTerms) {
      setErrorMsg("กรุณากดอ่านหนังสือสัญญาและติ๊กยืนยันการยอมรับเงื่อนไขก่อนส่งเรื่อง");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/employee/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการยื่นคำขอ");
      }

      // แสดง Custom Success Modal แทน alert Native
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
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/employee/loans" className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1">
            ‹ กลับ
          </Link>
          <h1 className="text-sm font-bold">ยื่นคำขอการเงินสวัสดิการ</h1>
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
            <span className="font-bold text-slate-900">{profile?.name || "สมชาย ใจดี"}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>อัตราค่าจ้าง/เงินเดือน:</span>
            <span className="font-bold text-slate-900">฿{dailyWage}/วัน (฿{baseSalary.toLocaleString()}/เดือน)</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>หน่วยงานสังกัด:</span>
            <span className="font-bold text-orange-600">{profile?.branch || "ยังไม่ระบุหน่วยงาน"}</span>
          </div>
        </div>

        {/* ฟอร์มยื่นคำขอ */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5 text-xs">
            
            {/* เลือกประเภท */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">ประเภทการขอเบิก *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "ADVANCE", installments: "1" })}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-0.5 transition cursor-pointer ${
                    formData.type === "ADVANCE"
                      ? "bg-orange-50 border-orange-500 text-orange-900 font-bold shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <span className="text-xs">💸 เบิกค่าจ้างล่วงหน้า</span>
                  <span className="text-[10px] text-slate-500">ค่าจ้างที่ทำมาแล้ว (ดบ. 0%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "LOAN" })}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-0.5 transition cursor-pointer ${
                    formData.type === "LOAN"
                      ? "bg-orange-50 border-orange-500 text-orange-900 font-bold shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <span className="text-xs">💰 เงินกู้สวัสดิการ</span>
                  <span className="text-[10px] text-slate-500">ผ่อนชำระ (ดบ. 15%/ปี)</span>
                </button>
              </div>
            </div>

            {/* สรุปสิทธิ์วงเงินสูงสุด */}
            <div className="p-3 bg-orange-50/80 rounded-2xl border border-orange-200 text-[11px] text-orange-950 space-y-1">
              {formData.type === "ADVANCE" ? (
                <>
                  <div className="flex justify-between items-center font-bold text-orange-900">
                    <span>💡 วันที่ทำงานงวดนี้ (วันที่ 1 - {currentDay}):</span>
                    <span>{currentDay} วัน</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>ค่าจ้างสะสมจริง ({currentDay} วัน × ฿{dailyWage}):</span>
                    <span className="font-mono">฿{accumulatedWage.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-emerald-700 text-xs pt-1 border-t border-orange-200/60">
                    <span>เบิกสูงสุดได้ไม่เกิน (50%):</span>
                    <span className="font-mono text-sm">฿{maxAdvanceLimit.toLocaleString()}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 pt-0.5">* คิดค่าธรรมเนียมจัดการ 20 บาท หักคืนในรอบจ่ายค่าจ้างถัดไป</p>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center font-bold text-orange-900">
                    <span>💡 สิทธิ์วงเงินกู้สวัสดิการสูงสุด:</span>
                    <span>1 เท่าของเงินเดือน</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-emerald-700 text-xs pt-1 border-t border-orange-200/60">
                    <span>เพดานวงเงินกู้สูงสุด:</span>
                    <span className="font-mono text-sm">฿{maxLoanLimit.toLocaleString()}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 pt-0.5">* คิดดอกเบี้ยร้อยละ 15% ต่อปี (1.25%/เดือน) ผ่อนชำระได้สูงสุด 3 งวด</p>
                </>
              )}
            </div>

            {/* จำนวนเงินที่ต้องการ */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-800">
                  {formData.type === "ADVANCE" ? "จำนวนเงินที่ต้องการเบิก (บาท) *" : "จำนวนเงินที่ต้องการกู้ (บาท) *"}
                </label>
                <span className="text-[10px] font-bold text-slate-400">
                  สูงสุด ฿{currentLimit.toLocaleString()}
                </span>
              </div>
              
              <input
                type="number"
                name="amount"
                min="100"
                step="100"
                required
                placeholder={`กรอกจำนวนเงินไม่เกิน ฿${currentLimit.toLocaleString()}`}
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
                    ยอดที่คุณกรอกเกินสิทธิ์สูงสุดที่เบิกได้ (เบิกได้ไม่เกิน ฿{currentLimit.toLocaleString()})
                  </span>
                </div>
              )}
            </div>

            {/* จำนวนงวด (สำหรับ Loan) */}
            {formData.type === "LOAN" && (
              <div>
                <label className="block font-bold text-slate-800 mb-1">ระยะเวลาผ่อนชำระ *</label>
                <select
                  name="installments"
                  value={formData.installments}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
                >
                  <option value="1">1 งวด (หักค่าจ้างเดือนถัดไป)</option>
                  <option value="2">2 งวด (แบ่งหัก 2 เดือน)</option>
                  <option value="3">3 งวด (แบ่งหัก 3 เดือน - สูงสุด)</option>
                </select>
              </div>
            )}

            {/* เหตุผลความจำเป็น */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">เหตุผลความจำเป็น *</label>
              <textarea
                name="reason"
                rows={3}
                required
                value={formData.reason}
                onChange={handleChange}
                placeholder="ระบุเหตุผลความจำเป็นในการขอเบิก/กู้เงิน..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none resize-none"
              />
            </div>

          </div>

          {/* หนังสือสัญญา */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-slate-800">📜 หนังสือสัญญากู้ยืมและข้อตกลงยินยอม</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              ตามกฎหมายแรงงาน พนักงานสามารถยื่นได้ทีละ 1 ครั้งต่อประเภท และต้องอ่านสัญญาลงไปให้สุดเพื่อกดยืนยันยินยอมหักค่าจ้าง
            </p>

            <button
              type="button"
              onClick={() => setShowContractModal(true)}
              className="w-full py-2.5 bg-slate-100 hover:bg-orange-50 border border-slate-300 hover:border-orange-300 text-slate-800 font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>📑</span>
              <span>{formData.acceptedTerms ? "✓ อ่านสัญญาเรียบร้อยแล้ว (เปิดอ่านอีกครั้ง)" : "กดเพื่ออ่านหนังสือสัญญาฉบับเต็ม"}</span>
            </button>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                name="acceptedTerms"
                disabled={!formData.acceptedTerms && !hasScrolledToBottom}
                checked={formData.acceptedTerms}
                onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                className="mt-0.5 rounded text-orange-600 focus:ring-orange-500 w-4 h-4 shrink-0 disabled:opacity-40"
              />
              <span className={`text-[11px] leading-snug ${formData.acceptedTerms ? "text-emerald-700 font-semibold" : "text-slate-500"}`}>
                ข้าพเจ้าได้อ่านหนังสือสัญญากู้ยืมเงิน และยินยอมให้บริษัทฯ หักเงินจากค่าจ้างตามเงื่อนไขทุกประการ
              </span>
            </label>
          </div>

          {/* ปุ่มส่งคำขอ */}
          <button
            type="submit"
            disabled={submitting || !formData.acceptedTerms || isOverLimit}
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
              className="flex-1 overflow-y-auto p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-700 space-y-3 leading-relaxed font-sans"
            >
              <div className="text-center space-y-1 pb-2 border-b">
                <p className="font-bold text-slate-900 text-xs">
                  บริษัท รักษาความปลอดภัย เคเอ็ม การ์ด แอนด์ ซัพพลาย กรุ๊ป จำกัด[cite: 1]
                </p>
                <p className="text-[10px] text-slate-500">
                  หนังสือสัญญากู้ยืมเงินพนักงาน และหนังสือยินยอมให้หักเงินค่าจ้าง[cite: 1]
                </p>
              </div>

              <p>
                สัญญาฉบับนี้ทำขึ้นระหว่าง <strong>บริษัท รักษาความปลอดภัย เคเอ็ม การ์ด แอนด์ ซัพพลาย กรุ๊ป จำกัด</strong> (ต่อไปเรียกว่า "ผู้ให้กู้") กับ พนักงาน (ต่อไปเรียกว่า "ผู้กู้")[cite: 1] โดยคู่สัญญาได้ตกลงทำสัญญาเงินกู้ยืมกัน มีข้อความสำคัญดังต่อไปนี้:[cite: 1]
              </p>

              <p>
                <strong>ข้อ 1. จำนวนเงินกู้และการรับเงิน:</strong> ผู้กู้ได้ตกลงกู้ยืมเงิน และผู้ให้กู้ตกลงให้กู้ยืมเงินตามจำนวนที่ระบุในระบบ โดยกรณีเบิกค่าจ้างล่วงหน้าเบิกได้ไม่เกิน 50% ของค่าจ้างตามวันทำงานจริง และกรณีเงินกู้สวัสดิการกู้ได้ไม่เกินฐานเงินเดือน 1 เดือน[cite: 1]
              </p>

              <p>
                <strong>ข้อ 2. ดอกเบี้ย:</strong> สำหรับเงินกู้สวัสดิการคิดดอกเบี้ยร้อยละ 15 ต่อปี (ร้อยละ 1.25 ต่อเดือน) ซึ่งเป็นอัตราตามที่กฎหมายกำหนด ส่วนการเบิกค่าจ้างล่วงหน้าคิดดอกเบี้ยร้อยละ 0[cite: 1]
              </p>

              <p>
                <strong>ข้อ 3. กำหนดการชำระคืนเงินกู้:</strong> ผ่อนชำระคืนเงินต้นพร้อมดอกเบี้ยโดยผ่อนได้สูงสุดไม่เกิน 3 งวดการจ่ายค่าจ้าง[cite: 1]
              </p>

              <p className="bg-orange-50 p-2 rounded-xl border border-orange-200 text-orange-900">
                <strong>ข้อ 4. เงื่อนไขพิเศษ ยินยอมให้หักเงินจากค่าจ้าง/เงินเดือน:</strong> ผู้กู้ยินยอมและมอบอำนาจให้ผู้ให้กู้ดำเนินการหักเงินต้นและดอกเบี้ยจากเงินเดือน ค่าจ้าง เงินโบนัส หรือเงินอื่นใดในแต่ละงวดจ่ายได้ทันทีจนกว่าจะชำระหนี้เสร็จสิ้น[cite: 1]
              </p>

              <p>
                <strong>ข้อ 5. การสิ้นสุดสภาพพนักงานและการบังคับชำระหนี้:</strong> ในกรณีที่ผู้กู้พ้นสภาพจากการเป็นพนักงานก่อนชำระหนี้ครบถ้วน ให้ถือว่าหนี้ส่วนที่เหลือทั้งหมดถึงกำหนดชำระโดยพลัน และผู้กู้ยินยอมให้หักเงินค่าจ้างงวดสุดท้าย เงินชดเชย หรือเงินสวัสดิการอื่นใด เพื่อนำมาหักชำระหนี้คงค้างให้ครบถ้วน[cite: 1]
              </p>

              <p>
                <strong>ข้อ 6. การผูกพันสิทธิ์:</strong> พนักงานจะสามารถยื่นเรื่องกู้/เบิกได้ทีละ 1 ครั้งต่อประเภท จนกว่ายอดเงินกู้เดิมจะได้รับการชำระคืนครบถ้วนแล้วเท่านั้น
              </p>

              <div className="pt-2 text-[10px] text-slate-400 text-center font-mono border-t">
                --- สิ้นสุดข้อความสัญญา (โปรดเลื่อนลงให้สุดเพื่อกดยินยอม) ---
              </div>
            </div>

            {!hasScrolledToBottom && (
              <p className="text-[10px] text-orange-600 font-bold text-center animate-pulse shrink-0">
                👇 กรุณาเลื่อนอ่านข้อความสัญญาลงไปให้สุดด้านล่างเพื่อกดยืนยัน
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

      {/* Custom Success Modal (แจ้งเตือนทำรายการสำเร็จแบบสวยงาม) */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-100 my-auto transform transition-all scale-100">
            
            {/* Icon ติ๊กถูกสีเขียว */}
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold border-4 border-emerald-50 shadow-inner">
              ✓
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                ยื่นเรื่องสำเร็จเรียบร้อย!
              </h3>
              <p className="text-xs text-slate-500">
                คำขอของคุณถูกส่งไปยังฝ่ายที่เกี่ยวข้องเรียบร้อยแล้ว สามารถติดตามสถานะได้ที่หน้าประวัติ
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