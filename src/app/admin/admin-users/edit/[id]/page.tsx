"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EditUserPage({ params }: { params: { id: string } }) {
  const userId = params.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    employeeCode: "",
    role: "EMPLOYEE",
    phone: "",
    idCardNumber: "",
  });

  // ดึงข้อมูลเดิมของพนักงานมาแสดงในฟอร์ม
  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.user) {
          setFormData({
            name: data.user.name || "",
            username: data.user.username || "",
            employeeCode: data.user.employeeCode || "",
            role: data.user.role || "EMPLOYEE",
            phone: data.user.phone || "",
            idCardNumber: data.user.idCardNumber || "",
          });
        } else {
          setErrorMsg("ไม่พบข้อมูลพนักงานในระบบ");
        }
        setLoading(false);
      })
      .catch(() => {
        setErrorMsg("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        setLoading(false);
      });
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "ไม่สามารถอัปเดตข้อมูลได้");
      }

      router.push("/admin/admin-users");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">
        กำลังโหลดข้อมูลพนักงาน...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header และปุ่มย้อนกลับ */}
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">แก้ไขข้อมูลพนักงาน</h1>
            <p className="text-sm text-slate-500 mt-1">อัปเดตข้อมูลส่วนตัวและสิทธิ์การใช้งานระบบ</p>
          </div>
          <Link
            href="/admin/admin-users"
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition"
          >
            ← กลับหน้าจัดการ
          </Link>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-slate-200 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">ชื่อ - นามสกุล *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">รหัสพนักงาน</label>
              <input
                type="text"
                name="employeeCode"
                value={formData.employeeCode}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">USERNAME สำหรับเข้าสู่ระบบ *</label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">บทบาทและสิทธิ์ (Role) *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition font-medium"
              >
                <option value="EMPLOYEE">EMPLOYEE (พนักงานทั่วไป / รปภ.)</option>
                <option value="SUPERVISOR">SUPERVISOR (สายตรวจ / หัวหน้าชุด)</option>
                <option value="HR">HR (ฝ่ายบุคคล - อนุมัติลา)</option>
                <option value="FINANCE">FINANCE (ฝ่ายการเงิน - เงินเดือน/เบิกจ่าย)</option>
                <option value="WAREHOUSE">WAREHOUSE (ฝ่ายคลังสินค้า - เบิกอุปกรณ์)</option>
                <option value="CEO">CEO / EXECUTIVE (ผู้บริหารสูงสุด)</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN (ผู้ดูแลระบบสูงสุด)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">เบอร์โทรศัพท์</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">เลขบัตรประชาชน</label>
              <input
                type="text"
                name="idCardNumber"
                value={formData.idCardNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link
              href="/admin/admin-users"
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}