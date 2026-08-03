"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HRView from "./components/HRView";
import SalesView from "./components/SalesView";
import ContentView from "./components/ContentView";
import UserManagementView from "./components/UserManagementView";

interface Profile {
  id?: string;
  full_name?: string;
  name?: string;
  role: string;
  email: string;
}

export default function AdminDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "hr" | "sales" | "cms" | "users">("overview");
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        // ดึงข้อมูล User จาก Session API (หรืออ่านผ่าน API Me)
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setProfile(data.user);
            return;
          }
        }
        // ถ้าไม่มี Session ให้ดีดไปหน้า Login
        window.location.href = "/admin/login";
      } catch (err) {
        console.error("Error fetching profile:", err);
        window.location.href = "/admin/login";
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    window.location.href = "/admin/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-600 flex items-center justify-center font-medium">
        <p className="animate-pulse">กำลังโหลดข้อมูลระบบ...</p>
      </div>
    );
  }

  // แปลง Role เป็นพิมพ์ใหญ่เพื่อเช็คสิทธิ์แบบยืดหยุ่น
  const role = profile?.role?.toUpperCase() || "";
  
  const isSuperAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
  const canAccessHR = isSuperAdmin || role === "HR";
  const canAccessSale = isSuperAdmin || role === "SALE";
  const canAccessCMS = isSuperAdmin || role === "DESIGN_CONTENT";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 text-slate-700 flex flex-col justify-between p-6 shrink-0">
        <div>
          <div className="mb-8 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-800 tracking-wide">KMS ADMIN</h2>
            <p className="text-xs text-amber-600 mt-1 uppercase font-bold">
              สิทธิ์: {role.replace("_", " ")}
            </p>
          </div>

          <nav className="space-y-1.5 font-medium text-sm">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === "overview"
                  ? "bg-amber-500 text-white font-semibold shadow-md shadow-amber-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              📊 ภาพรวมระบบ
            </button>

            {canAccessHR && (
              <button
                onClick={() => setActiveTab("hr")}
                className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeTab === "hr"
                    ? "bg-amber-500 text-white font-semibold shadow-md shadow-amber-500/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                📑 ใบสมัครงาน (HR)
              </button>
            )}

            {canAccessSale && (
              <button
                onClick={() => setActiveTab("sales")}
                className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeTab === "sales"
                    ? "bg-amber-500 text-white font-semibold shadow-md shadow-amber-500/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                💬 ข้อความติดต่อ (Sale)
              </button>
            )}

            {canAccessCMS && (
              <button
                onClick={() => setActiveTab("cms")}
                className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeTab === "cms"
                    ? "bg-amber-500 text-white font-semibold shadow-md shadow-amber-500/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                🖼️ จัดการเนื้อหาเว็บ (Content)
              </button>
            )}

            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab("users")}
                className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeTab === "users"
                    ? "bg-amber-500 text-white font-semibold shadow-md shadow-amber-500/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                ⚙️ จัดการสิทธิ์แอดมิน
              </button>
            )}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-500 truncate mb-3 font-medium">{profile?.email}</p>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl transition-colors text-center cursor-pointer"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-x-hidden">
        <header className="mb-8 border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold text-slate-800">
            ยินดีต้อนรับคุณ {profile?.full_name || profile?.name || "Admin"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            เลือกเมนูจากแถบด้านข้างเพื่อเริ่มต้นจัดการระบบ
          </p>
        </header>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">บทบาทของคุณ</p>
              <p className="text-2xl font-bold text-amber-500 mt-2 capitalize">
                {role.replace("_", " ")}
              </p>
            </div>
          </div>
        )}

        {activeTab === "sales" && canAccessSale && <SalesView />}
        {activeTab === "hr" && canAccessHR && <HRView />}
        {activeTab === "cms" && canAccessCMS && <ContentView />}
        {activeTab === "users" && isSuperAdmin && <UserManagementView />}
      </main>
    </div>
  );
}