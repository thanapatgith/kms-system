"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function EmployeeAttendancePage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [showCameraModal, setShowCameraModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

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

    return () => {
      stopCamera();
    };
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await fetch("/api/employee/attendance", {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.ok) {
        setHistory(data.attendance || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const todayString = new Date().toISOString().split("T")[0];
  const todayRecords = history.filter(item => {
    if (!item.rawDate) return false;
    const itemDateStr = new Date(item.rawDate).toISOString().split("T")[0];
    return itemDateStr === todayString;
  });
  
  const activeRecord = todayRecords.find(item => item.checkIn && item.checkIn !== "-" && (!item.checkOut || item.checkOut === "-"));
  const isWorking = !!activeRecord;

  const startCamera = async () => {
    setErrorMsg("");
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 768 },
          height: { ideal: 1024 }
        },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setErrorMsg("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้องในเบราว์เซอร์");
      setShowCameraModal(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const targetWidth = 600;
    const targetHeight = 800;
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      const videoRatio = video.videoWidth / video.videoHeight;
      const targetRatio = targetWidth / targetHeight;
      let renderWidth = video.videoWidth;
      let renderHeight = video.videoHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (videoRatio > targetRatio) {
        renderWidth = video.videoHeight * targetRatio;
        offsetX = (video.videoWidth - renderWidth) / 2;
      } else {
        renderHeight = video.videoWidth / targetRatio;
        offsetY = (video.videoHeight - renderHeight) / 2;
      }

      ctx.drawImage(video, offsetX, offsetY, renderWidth, renderHeight, 0, 0, targetWidth, targetHeight);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `attendance_${Date.now()}.jpg`, { type: "image/jpeg" });
          setSelectedImage(file);
          setPreviewUrl(URL.createObjectURL(file));
          stopCamera();
          setShowCameraModal(false);
        }
      }, "image/jpeg", 0.85);
    }
  };

  const handleAttendance = async (type: "CHECK_IN" | "CHECK_OUT") => {
    if (location.lat === null || location.lng === null) {
      setErrorMsg("กำลังรอพิกัด GPS หรือไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง กรุณาเปิด GPS และรีเฟรชหน้าเว็บ");
      return;
    }

    if (!selectedImage) {
      setErrorMsg("กรุณาถ่ายรูปเจ้าหน้าที่ผู้มารับช่วงต่อเพื่อยืนยันการลงเวลา");
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
      formData.append("images", selectedImage);

      const res = await fetch("/api/employee/attendance", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "ไม่สามารถบันทึกเวลาได้");
      }

      setMessage(type === "CHECK_IN" ? "เช็คอินเข้างานสำเร็จ!" : "เช็คเอาท์ออกงานเรียบร้อยแล้ว");
      setSelectedImage(null);
      setPreviewUrl(null);
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

        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-4">
          
          {/* พิกัด GPS แบบตัวอักษร Lat/Long */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1 text-xs text-slate-600 shadow-inner">
            <span className="font-bold text-slate-500">📍 พิกัด GPS ยืนยันตำแหน่ง:</span>
            {location.lat !== null && location.lng !== null ? (
              <span className="font-mono font-bold text-emerald-600 text-sm">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </span>
            ) : (
              <span className="font-bold text-amber-600 animate-pulse text-xs">
                กำลังค้นหาพิกัด GPS...
              </span>
            )}
          </div>

          {/* ส่วนแนบรูปถ่าย พร้อมคำชี้แจง */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-700">
                ถ่ายรูปเจ้าหน้าที่ผู้มารับช่วงต่อ (1 รูป) *
              </label>
              {!selectedImage && (
                <span className="text-red-500 font-bold text-[10px] bg-red-50 px-2 py-0.5 rounded-md border border-red-200 animate-pulse">
                  ⚠️ ต้องถ่ายรูปก่อน
                </span>
              )}
            </div>

            {/* คำชี้แจง */}
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium leading-relaxed">
              💡 <strong>คำชี้แจง:</strong> กรุณาถ่ายรูปเจ้าหน้าที่หรือเพื่อนร่วมงานที่มารับช่วงต่อในกะถัดไป เพื่อยืนยันการส่งมอบงาน
            </div>

            {!previewUrl ? (
              <div
                onClick={startCamera}
                className="border-2 border-dashed border-slate-300 hover:border-orange-500 bg-slate-50 hover:bg-orange-50/40 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 shadow-inner"
              >
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-xl text-orange-600 shadow-sm">
                  📷
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    กดเพื่อเปิดกล้องถ่ายภาพผู้มารับช่วงต่อ
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    แตะเพื่อเริ่มใช้งานกล้อง (แนวตั้ง 3:4)
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative w-36 mx-auto aspect-[3/4] rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md bg-slate-900">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute top-1 right-1 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                    ✓ สำเร็จ
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200 cursor-pointer"
                >
                  🔄 ถ่ายใหม่อีกครั้ง
                </button>
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

      {/* Modal เปิดกล้องสด ล็อกสัดส่วน 3:4 แท้แน่นอน */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-4 pb-24">
          <div className="w-full flex justify-between items-center text-white py-1">
            <span className="text-xs font-bold">📷 จัดตำแหน่งผู้มารับช่วงต่อให้อยู่ในกรอบ (3:4)</span>
            <button
              onClick={() => {
                stopCamera();
                setShowCameraModal(false);
              }}
              className="text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>
          </div>

          {/* ช่องแสดงวิดีโอกล้องสด ล็อกสัดส่วน 3:4 เป๊ะๆ ด้วย aspect-[3/4] */}
          <div className="relative w-full max-w-[280px] aspect-[3/4] flex items-center justify-center overflow-hidden rounded-2xl bg-black my-auto shadow-2xl border border-slate-700">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            ></video>

            {/* กรอบสี่เหลี่ยมไกด์ไลน์ 3:4 */}
            <div className="absolute inset-4 border-2 border-white/80 rounded-xl pointer-events-none flex flex-col items-center justify-center bg-black/10">
              
              {/* เส้นโครงร่างคนครึ่งตัว (SVG Half-body Wireframe) */}
              <div className="relative w-24 h-36 mb-2 flex items-center justify-center">
                <svg className="w-full h-full text-emerald-400 opacity-90" viewBox="0 0 100 130" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4">
                  {/* ศีรษะ */}
                  <ellipse cx="50" cy="25" rx="18" ry="22" />
                  {/* หัวไหล่และลำตัวครึ่งบน */}
                  <path d="M 18 115 C 18 75, 32 60, 50 60 C 68 60, 82 75, 82 115" />
                </svg>
              </div>

              {/* แถบข้อความคำแนะนำด้านล่าง */}
              <div className="bg-emerald-800/85 text-emerald-100 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-400 shadow-lg">
                กรุณาจัดตำแหน่งให้อยู่ในกรอบ
              </div>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden"></canvas>

          {/* ปุ่มชัตเตอร์ถ่ายรูป (ขยับขึ้นมาด้านบนพ้นแถบเมนูด้านล่าง) */}
          <div className="w-full max-w-md pb-2 flex justify-center items-center">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-slate-300 shadow-2xl flex items-center justify-center active:scale-95 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-orange-600"></div>
            </button>
          </div>
        </div>
      )}

      {/* Sticky Footer สำหรับปุ่มกดด้านล่าง */}
      <div className="fixed bottom-14 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg z-40">
        <div className="max-w-md mx-auto space-y-2">
          
          {!selectedImage && (
            <div className="text-[11px] text-center text-red-600 font-bold bg-red-50 py-1.5 px-3 rounded-lg border border-red-200 flex items-center justify-center gap-1">
              <span>⚠️ กรุณาถ่ายรูปผู้มารับช่วงต่อด้านบนก่อนกดลงเวลา</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAttendance("CHECK_IN")}
              disabled={loading || location.lat === null || !selectedImage || isWorking}
              className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 disabled:bg-slate-400 flex flex-col items-center justify-center gap-0.5"
            >
              <span>🟢 เช็คอินเข้างาน</span>
              <span className="text-[9px] font-normal opacity-90">{isWorking ? "(กำลังทำงานอยู่)" : "(เริ่มกะใหม่)"}</span>
            </button>
            <button
              onClick={() => handleAttendance("CHECK_OUT")}
              disabled={loading || location.lat === null || !selectedImage || !isWorking}
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
        <Link href="/employee/profile" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">👤</span>
          หน้าแรก
        </Link>
        <Link href="/employee/attendance" className="flex flex-col items-center text-orange-400 text-[10px] font-semibold transition">
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