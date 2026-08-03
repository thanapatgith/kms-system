import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function EmployeeProfilePage() {
  const session = await requireSession();

  // ดึงข้อมูลพนักงานปัจจุบันพร้อมหน่วยงาน (Site)
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { site: true },
  });

  // ฟังก์ชัน Logout สำหรับพนักงาน
  async function handleLogout() {
    "use server";
    cookies().delete("session");
    redirect("/login");
  }

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-12">
      
      {/* 1. Header / Navbar สำหรับพนักงาน */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-orange-500 font-bold text-xs rounded-lg uppercase tracking-wider">
              {user?.role || "EMPLOYEE"}
            </span>
            <h1 className="text-lg font-bold">KMS Employee Portal</h1>
          </div>

          {/* เมนูลัดบน Navbar */}
          <nav className="flex items-center gap-2 flex-wrap justify-center text-sm font-semibold">
            <Link href="/employee/profile" className="px-3 py-2 bg-slate-800 text-orange-400 rounded-lg">
              หน้าแรก / โปรไฟล์
            </Link>
            <Link href="/employee/leaves" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              ระบบลา
            </Link>
            <Link href="/employee/attendance" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              ลงเวลาทำงาน
            </Link>
            <Link href="/employee/shifts" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              ตารางเวร
            </Link>
            <form action={handleLogout}>
              <button type="submit" className="px-3 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition">
                ออกจากระบบ
              </button>
            </form>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">{user?.name}</h2>
            <p className="text-sm text-slate-500 mt-1">
              รหัสพนักงาน: <span className="font-semibold text-slate-700">{user?.employeeCode || "N/A"}</span> | ประจำหน่วยงาน: <span className="font-semibold text-orange-600">{user?.site?.siteName || "ยังไม่ระบุหน่วยงาน"}</span>
            </p>
          </div>
          <span className="px-4 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 font-bold text-xs rounded-full uppercase tracking-wider">
            {user?.role}
          </span>
        </div>

        {/* เมนูลัด Quick Actions (สำหรับกดไปโมดูลต่างๆ) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/employee/leaves" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-orange-500 hover:shadow-md transition text-center group">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-bold text-slate-800 group-hover:text-orange-600 text-sm">ยื่นใบลา</h3>
            <p className="text-xs text-slate-400 mt-1">ลาป่วย, ลากิจ, ลาพักร้อน</p>
          </Link>

          <Link href="/employee/attendance" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-orange-500 hover:shadow-md transition text-center group">
            <div className="text-3xl mb-2">⏱️</div>
            <h3 className="font-bold text-slate-800 group-hover:text-orange-600 text-sm">ลงเวลาทำงาน</h3>
            <p className="text-xs text-slate-400 mt-1">เช็คอินเข้า-ออกงาน</p>
          </Link>

          <Link href="/employee/shifts" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-orange-500 hover:shadow-md transition text-center group">
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-bold text-slate-800 group-hover:text-orange-600 text-sm">ตารางเวร</h3>
            <p className="text-xs text-slate-400 mt-1">ตรวจสอบผลัดการทำงาน</p>
          </Link>

          <Link href="/employee/logbook" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-orange-500 hover:shadow-md transition text-center group">
            <div className="text-3xl mb-2">🛡️</div>
            <h3 className="font-bold text-slate-800 group-hover:text-orange-600 text-sm">แจ้งเหตุการณ์</h3>
            <p className="text-xs text-slate-400 mt-1">รายงานการตรวจตราประจำวัน</p>
          </Link>
        </div>

        {/* Grid ข้อมูลส่วนตัว & ใบอนุญาต */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* ข้อมูลส่วนตัว */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-3">ข้อมูลส่วนตัว</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">เลขบัตรประชาชน:</span>
                <span className="font-semibold text-slate-800">{user?.idCardNumber || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">เบอร์โทรศัพท์:</span>
                <span className="font-semibold text-slate-800">{user?.phone || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">อายุ:</span>
                <span className="font-semibold text-slate-800">{user?.age ? `${user.age} ปี` : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ที่อยู่:</span>
                <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">{user?.address || "-"}</span>
              </div>
            </div>
          </div>

          {/* สถานะใบอนุญาต & PDPA */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-3">สถานะใบอนุญาต & PDPA</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">ใบอนุญาต รปภ. (ธภ.7):</p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-slate-800">{user?.thop7LicenseNo || "ยังไม่มีข้อมูลเลขใบอนุญาต"}</span>
                  <span className="text-xs text-slate-400">
                    {user?.thop7Expire ? `หมดอายุ: ${new Date(user.thop7Expire).toLocaleDateString("th-TH")}` : "ไม่ระบุวันหมดอายุ"}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-slate-500 mb-1">การยินยอม PDPA:</p>
                {user?.pdpaConsent ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs">
                    ✓ ให้ความยินยอมแล้ว
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg font-bold text-xs">
                    ✕ ยังไม่ได้ยินยอม
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}