"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function EmployeeIncidentPage() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("ตรวจบริเวณเขตพื้นที่รับผิดชอบ เหตุการณ์ปกติครับ");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    fetchReports();
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
          setErrorMsg("ไม่สามารถดึงตำแหน่ง GPS ได้ กรุณาเปิดใช้งาน Location");
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/employee/reports");
      const data = await res.json();
      if (data.ok) {
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    if (filesArray.length < 1) {
      setErrorMsg("กรุณาแนบรูปภาพอย่างน้อย 1 รูป");
      return;
    }

    if (filesArray.length > 10) {
      setErrorMsg("สามารถแนบรูปภาพได้สูงสุดไม่เกิน 10 รูป");
      return;
    }

    setErrorMsg("");
    setSelectedImages(filesArray);
    const urls = filesArray.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      setErrorMsg("กรุณากรอกข้อความรายงาน");
      return;
    }
    if (selectedImages.length === 0) {
      setErrorMsg("กรุณาแนบรูปภาพอย่างน้อย 1 รูป");
      return;
    }

    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("message", messageText);
      if (location.lat !== null && location.lng !== null) {
        formData.append("latitude", location.lat.toString());
        formData.append("longitude", location.lng.toString());
      }
      selectedImages.forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch("/api/employee/reports", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "ไม่สามารถส่งรายงานได้");
      }

      setSuccessMsg("ส่งรายงานการทำงานสำเร็จเรียบร้อย!");
      setSelectedImages([]);
      setPreviewUrls([]);
      setMessageText("ตรวจบริเวณเขตพื้นที่รับผิดชอบ เหตุการณ์ปกติครับ");
      fetchReports();
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

          {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg">
        <Link href="/employee/profile" className="flex flex-col items-center text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">👤</span>
          หน้าแรก
        </Link>
        <Link href="/employee/attendance" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">⏱️</span>
          ลงเวลาทำงาน
        </Link>
        <Link href="/employee/reports" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">🛡️</span>
          รายงาน
        </Link>
        <Link href="/employee/payrolls" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">💵</span>
          เงินเดือน
        </Link>
      </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
        
        {/* Form Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">รายงานการปฏิบัติงาน / ตรวจรอบพื้นที่</h2>
          <p className="text-sm text-slate-500 mb-6">ส่งรายงานสถานการณ์ประจำจุดตรวจทุกๆ 2 ชั่วโมง พร้อมแนบรูปถ่ายและพิกัด</p>

          <form onSubmit={handleSubmitReport} className="space-y-4">
            
            {/* GPS Location */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex justify-between items-center">
              <span>📍 พิกัดปัจจุบันของคุณ:</span>
              {location.lat !== null && location.lng !== null ? (
                <span className="font-mono font-bold text-emerald-600">
                  Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                </span>
              ) : (
                <span className="font-bold text-amber-600 animate-pulse">กำลังค้นหาพิกัด GPS...</span>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase">
                แนบรูปถ่ายหน้างาน (1 - 10 รูป) *
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
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
                      <img src={url} alt={`preview ${idx}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message Textarea */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase">
                ข้อความรายงานสถานการณ์ *
              </label>
              <textarea
                rows={3}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="ระบุรายละเอียดเหตุการณ์ หรือสภาพแวดล้อมรอบพื้นที่..."
              />
            </div>

            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium text-center">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium text-center">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || location.lat === null || selectedImages.length === 0}
              className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-base rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {loading ? "กำลังส่งรายงาน..." : "📤 ส่งรายงานการปฏิบัติงาน"}
            </button>
          </form>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-base">ประวัติการส่งรายงานวันนี้</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-600 tracking-wider">
                  <th className="p-4 md:px-6">วันที่ / เวลา</th>
                  <th className="p-4 md:px-6">ข้อความรายงาน</th>
                  <th className="p-4 md:px-6">พิกัด GPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500">
                      ยังไม่มีประวัติการส่งรายงานในระบบ
                    </td>
                  </tr>
                ) : (
                  reports.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition">
                      <td className="p-4 md:px-6 text-slate-800 font-semibold whitespace-nowrap">
                        {item.date} <span className="text-orange-600 font-bold ml-1">{item.time}</span>
                      </td>
                      <td className="p-4 md:px-6 text-slate-700">{item.message}</td>
                      <td className="p-4 md:px-6 text-xs font-mono text-slate-500 whitespace-nowrap">{item.location}</td>
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