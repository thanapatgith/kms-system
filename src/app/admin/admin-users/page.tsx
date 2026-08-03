import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const session = await requireSession();

  const users = await prisma.user.findMany({
    include: { site: true },
    orderBy: { createdAt: "desc" },
  });

  // ฟังก์ชัน Logout สำหรับ Server Component
  async function handleLogout() {
    "use server";
    cookies().delete("session"); // หรือชื่อคุกกี้ที่โปรเจกต์ใช้เก็บระบบ Login
    redirect("/login");
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">จัดการผู้ใช้และพนักงาน</h1>
            <p className="text-sm text-slate-500 mt-1">
              ระบบบริหารจัดการข้อมูลบัญชีผู้ใช้งานและกำหนดสิทธิ์ (Roles) ภายในองค์กร
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/admin-users/create"
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer"
            >
              + เพิ่มพนักงานใหม่
            </Link>

            <form action={handleLogout}>
              <button
                type="submit"
                className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-sm rounded-xl transition cursor-pointer"
              >
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-600 tracking-wider">
                  <th className="p-4 md:px-6">ชื่อ-นามสกุล / รหัสพนักงาน</th>
                  <th className="p-4 md:px-6">บทบาท (Role)</th>
                  <th className="p-4 md:px-6">หน่วยงาน</th>
                  <th className="p-4 md:px-6">เบอร์โทรศัพท์</th>
                  <th className="p-4 md:px-6 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      ยังไม่มีข้อมูลพนักงานในระบบ
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 md:px-6">
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">
                          รหัส: {u.employeeCode || "N/A"} | Username: {u.username}
                        </p>
                      </td>
                      <td className="p-4 md:px-6">
                        <span className="inline-flex px-3 py-1 bg-orange-50 border border-orange-200 text-orange-700 font-bold text-xs rounded-full uppercase tracking-wider">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 md:px-6 font-medium text-slate-700">
                        {u.site?.siteName ?? "ไม่ระบุหน่วยงาน"}
                      </td>
                      <td className="p-4 md:px-6 text-slate-600">
                        {u.phone || "-"}
                      </td>
                      <td className="p-4 md:px-6 text-center">
                        <Link
                          href={`/admin/admin-users/edit/${u.id}`}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-orange-500 hover:text-white text-slate-700 font-semibold text-xs rounded-lg transition"
                        >
                          แก้ไข
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}