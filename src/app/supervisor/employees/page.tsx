"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SupervisorEmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState("");
  
  // Form State
  const [name, setName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [phone, setPhone] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [siteId, setSiteId] = useState("");

  // Confirm Modals State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Custom Toast Notification State
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string; type: "success" | "error" }>({
    show: false,
    title: "",
    message: "",
    type: "success",
  });

  const showToast = (title: string, message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, title, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/supervisor/employees");
      const data = await res.json();
      if (data.ok) {
        setEmployees(data.employees || []);
        setSites(data.sites || []);
      } else {
        setErrorMsg(data.error || "ไม่สามารถดึงข้อมูลได้");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  const generateNextEmployeeCode = (empList: any[]) => {
    let maxNumber = 0;
    empList.forEach((emp) => {
      const code = (emp.employeeCode || "").trim().toLowerCase();
      if (code.startsWith("kms") && code !== "kms999") {
        const numPart = parseInt(code.replace("kms", ""), 10);
        if (!isNaN(numPart) && numPart > maxNumber) {
          maxNumber = numPart;
        }
      }
    });
    const nextNum = maxNumber + 1;
    return `kms${String(nextNum).padStart(3, "0")}`;
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId("");
    setName("");
    setEmployeeCode(generateNextEmployeeCode(employees));
    setPhone("");
    setDailyRate("");
    setSiteId("");
    setShowModal(true);
  };

  const openEditModal = (emp: any) => {
    setIsEditing(true);
    setCurrentId(emp.id);
    setName(emp.name || "");
    setEmployeeCode(emp.employeeCode || "");
    setPhone(emp.phone || "");
    setDailyRate(emp.dailyRate ? emp.dailyRate.toString() : "");
    setSiteId(emp.siteId || "");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/supervisor/employees";
      const method = isEditing ? "PUT" : "POST";
      const body = isEditing 
        ? { id: currentId, name, phone, dailyRate, siteId }
        : { name, employeeCode, phone, dailyRate, siteId };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.ok) {
        setShowModal(false);
        showToast(
          isEditing ? "อัปเดตข้อมูลสำเร็จ" : "เพิ่มพนักงานใหม่สำเร็จ",
          isEditing ? "บันทึกการเปลี่ยนแปลงข้อมูลพนักงานเรียบร้อยแล้ว" : `เพิ่มรหัสพนักงาน ${employeeCode} เข้าสู่ระบบแล้ว (รหัสผ่านเริ่มต้น: password123)`,
          "success"
        );
        fetchData();
      } else {
        showToast("เกิดข้อผิดพลาด", data.error || "ไม่สามารถบันทึกข้อมูลได้", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    }
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`/api/supervisor/employees?id=${currentId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.ok) {
        setShowDeleteConfirm(false);
        setShowModal(false);
        showToast("ลบพนักงานสำเร็จ", `ลบข้อมูลพนักงาน ${name} ออกจากระบบแล้ว`, "success");
        fetchData();
      } else {
        setShowDeleteConfirm(false);
        showToast("เกิดข้อผิดพลาด", data.error || "ไม่สามารถลบพนักงานได้", "error");
      }
    } catch (err) {
      console.error(err);
      setShowDeleteConfirm(false);
      showToast("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    }
  };

  const confirmResetPassword = async () => {
    try {
      const res = await fetch(`/api/supervisor/employees`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentId }),
      });
      const data = await res.json();

      if (data.ok) {
        setShowResetConfirm(false);
        showToast("รีเซ็ตรหัสผ่านสำเร็จ", `รีเซ็ตรหัสผ่านของพนักงาน ${name} เป็น password123 เรียบร้อยแล้ว`, "success");
      } else {
        setShowResetConfirm(false);
        showToast("เกิดข้อผิดพลาด", data.error || "ไม่สามารถรีเซ็ตรหัสผ่านได้", "error");
      }
    } catch (err) {
      console.error(err);
      setShowResetConfirm(false);
      showToast("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (emp.name || "").toLowerCase().includes(q);
    const codeMatch = (emp.employeeCode || "").toLowerCase().includes(q);
    const siteMatch = (emp.site?.siteName || "").toLowerCase().includes(q);
    return nameMatch || codeMatch || siteMatch;
  });

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24 relative">
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded uppercase tracking-wider">SUPERVISOR</span>
            <h1 className="text-sm font-bold">จัดการบุคลากร</h1>
          </div>
          <button onClick={fetchData} className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer">🔄 รีเฟรช</button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-4 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900">รายชื่อ รปภ. ในสังกัด</h2>
              <p className="text-[11px] text-slate-500">จัดการข้อมูลและมอบหมายหน่วยงานประจำ</p>
            </div>
            <button
              onClick={openAddModal}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>+</span> เพิ่มพนักงาน
            </button>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาด้วยชื่อ, รหัสพนักงาน หรือชื่อไซต์..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium text-center">{errorMsg}</div>
        )}

        {loading ? (
          <div className="text-center text-slate-400 py-10 text-xs animate-pulse">กำลังโหลดข้อมูลพนักงาน...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center text-slate-400 py-12 text-xs bg-white rounded-2xl border border-slate-200 space-y-1">
            <span className="text-2xl block">📭</span>
            <span>ไม่พบรายชื่อพนักงานตามเงื่อนไขที่ค้นหา</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredEmployees.map((emp) => (
              <div key={emp.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs transition hover:border-slate-300">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>👤</span> {emp.name || "ไม่มีชื่อ"}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      รหัสพนักงาน: <strong className="text-slate-600">{emp.employeeCode || "-"}</strong>
                    </span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] shrink-0 border ${
                    emp.site?.siteName 
                      ? "bg-amber-50 text-amber-800 border-amber-200/80" 
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}>
                    🏢 {emp.site?.siteName || "ยังไม่ระบุหน่วยงาน"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <span>📞</span> 
                    <span className="font-medium text-slate-800">{emp.phone || "ไม่ระบุเบอร์"}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <span>💰</span> 
                    <span className="font-bold text-emerald-700 font-mono">
                      {emp.dailyRate ? `฿${emp.dailyRate}/วัน` : "-"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => openEditModal(emp)}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-700 font-bold rounded-xl text-[11px] border border-slate-200 transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <span>✏️</span> แก้ไขข้อมูล & เปลี่ยนหน่วยงานประจำ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal เพิ่ม / แก้ไขพนักงาน */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 text-xs my-auto animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">
                {isEditing ? "✏️ แก้ไขข้อมูลพนักงาน" : "➕ เพิ่มพนักงานใหม่"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">ชื่อ-นามสกุล:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 flex justify-between items-center">
                  <span>รหัสพนักงาน (Employee Code):</span>
                  {!isEditing && <span className="text-[9px] text-amber-600 font-normal">✨ Gen อัตโนมัติจากระบบ</span>}
                </label>
                <input
                  type="text"
                  required
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="เช่น kms057"
                  disabled={isEditing}
                  className={`w-full p-2.5 border rounded-xl text-xs text-slate-800 outline-none font-mono ${
                    isEditing ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">เบอร์โทรศัพท์ (ไม่บังคับ):</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812345678"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">อัตราค่าจ้างต่อวัน (บาท):</label>
                <input
                  type="number"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  placeholder="เช่น 520"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">มอบหมายหน่วยงานประจำ (Site):</label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">-- ไม่ระบุหน่วยงาน --</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.siteName || site.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ปุ่มจัดการด้านล่าง */}
              {isEditing && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl text-xs transition cursor-pointer border border-amber-200 flex items-center justify-center gap-1"
                  >
                    <span>🔑</span> รีเซ็ตรหัสผ่านเป็นค่าเริ่มต้น (password123)
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                {isEditing ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition cursor-pointer border border-red-200 flex items-center gap-1"
                  >
                    <span>🗑️</span> ลบ
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-center animate-fadeIn">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl shadow-inner">
              ⚠️
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">ยืนยันการลบพนักงาน</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                คุณแน่ใจหรือไม่ที่จะลบพนักงานรหัส <span className="font-mono font-bold text-slate-800">{employeeCode}</span> (<span className="text-slate-800 font-bold">{name}</span>) ออกจากระบบ?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="w-1/2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Reset Password Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-center animate-fadeIn">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto text-xl shadow-inner">
              🔑
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">ยืนยันการรีเซ็ตรหัสผ่าน</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                ต้องการรีเซ็ตรหัสผ่านของพนักงาน <span className="text-slate-800 font-bold">{name}</span> (<span className="font-mono font-bold">{employeeCode}</span>) ให้กลับเป็น <strong className="text-amber-700">password123</strong> หรือไม่?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmResetPassword}
                className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                ยืนยันรีเซ็ต
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Toast Notification Popup */}
      {toast.show && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm">
          <div className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md ${
            toast.type === "success" 
              ? "bg-slate-900/95 text-white border-amber-500/50 shadow-amber-500/10" 
              : "bg-red-900/95 text-white border-red-500/50 shadow-red-500/10"
          }`}>
            <span className="text-xl shrink-0">
              {toast.type === "success" ? "✨" : "⚠️"}
            </span>
            <div className="flex-1 text-xs space-y-0.5">
              <h4 className="font-bold text-sm tracking-wide">{toast.title}</h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToast((prev) => ({ ...prev, show: false }))}
              className="text-slate-400 hover:text-white font-bold text-xs cursor-pointer px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-40 shadow-lg max-w-md mx-auto">
        <Link href="/supervisor/dashboard" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📊</span>แดชบอร์ด
        </Link>
        <Link href="/supervisor/leaves" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-bold transition">
          <span className="text-base mb-0.5">📝</span>อนุมัติลา
        </Link>
        <Link href="/supervisor/attendance" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">⏱️</span>ลงเวลาทำงาน
        </Link>
        <Link href="/supervisor/shifts" className="flex flex-col items-center text-slate-400 hover:text-amber-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📅</span>ตารางเวร
        </Link>
      </nav>
    </div>
  );
}