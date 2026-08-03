import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PasswordForm from "./password-form";

export default async function ProfilePage() {
  const session = await requireSession();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.userId },
    include: { site: true },
  }); 

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header โปรไฟล์ */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
          <p className="text-sm font-medium text-slate-600">
            รหัสพนักงาน: <span className="text-slate-800">{user.employeeCode || "N/A"}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            ประจำหน่วยงาน:{" "}
            <span className="font-semibold text-slate-700">
              {user.site?.siteName ?? "ไม่ระบุ"}
            </span>
          </p>
        </div>

        {/* Badge บทบาทผู้ใช้งาน - เพิ่มพื้นหลังเข้มและขอบให้เห็นชัด */}
        <span className="px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 font-bold text-xs rounded-full uppercase tracking-wider shadow-sm">
          {user.role}
        </span>
      </div>

      {/* ข้อมูลส่วนตัว & สถานะเอกสาร */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ข้อมูลทั่วไป */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">
            ข้อมูลส่วนตัว
          </h2>
          <div className="space-y-2.5 text-sm">
            <p className="flex justify-between text-slate-600">
              <span className="font-semibold text-slate-800">เลขบัตรประชาชน:</span>
              <span className="text-slate-900 font-medium">{user.idCardNumber || "-"}</span>
            </p>
            <p className="flex justify-between text-slate-600">
              <span className="font-semibold text-slate-800">เบอร์โทรศัพท์:</span>
              <span className="text-slate-900 font-medium">{user.phone || "-"}</span>
            </p>
            <p className="flex justify-between text-slate-600">
              <span className="font-semibold text-slate-800">อายุ:</span>
              <span className="text-slate-900 font-medium">{user.age ? `${user.age} ปี` : "-"}</span>
            </p>
            <p className="flex justify-between text-slate-600">
              <span className="font-semibold text-slate-800">ที่อยู่:</span>
              <span className="text-slate-900 font-medium text-right max-w-[200px] truncate">{user.address || "-"}</span>
            </p>
          </div>
        </div>

        {/* ข้อมูลใบอนุญาต รปภ. (ธภ.7) & PDPA */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">
            สถานะใบอนุญาต & PDPA
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-slate-800 mb-1">ใบอนุญาต รปภ. (ธภ.7):</p>
              <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium">
                {user.thop7LicenseNo ? `เลขที่ ${user.thop7LicenseNo}` : "ยังไม่มีข้อมูล / ไม่พบเอกสาร"}
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-800 mb-1">การยินยอม PDPA:</p>
              {user.pdpaConsent ? (
                <span className="inline-flex items-center px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-md font-bold">
                  ✓ ยินยอมแล้ว {user.pdpaAcceptedAt ? `(${new Date(user.pdpaAcceptedAt).toLocaleDateString("th-TH")})` : ""}
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-bold">
                  ✕ ยังไม่ได้ยินยอม
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ฟอร์มเปลี่ยนรหัสผ่าน */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
          จัดการบัญชี
        </h2>
        <PasswordForm />
      </div>
    </div>
  );
}