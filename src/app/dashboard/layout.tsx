import Link from "next/link";
import { requireSession } from "@/lib/auth";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();
  
  // เช็คสิทธิ์ว่าเป็น Admin หรือ Super Admin หรือไม่
  const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-security-dark text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/dashboard/profile" className="font-black">
            KMS <span className="text-security-orange">PORTAL</span>
          </Link>
          <span className="text-sm text-slate-300">
            {session.username} · {session.role}
          </span>
        </div>
      </header>
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 text-sm font-semibold text-security-navy">
          <div className="flex items-center gap-6">
            <Link href="/dashboard/profile">โปรไฟล์</Link>
            <Link href="/dashboard/leave">แจ้งลาออนไลน์</Link>
            
            {/* แสดงเมนูนี้เฉพาะเมื่อเป็น Admin หรือ Super Admin */}
            {isAdmin && (
              <Link href="/admin/leaves" className="text-security-orange font-bold">
                อนุมัติการลา
              </Link>
            )}
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="text-security-orange">ออกจากระบบ</button>
          </form>
        </div>
      </nav>
      {children}
    </div>
  );
}