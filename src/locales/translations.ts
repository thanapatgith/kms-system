export const translations: any = {
  th: {
    welcome: "ยินดีต้อนรับสู่ระบบบริหารจัดการ รปภ. KMS",
    subtitle: "ท่านสามารถตรวจสอบภาพรวมสถิติโครงการ สถานะรายงานประจำวัน และข้อมูลการชำระเงินได้ทันที",
    projects: "โครงการ / ไซต์งาน",
    units: "แห่ง",
    guards: "รปภ. ผู้ดูแล",
    persons: "นาย",
    reports: "รายงานทั้งหมด",
    reportsCount: "ฉบับ",
    pending: "รอรับทราบ",
    navStats: "สถิติ",
    navReports: "รายงาน",
    navPayment: "ชำระเงิน",
    navContract: "ข้อมูลสัญญา",
    logout: "ออกจากระบบ",
  },
  en: {
    welcome: "Welcome to KMS Security Management System",
    subtitle: "You can instantly check project overviews, daily report statuses, and payment information.",
    projects: "Projects / Sites",
    units: "sites",
    guards: "Security Guards",
    persons: "persons",
    reports: "Total Reports",
    reportsCount: "reports",
    pending: "Pending Acknowledgment",
    navStats: "Stats",
    navReports: "Reports",
    navPayment: "Payment",
    navContract: "Contract",
    logout: "Logout",
  }
};

// ฟังก์ชันดึงภาษาปัจจุบันทั่วระบบ
export function getLang(): "th" | "en" {
  if (typeof window === "undefined") return "th";
  return (localStorage.getItem("app_lang") as "th" | "en") || "th";
}

// ฟังก์ชันสั่งเปลี่ยนภาษา (ทุกหน้าจะอัปเดตตามทันที)
export function setLang(lang: "th" | "en") {
  if (typeof window === "undefined") return;
  localStorage.setItem("app_lang", lang);
  window.dispatchEvent(new Event("app_lang_changed"));
}