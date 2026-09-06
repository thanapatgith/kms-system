"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SiteItem {
  id: string;
  site_name: string;
}

export default function RandomCheckPage() {
  const router = useRouter();
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [siteName, setSiteName] = useState("");
  const [details, setDetails] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Camera Modal States (ปรับให้เหมือน Employee Attendance)
  const [showCameraModal, setShowCameraModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // รายการข้อความด่วนสำหรับกดเลือก
  const quickTexts = [
    "✅ ตรวจรอบพื้นที่ เหตุการณ์ปกติ",
    "🤝 ส่งมอบหน้าที่เรียบร้อย",
    "📋 เข้าปฏิบัติหน้าที่เรียบร้อย",
    "🔍 ผู้ควบคุมงาน เข้าตรวจการปฏิบัติงาน",
  ];

  useEffect(() => {
    fetchLocation();
    fetchSites();
    return () => {
      stopCamera();
    };
  }, []);

  const fetchSites = async () => {
    try {
      const res = await fetch("/api/sites");
      const data = await res.json();
      if (data.ok && data.sites && data.sites.length > 0) {
        setSites(data.sites);
        setSiteName(data.sites[0].site_name);
      } else {
        const fallback = [
          { id: "1", site_name: "สำนักงานใหญ่" },
          { id: "2", site_name: "หน่วยงาน A (จุดประจำ)" },
          { id: "3", site_name: "หน่วยงาน B (อาคารสำนักงานใหญ่)" }
        ];
        setSites(fallback);
        setSiteName(fallback[0].site_name);
      }
    } catch (err) {
      console.error("Error fetching sites:", err);
      const fallback = [
        { id: "1", site_name: "สำนักงานใหญ่" },
        { id: "2", site_name: "หน่วยงาน A (จุดประจำ)" },
        { id: "3", site_name: "หน่วยงาน B (อาคารสำนักงานใหญ่)" }
      ];
      setSites(fallback);
      setSiteName(fallback[0].site_name);
    }
  };

  const fetchLocation = () => {
    setGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("อุปกรณ์ของคุณไม่รองรับ GPS");
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGettingLocation(false);
      },
      (err) => {
        console.error("GPS Error:", err);
        setLocationError("ไม่สามารถดึงพิกัดได้");
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // เปิดกล้องแบบ Employee Attendance
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

  // ปิดกล้อง
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  // ถ่ายรูปและครอบตัดสัดส่วน 3:4 แบบเป๊ะๆ
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

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setImages([dataUrl]); // เก็บรูปภาพ 1 รูป
      stopCamera();
      setShowCameraModal(false);
    }
  };

  const removeImage = () => {
    setImages([]);
  };

  const handleQuickText = (text: string) => {
    setDetails((prev) => {
      if (!prev) return text;
      return `${prev} ${text}`;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (images.length === 0) {
      setErrorMsg("กรุณาถ่ายรูปหรือเลือกรูปภาพอย่างน้อย 1 รูป");
      return;
    }

    if (!details.trim()) {
      setErrorMsg("กรุณากรอกรายละเอียดข้อความรายงาน");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/supervisor/random-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: siteName,
          details: details.trim(),
          latitude: location?.lat || 0,
          longitude: location?.lng || 0,
          images: images,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }

      setSuccess(true);
      setDetails("");
      setImages([]);
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-12 font-sans">
      {/* Header แท็บสีกรมท่า */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="text-slate-300 hover:text-white transition text-xs font-bold mr-1"
            >
              &lt; กลับ
            </button>
            <span className="px-2 py-0.5 bg-amber-500 font-bold text-[10px] rounded text-slate-950 uppercase tracking-wider">
              SUPERVISOR
            </span>
            <h1 className="text-sm font-bold">สุ่มตรวจตรา</h1>
          </div>

          <Link
            href="/supervisor/random-check/history"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl transition shadow-sm"
          >
            📋 ประวัติการตรวจตรา
          </Link>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* แจ้งเตือนสำเร็จ */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-800 text-sm shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-lg">✅</span>
              <div>
                <p className="font-semibold">บันทึกรายงานสุ่มตรวจสำเร็จ!</p>
                <p className="text-xs text-emerald-600">ข้อมูลถูกส่งเข้าสู่ระบบเรียบร้อยแล้ว</p>
              </div>
            </div>
            <button onClick={() => setSuccess(false)} className="text-emerald-600 font-bold">✕</button>
          </div>
        )}

        {/* แจ้งเตือน Error */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-rose-800 text-sm shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-lg">⚠️</span>
              <p className="text-xs font-medium">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-600 font-bold">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. เลือกหน่วยงานจริงจากฐานข้อมูล */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <span>📍</span>
                <span>เลือกหน่วยงานที่ปฏิบัติงาน <span className="text-rose-500">*</span></span>
              </label>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                จุดตรวจลงเวลา
              </span>
            </div>
            <select
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              {sites.length > 0 ? (
                sites.map((s) => (
                  <option key={s.id} value={s.site_name}>
                    {s.site_name}
                  </option>
                ))
              ) : (
                <option value="">กำลังโหลดรายชื่อหน่วยงาน...</option>
              )}
            </select>
          </div>

          {/* พิกัด GPS */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-1.5">
            <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <span>📍</span> พิกัด GPS ยืนยันตำแหน่ง:
            </p>
            {gettingLocation ? (
              <p className="text-xs font-mono font-semibold text-amber-600 animate-pulse">กำลังค้นหาพิกัด GPS...</p>
            ) : location ? (
              <p className="text-sm font-mono font-bold text-emerald-600">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
            ) : (
              <button
                type="button"
                onClick={fetchLocation}
                className="text-xs font-mono font-bold text-rose-500 underline"
              >
                {locationError || "ไม่สามารถดึงพิกัดได้ (คลิกเพื่อลองใหม่)"}
              </button>
            )}
          </div>

          {/* 2. ส่วนถ่ายรูป (ปรับให้เหมือน Employee Attendance พร้อมปุ่มถ่ายใหม่) */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <span>ถ่ายรูปเจ้าหน้าที่ผู้มารับช่วงต่อ (1 รูป) *</span>
              </label>
              {images.length === 0 && (
                <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 animate-pulse">
                  ⚠️ ต้องถ่ายรูปก่อน
                </span>
              )}
            </div>

            <div className="bg-[#fffdf0] border border-[#fcefc7] rounded-xl p-3 text-[11px] text-amber-900 leading-relaxed flex gap-2">
              <span className="text-sm">💡</span>
              <div>
                <strong className="font-bold">คำชี้แจง:</strong> กรุณาถ่ายรูปเจ้าหน้าที่หรือเพื่อนร่วมงานที่ประจำการอยู่ที่หน่วย เพื่อยืนยันการรายงาน
              </div>
            </div>

            {images.length === 0 ? (
              <div
                onClick={startCamera}
                className="w-full border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-amber-400 hover:text-amber-500 cursor-pointer transition bg-slate-50/50 p-6 text-center space-y-3 shadow-inner"
              >
                <div className="w-16 h-16 bg-[#ffeed9] rounded-full flex items-center justify-center shadow-xs">
                  <span className="text-2xl">📷</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">กดเพื่อเปิดกล้องถ่ายภาพผู้ปฎิบัติหน้าที่ประจำหน่วยงาน</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">แตะเพื่อเริ่มใช้งานกล้อง</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative w-36 mx-auto aspect-[3/4] rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md bg-slate-900">
                  <img src={images[0]} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute top-1 right-1 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                    ✓ สำเร็จ
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200 cursor-pointer flex items-center justify-center gap-1"
                >
                  🔄 ถ่ายใหม่อีกครั้ง
                </button>
              </div>
            )}
          </div>

          {/* 3. ข้อความด่วน (Quick Text) */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-2.5">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <span>⚡</span>
              <span>ข้อความด่วน (กดเลือกได้เลย)</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {quickTexts.map((text, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickText(text)}
                  className="p-2.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-xs font-medium text-slate-700 text-left transition flex items-center space-x-1.5 leading-snug"
                >
                  <span>{text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. รายละเอียดข้อความรายงาน */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <span>📣</span>
              <span>รายละเอียดข้อความรายงาน <span className="text-rose-500">*</span></span>
            </label>

            <textarea
              rows={3}
              placeholder="พิมพ์ข้อความรายงานที่นี่..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none font-medium"
            />
          </div>

          {/* 5. ปุ่มบันทึกส่งรายงาน */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold rounded-xl shadow-md text-sm transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <span>⏳ กำลังส่งรายงาน...</span>
            ) : (
              <span>บันทึกการสุ่มตรวจ (Check-in)</span>
            )}
          </button>
        </form>
      </div>

      {/* Modal เปิดกล้องสด ล็อกสัดส่วน 3:4 และมีโครงร่างไกด์ไลน์ */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-4 pb-12">
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

          <div className="relative w-full max-w-[280px] aspect-[3/4] flex items-center justify-center overflow-hidden rounded-2xl bg-black my-auto shadow-2xl border border-slate-700">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            ></video>

            <div className="absolute inset-4 border-2 border-white/80 rounded-xl pointer-events-none flex flex-col items-center justify-center bg-black/10">
              <div className="relative w-24 h-36 mb-2 flex items-center justify-center">
                <svg className="w-full h-full text-emerald-400 opacity-90" viewBox="0 0 100 130" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4">
                  <ellipse cx="50" cy="25" rx="18" ry="22" />
                  <path d="M 18 115 C 18 75, 32 60, 50 60 C 68 60, 82 75, 82 115" />
                </svg>
              </div>
              <div className="bg-emerald-800/85 text-emerald-100 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-400 shadow-lg">
                กรุณาจัดตำแหน่งให้อยู่ในกรอบ
              </div>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden"></canvas>

          <div className="w-full max-w-md pb-4 flex justify-center items-center">
            <button
              type="button"
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-slate-300 shadow-2xl flex items-center justify-center active:scale-95 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-orange-600"></div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}