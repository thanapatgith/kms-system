"use client";

import { useEffect, useState } from "react";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "super_admin" | "hr" | "sale" | "design_content";
  created_at?: string;
}

export default function UserManagementView() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // State สำหรับ Modal สร้าง User ใหม่
  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"super_admin" | "hr" | "sale" | "design_content">("hr");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ดึงข้อมูลผู้ใช้
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // สร้างผู้ใช้ใหม่
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          role,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("สร้างแอดมินใหม่สำเร็จแล้ว!");
        setShowModal(false);
        setFullName("");
        setEmail("");
        setPassword("");
        setRole("hr");
        fetchUsers();
      } else {
        alert("เกิดข้อผิดพลาด: " + data.error);
      }
    } catch (err) {
      alert("ไม่สามารถเชื่อมต่อกับระบบได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  // อัปเดต Role
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await res.json();

      if (data.success) {
        alert("อัปเดตสิทธิ์เรียบร้อยแล้ว");
        fetchUsers();
      } else {
        alert("เกิดข้อผิดพลาด: " + data.error);
      }
    } catch (err) {
      alert("ไม่สามารถเชื่อมต่อกับระบบได้");
    }
  };

  // ลบผู้ใช้
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ "${userName}"?`)) return;

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        alert("ลบผู้ใช้สำเร็จเรียบร้อยแล้ว");
        fetchUsers();
      } else {
        alert("เกิดข้อผิดพลาดในการลบ: " + data.error);
      }
    } catch (err) {
      alert("ไม่สามารถเชื่อมต่อกับระบบได้");
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      {/* Header & Control Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">⚙️ จัดการสิทธิ์แอดมิน</h2>
          <p className="text-xs text-slate-500 mt-1">จัดการรายชื่อ สร้าง สิทธิ์การใช้งาน และลบผู้ดูแลระบบ</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            ➕ เพิ่มแอดมินใหม่
          </button>
          <button
            onClick={fetchUsers}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            🔄 รีเฟรชข้อมูล
          </button>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <p className="text-slate-400 text-sm animate-pulse text-center py-8">กำลังโหลดข้อมูลผู้ใช้...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4">อีเมล</th>
                <th className="py-3 px-4">สิทธิ์การใช้งาน (ROLE)</th>
                <th className="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-slate-800">{u.full_name || "-"}</td>
                  <td className="py-3.5 px-4 text-slate-500">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 text-slate-700 font-medium cursor-pointer"
                    >
                      <option value="super_admin">SUPER ADMIN</option>
                      <option value="hr">HR</option>
                      <option value="sale">SALE</option>
                      <option value="design_content">DESIGN / CONTENT</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleDeleteUser(u.id, u.full_name || u.email)}
                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      🗑️ ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal สำหรับสร้างแอดมินใหม่ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">➕ เพิ่มแอดมินผู้ใช้งานใหม่</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อ - นามสกุล</label>
                <input
  type="text"
  required
  placeholder="เช่น Somchai Jaidee"
  value={fullName}
  onChange={(e) => setFullName(e.target.value)}
  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">อีเมล</label>
                <input
  type="email"
  required
  placeholder="เช่น hr@kmsguard.co.th"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสผ่าน</label>
                <input
  type="password"
  required
  placeholder="••••••••"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">สิทธิ์การใช้งาน (Role)</label>
                <select
  value={role}
  onChange={(e) => setRole(e.target.value as any)}
  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
>
  <option value="hr">📑 HR (ดูแลระบบใบสมัครงาน)</option>
  <option value="sale">💬 SALE (ดูแลข้อความติดต่อ)</option>
  <option value="design_content">🖼️ DESIGN / CONTENT (จัดการภาพ/เนื้อหาเว็บ)</option>
  <option value="super_admin">👑 SUPER ADMIN (จัดการได้ทุกอย่าง)</option>
</select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}