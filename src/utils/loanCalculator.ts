export interface LoanCalculationInput {
  baseDailyRate: number; // เรทค่าจ้างต่อวัน
  workedDaysThisCycle: number; // จำนวนวันทำงานในรอบนั้นๆ
  requestedAmount: number; // ยอดที่ต้องการกู้
  socialSecurity: number; // ประกันสังคม
  tax: number; // ภาษี
}

export interface LoanCalculationResult {
  maxQuota: number; // สิทธิ์กู้ยืมสูงสุด (เช่น 85% ของค่าจ้าง)
  interest: number; // ดอกเบี้ย (5% ถ้ายอด >= 3,000)
  totalDeductionOnPayday: number; // ยอดหักรวมในวันเงินเดือนออก (วันที่ 10)
}

/**
 * ฟังก์ชันคำนวณวงเงินและดอกเบี้ยแบบใช้ร่วมกันทั้งระบบ
 */
export function calculateLoanDetails(input: LoanCalculationInput): LoanCalculationResult {
  // 1. คำนวณวงเงินสูงสุดตามรอบ (เช่น 85% ของค่าจ้างตามวันทำงานในรอบนั้น)
  const totalEarnings = input.baseDailyRate * input.workedDaysThisCycle;
  const maxQuota = Math.floor(totalEarnings * 0.85);

  // 2. คำนวณดอกเบี้ย (ยอดกู้ตั้งแต่ 3,000 บาทขึ้นไป คิด 5%)
  let interest = 0;
  if (input.requestedAmount >= 3000) {
    interest = input.requestedAmount * 0.05;
  }

  // 3. ยอดหักรวมในวันเงินเดือนออก (วันที่ 10) = เงินต้น + ดอกเบี้ย + ประกันสังคม + ภาษี
  const totalDeductionOnPayday = input.requestedAmount + interest + input.socialSecurity + input.tax;

  return {
    maxQuota,
    interest,
    totalDeductionOnPayday,
  };
}