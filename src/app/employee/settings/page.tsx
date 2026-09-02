"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EmployeeSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [lineId, setLineId] = useState("");
  const [address, setAddress] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employee/profile");
      const data = await res.json();
      if (data.ok) {
        setProfile(data.user);
        setPhone(data.user.phone || "");
        setEmail(data.user.email || "");
        setLineId(data.user.lineId || "");
        setAddress(data.user.address || "");
        // ถ้ายังไม่มี imagePreview หรือไม่ได้อยู่ในโหมดแก้ไข ให้ดึงรูปจากระบบมาแสดง
        if (data.user.image && !profileImage) {
          setImagePreview(data.user.image);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file)); // พรีวิวรูปใหม่ทันที
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("phone", phone);
      formData.append("email", email);
      formData.append("lineId", lineId);
      formData.append("address", address);

      if (oldPassword && newPassword) {
        formData.append("oldPassword", oldPassword);
        formData.append("newPassword", newPassword);
      }
      
      if (profileImage) {
        formData.append("image", profileImage);
      }

      const res = await fetch("/api/employee/profile", {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "ไม่สามารถอัปเดตข้อมูลได้");
      }

      setMessage("อัปเดตข้อมูลส่วนตัวและรูปภาพสำเร็จ!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setProfileImage(null);
      setIsEditing(false);
      
      // ดึงข้อมูลใหม่เพื่อให้อัปเดตสมบูรณ์
      await fetchProfileData();
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการอัปเดต");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      router.push("/login");
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-32 text-base font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Link href="/employee/profile" className="text-slate-400 hover:text-white text-xs font-bold">
              ← กลับหน้าแรก
            </Link>
            <h1 className="text-sm font-bold">โปรไฟล์พนักงาน</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-600/20 border border-red-500/40 text-red-400 rounded-xl text-xs font-bold transition hover:bg-red-600/30 cursor-pointer"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-5 space-y-4">
        
        {message && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-bold text-center shadow-sm">
            {message}
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-bold text-center shadow-sm">
            {errorMsg}
          </div>
        )}

        {/* ส่วนรูปโปรไฟล์และชื่อ */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-3">
          <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-orange-500 shadow-md bg-slate-100 flex items-center justify-center">
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">👤</span>
            )}
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-slate-900">{profile?.name || "พนักงาน KMS"}</h2>
            <p className="text-xs text-slate-500 font-medium">รหัสพนักงาน: <span className="font-mono font-bold text-slate-800">{profile?.employeeCode || "-"}</span></p>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition shadow cursor-pointer"
            >
              ✏️ แก้ไขข้อมูล / เปลี่ยนรหัสผ่าน
            </button>
          )}
        </div>

        {!isEditing ? (
          /* โหมดแสดงข้อมูลปกติ (Read-only) */
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-slate-800 border-b pb-2">📋 ข้อมูลสังกัดและค่าจ้าง</h3>
              
              <div className="flex justify-between text-slate-600 py-1">
                <span>เลขบัตรประชาชน:</span>
                <span className="font-mono font-bold text-slate-900">{profile?.idCard || "-"}</span>
              </div>
              <div className="flex justify-between text-slate-600 py-1">
                <span>อายุ / เพศ:</span>
                <span className="font-bold text-slate-900">{profile?.age ? `${profile.age} ปี` : "-"} / {profile?.gender || "-"}</span>
              </div>
              <div className="flex justify-between text-slate-600 py-1">
                <span>หน่วยงานสังกัด:</span>
                <span className="font-bold text-orange-600">{profile?.branch || "-"}</span>
              </div>
              <div className="flex justify-between text-slate-600 py-1">
                <span>อัตราค่าจ้างรายวัน:</span>
                <span className="font-mono font-bold text-emerald-700">฿{profile?.dailyRate || 520}/วัน</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-slate-800 border-b pb-2">🛡️ ข้อมูลใบอนุญาต รปภ. (ทป.7)</h3>
              
              <div className="flex justify-between text-slate-600 py-1">
                <span>เลขที่ใบอนุญาต ทป.7:</span>
                <span className="font-mono font-bold text-slate-900">{profile?.thop7LicenseNo || profile?.thop7_license_no || "ยังไม่ได้บันทึก"}</span>
              </div>
              <div className="flex justify-between text-slate-600 py-1">
                <span>วันหมดอายุ ทป.7:</span>
                <span className="font-mono font-bold text-red-600">
                  {profile?.thop7Expire ? new Date(profile.thop7Expire).toLocaleDateString("th-TH") : "ไม่ระบุ"}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-slate-800 border-b pb-2">📞 ข้อมูลการติดต่อและที่อยู่</h3>
              
              <div className="flex justify-between text-slate-600 py-1">
                <span>เบอร์โทรศัพท์มือถือ:</span>
                <span className="font-mono font-bold text-slate-900">{profile?.phone || "-"}</span>
              </div>
              <div className="flex justify-between text-slate-600 py-1">
                <span>อีเมล (Email):</span>
                <span className="font-mono text-slate-900">{profile?.email || "-"}</span>
              </div>
              <div className="flex justify-between text-slate-600 py-1">
                <span>Line ID:</span>
                <span className="font-mono text-slate-900">{profile?.lineId || "-"}</span>
              </div>
              <div className="flex flex-col text-slate-600 py-1 gap-1">
                <span>ที่อยู่ปัจจุบัน:</span>
                <span className="font-medium text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-100">{profile?.address || "ยังไม่ได้ระบุที่อยู่"}</span>
              </div>
            </div>
          </div>
        ) : (
          /* โหมดแก้ไขข้อมูล (Edit Mode) */
          <form onSubmit={handleUpdateProfile} className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm text-center space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold rounded-xl transition border border-orange-200 cursor-pointer"
              >
                📷 เปลี่ยนรูปภาพโปรไฟล์ใหม่
              </button>
              {profileImage && (
                <p className="text-[11px] text-emerald-600 font-bold">✓ เลือกรูปภาพใหม่เรียบร้อยแล้ว</p>
              )}
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-slate-800 border-b pb-2">📞 แก้ไขข้อมูลการติดต่อและที่อยู่</h3>
              <div>
                <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์มือถือ *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">อีเมล (Email)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Line ID</label>
                <input
                  type="text"
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  placeholder="ไอดีไลน์สำหรับติดต่อ"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ที่อยู่ปัจจุบัน</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ระบุที่อยู่ปัจจุบันของคุณ..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-slate-800 border-b pb-2">🔒 เปลี่ยนรหัสผ่านใหม่ (ไม่บังคับ)</h3>
              <div>
                <label className="block font-bold text-slate-700 mb-1">รหัสผ่านเดิม</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านเดิมเพื่อยืนยันตัวตน"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">รหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้งเพื่อยืนยัน"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-1/2 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-2xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-1/2 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-orange-500/20 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "กำลังบันทึก..." : "💾 บันทึกข้อมูล"}
              </button>
            </div>
          </form>
        )}

      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t-2 border-slate-800 px-3 py-3 flex justify-around items-center z-50 shadow-2xl">
        <Link href="/employee/profile" className="flex flex-col items-center text-orange-400 text-xs font-black transition scale-105">
          <span className="text-2xl mb-1">👤</span>
          หน้าแรก
        </Link>
        <Link href="/employee/attendance" className="flex flex-col items-center text-slate-200 hover:text-orange-400 text-xs font-extrabold transition">
          <span className="text-2xl mb-1">⏱️</span>
          ลงเวลาทำงาน
        </Link>
        <Link href="/employee/reports" className="flex flex-col items-center text-slate-200 hover:text-orange-400 text-xs font-extrabold transition">
          <span className="text-2xl mb-1">🛡️</span>
          รายงาน
        </Link>
        <Link href="/employee/payrolls" className="flex flex-col items-center text-slate-200 hover:text-orange-400 text-xs font-extrabold transition">
          <span className="text-2xl mb-1">💵</span>
          เงินเดือน
        </Link>
      </nav>
    </div>
  );
}