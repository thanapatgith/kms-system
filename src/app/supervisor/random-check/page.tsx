"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RandomCheckPage() {
  const router = useRouter();
  const [siteName, setSiteName] = useState("หน่วยงาน A (จุดประจำ)");
  const [details, setDetails] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // รายการข้อความด่วนสำหรับกดเลือก
  const quickTexts = [
    "✅ ตรวจรอบพื้นที่ เหตุการณ์ปกติ",
    "🤝 ส่งมอบหน้าที่เรียบร้อย",
    "📋 เข้าปฏิบัติหน้าที่เรียบร้อย",
    "🔍 ผู้ควบคุมงาน เข้าตรวจการปฏิบัติงาน",
  ];

  useEffect(() => {
    fetchLocation();
  }, []);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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
      {/* Header แท็บสีกรมท่า แบบเดียวกับหน้าลงเวลา */}
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

          {/* ปุ่มประวัติการตรวจตรา ด้านขวาบน */}
          <Link
            href="/supervisor/random-check/history"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl transition shadow-sm"
          >
            📋 ประวัติการตรวจตรา
          </Link>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* แจ้งเตือนเมื่อบันทึกสำเร็จ */}
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
          {/* 1. เลือกหน่วยงาน */}
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
              <option value="หน่วยงาน A (จุดประจำ)">หน่วยงาน A (จุดประจำ)</option>
              <option value="หน่วยงาน B (อาคารสำนักงานใหญ่)">หน่วยงาน B (อาคารสำนักงานใหญ่)</option>
              <option value="หน่วยงาน C (คลังสินค้า)">หน่วยงาน C (คลังสินค้า)</option>
              <option value="หน่วยงาน D (ป้อมประตูหน้า)">หน่วยงาน D (ป้อมประตูหน้า)</option>
            </select>
          </div>

          {/* 2. รูปภาพประกอบการตรวจตรา */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <span>📷</span>
              <span>รูปภาพประกอบการตรวจตรา <span className="text-rose-500">*</span></span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
                  <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/80 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <label className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-amber-400 hover:text-amber-500 cursor-pointer transition bg-slate-50/50 p-4 text-center">
                <span className="text-3xl mb-1">📷</span>
                <span className="text-xs font-bold text-slate-600">กดเพื่อถ่ายรูป / เลือกรูปภาพ</span>
                <span className="text-[10px] text-slate-400 mt-0.5">ถ่ายภาพพื้นที่ตรวจ หรือถ่ายภาพตนเอง</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
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

          {/* 5. แสดงพิกัด GPS */}
          <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-medium">
            <div className="flex items-center space-x-1">
              <span>📍 พิกัด GPS ยืนยันตำแหน่ง:</span>
            </div>
            {gettingLocation ? (
              <span className="text-amber-600 animate-pulse">กำลังดึงพิกัด...</span>
            ) : location ? (
              <span className="bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded font-mono text-[11px]">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </span>
            ) : (
              <button
                type="button"
                onClick={fetchLocation}
                className="text-amber-600 underline text-[11px]"
              >
                {locationError || "รีเฟรชพิกัด"}
              </button>
            )}
          </div>

          {/* 6. ปุ่มบันทึกส่งรายงาน */}
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
    </div>
  );
}