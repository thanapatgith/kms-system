"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function EmployeeAttendancePage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    fetchAttendance();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          setErrorMsg("ไม่สามารถดึงตำแหน่ง GPS ได้ กรุณาเปิดใช้งาน Location ในเบราว์เซอร์");
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await fetch("/api/employee/attendance");
      const data = await res.json();
      if (data.ok) {
        setHistory(data.attendance || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const todayFormatted = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const hasCheckedInToday = history.some(item => item.date === todayFormatted && item.checkIn !== "-");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    if (filesArray.length < 1) {
      setErrorMsg("กรุณาแนบรูปภาพอย่างน้อย 1 รูป");
      return;
    }

    if (filesArray.length > 10) {
      setErrorMsg("สามารถแนบรูปภาพได้สูงสุดไม่เกิน 10 รูปเท่านั้น");
      return;
    }

    setErrorMsg("");
    setSelectedImages(filesArray);

    const urls = filesArray.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleAttendance = async (type: "CHECK_IN" | "CHECK_OUT") => {
    if (location.lat === null || location.lng === null) {
      setErrorMsg("กำลังรอพิกัด GPS หรือไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง กรุณาเปิด GPS และรีเฟรชหน้าเว็บ");
      return;
    }

    if (selectedImages.length < 1 || selectedImages.length > 10) {
      setErrorMsg("กรุณาแนบรูปภาพอย่างน้อย 1 รูป และสูงสุดไม่เกิน 10 รูป");
      return;
    }

    setLoading(true);
    setMessage("");
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("latitude", location.lat.toString());
      formData.append("longitude", location.lng.toString());
      
      selectedImages.forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch("/api/employee/attendance", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "ไม่สามารถบันทึกเวลาได้");
      }

      setMessage(type === "CHECK_IN" ? "เช็คอินเข้างานพร้อมแนบรูปภาพและพิกัดสำเร็จ!" : "เช็คเอาท์ออกงานสำเร็จ!");
      setSelectedImages([]);
      setPreviewUrls([]);
      fetchAttendance();
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-12">
      {/* Navbar */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-orange-500 font-bold text-xs rounded-lg uppercase tracking-wider">
              EMPLOYEE
            </span>
            <h1 className="text-lg font-bold">KMS Employee Portal</h1>
          </div>

          <nav className="flex items-center gap-2 flex-wrap justify-center text-sm font-semibold">
            <Link href="/employee/profile" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              หน้าแรก / โปรไฟล์
            </Link>
            <Link href="/employee/leaves" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              ระบบลา
            </Link>
            <Link href="/employee/attendance" className="px-3 py-2 bg-slate-800 text-orange-400 rounded-lg">
              ลงเวลาทำงาน
            </Link>
            <Link href="/employee/shifts" className="px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition">
              ตารางเวร
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-slate-200 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">ลงเวลาทำงาน (Time Attendance)</h2>
            <p className="text-sm text-slate-500 mt-1">บันทึกเวลาเข้าและออกงานประจำวันพร้อมพิกัด GPS และรูปถ่ายยืนยัน</p>
          </div>

          {/* พิกัด GPS */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-slate-600">
            <span>📍 พิกัดปัจจุบันของคุณ:</span>
            {location.lat !== null && location.lng !== null ? (
              <span className="font-mono font-bold text-emerald-600">
                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)} (พร้อมเช็คอิน)
              </span>
            ) : (
              <span className="font-bold text-amber-600 animate-pulse">
                กำลังค้นหาพิกัด GPS... (กรุณากดอนุญาตการเข้าถึงตำแหน่ง)
              </span>
            )}
          </div>

          {/* ส่วนแนบรูปภาพ */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase">
              แนบรูปถ่ายยืนยัน (ขั้นต่ำ 1 รูป, สูงสุด 10 รูป) *
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer border border-slate-200 rounded-xl p-2 bg-slate-50"
            />
            
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {message && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium text-center">
              {message}
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium text-center">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => handleAttendance("CHECK_IN")}
              disabled={loading || location.lat === null || selectedImages.length === 0 || hasCheckedInToday}
              className="py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              🟢 เช็คอินเข้างาน (Check-In) {hasCheckedInToday && "(เช็คอินแล้ววันนี้)"}
            </button>
            <button
              onClick={() => handleAttendance("CHECK_OUT")}
              disabled={loading || location.lat === null || selectedImages.length === 0}
              className="py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-base rounded-xl shadow-md shadow-orange-600/20 transition cursor-pointer disabled:opacity-50"
            >
              🔴 เช็คเอาท์ออกงาน (Check-Out)
            </button>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-base">ประวัติการลงเวลาทำงาน</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-600 tracking-wider">
                  <th className="p-4 md:px-6">วันที่</th>
                  <th className="p-4 md:px-6">เวลาเข้างาน</th>
                  <th className="p-4 md:px-6">พิกัดเข้า</th>
                  <th className="p-4 md:px-6">เวลาออกงาน</th>
                  <th className="p-4 md:px-6">พิกัดออก</th>
                  <th className="p-4 md:px-6 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      ยังไม่มีประวัติการลงเวลาในระบบ
                    </td>
                  </tr>
                ) : (
                  history.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 md:px-6 text-slate-800 font-semibold">{item.date}</td>
                      <td className="p-4 md:px-6 text-emerald-600 font-bold">{item.checkIn || "-"}</td>
                      <td className="p-4 md:px-6 text-xs font-mono text-slate-500">{item.locationIn || "-"}</td>
                      <td className="p-4 md:px-6 text-orange-600 font-bold">{item.checkOut || "-"}</td>
                      <td className="p-4 md:px-6 text-xs font-mono text-slate-500">{item.locationOut || "-"}</td>
                      <td className="p-4 md:px-6 text-center">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-xs">
                          {item.status || "ปกติ"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}