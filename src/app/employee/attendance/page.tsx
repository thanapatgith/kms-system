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
          setLocation({ lat: 13.8305, lng: 100.6179 });
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await fetch("/api/employee/attendance", {
        cache: "no-store", // บังคับไม่ให้แคชข้อมูล ดึงใหม่สดๆ ทุกครั้ง
      });
      const data = await res.json();
      if (data.ok) {
        setHistory(data.attendance || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ใช้เทียบวันที่แบบสากล (YYYY-MM-DD) เพื่อตัดปัญหาเรื่อง Timezone และภาษาบน Vercel
  const todayString = new Date().toISOString().split("T")[0];
  
  const todayRecords = history.filter(item => {
    if (!item.rawDate) return false;
    const itemDateStr = new Date(item.rawDate).toISOString().split("T")[0];
    return itemDateStr === todayString;
  });
  
  // เช็คว่าปัจจุบันมีกะไหนที่ "ยังไม่ได้เช็คเอาท์" (กำลังทำงานอยู่) หรือไม่
  const activeRecord = todayRecords.find(item => item.checkIn && item.checkIn !== "-" && (!item.checkOut || item.checkOut === "-"));
  const isWorking = !!activeRecord; // ถ้าเป็น true แปลว่ากำลังทำงานอยู่ (ต้องเช็คเอาท์ก่อน)

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

      setMessage(type === "CHECK_IN" ? "เช็คอินเข้างานกะใหม่สำเร็จ!" : "เช็คเอาท์ออกงานเรียบร้อยแล้ว");
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
    <div className="w-full min-h-screen bg-slate-100 pb-56">
      {/* Header ด้านบน */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-orange-500 font-bold text-[10px] rounded uppercase tracking-wider">
              EMPLOYEE
            </span>
            <h1 className="text-sm font-bold">ลงเวลาทำงาน</h1>
          </div>

          <Link
            href="/employee/attendance/history"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl transition shadow-sm"
          >
            📋 ประวัติการลงเวลา
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-4">
        
        {/* ข้อความสถานะวันนี้ */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-center shadow-sm">
          <span className="text-blue-900 font-bold text-xs">
            {isWorking ? "🟢 กำลังปฏิบัติงานอยู่ในกะนี้" : "📌 พร้อมลงเวลา (สามารถทำต่อกะถัดไปได้)"} (ทำไปแล้ว {todayRecords.length} รอบวันนี้)
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-3">
          
          {/* พิกัด GPS */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">📍 พิกัดปัจจุบันของคุณ:</span>
            {location.lat !== null && location.lng !== null ? (
              <span className="font-mono font-bold text-emerald-600">
                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)} (พร้อมใช้งาน)
              </span>
            ) : (
              <span className="font-bold text-amber-600 animate-pulse">
                กำลังค้นหาพิกัด GPS...
              </span>
            )}
          </div>

          {/* แสดง Google Map (ฟรี 100%) */}
          {location.lat !== null && location.lng !== null && (
            <div className="w-full h-36 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
              ></iframe>
            </div>
          )}

          {/* ส่วนแนบรูปภาพ */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex justify-between items-center">
              <span>แนบรูปถ่ายยืนยัน (1 - 10 รูป) *</span>
              {selectedImages.length === 0 && (
                <span className="text-red-500 font-bold text-[10px] bg-red-50 px-2 py-0.5 rounded-md border border-red-200 animate-pulse">
                  ⚠️ ต้องแนบรูปก่อน
                </span>
              )}
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer border border-slate-200 rounded-xl p-1 bg-slate-50"
            />
            
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium text-center">
              {message}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium text-center">
              {errorMsg}
            </div>
          )}
        </div>
      </main>

      {/* Sticky Footer สำหรับปุ่มกดด้านล่าง */}
      <div className="fixed bottom-14 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg z-40">
        <div className="max-w-md mx-auto space-y-2">
          
          {selectedImages.length === 0 && (
            <div className="text-[11px] text-center text-red-600 font-bold bg-red-50 py-1.5 px-3 rounded-lg border border-red-200 flex items-center justify-center gap-1">
              <span>⚠️ กรุณาแนบรูปถ่ายยืนยันด้านบนก่อนกดลงเวลา</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAttendance("CHECK_IN")}
              disabled={loading || location.lat === null || selectedImages.length === 0 || isWorking}
              className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 disabled:bg-slate-400 flex flex-col items-center justify-center gap-0.5"
            >
              <span>🟢 เช็คอินเข้างาน</span>
              <span className="text-[9px] font-normal opacity-90">{isWorking ? "(กำลังทำงานอยู่)" : "(เริ่มกะใหม่)"}</span>
            </button>
            <button
              onClick={() => handleAttendance("CHECK_OUT")}
              disabled={loading || location.lat === null || selectedImages.length === 0 || !isWorking}
              className="py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 disabled:bg-slate-400 flex flex-col items-center justify-center gap-0.5"
            >
              <span>🔴 เช็คเอาท์ออกงาน</span>
              <span className="text-[9px] font-normal opacity-90">{!isWorking ? "(ยังไม่ได้เช็คอิน)" : "(จบกะนี้)"}</span>
            </button>
          </div>
        </div>
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
  );
}