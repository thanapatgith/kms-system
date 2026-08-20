"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateReportPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // State สำหรับหน่วยงาน
  const [selectedBranch, setSelectedBranch] = useState("");
  const [branchesList, setBranchesList] = useState<string[]>([]);

  useEffect(() => {
    fetchUserProfile();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("Geolocation error:", err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("/api/employee/profile");
      const data = await res.json();
      if (data.ok && data.user?.branch) {
        const userBranch = data.user.branch;
        setSelectedBranch(userBranch);
        setBranchesList([userBranch]);
      } else {
        setBranchesList(["หน่วยงานทั่วไป"]);
        setSelectedBranch("หน่วยงานทั่วไป");
      }
    } catch (err) {
      console.error(err);
      setBranchesList(["หน่วยงานทั่วไป"]);
      setSelectedBranch("หน่วยงานทั่วไป");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const newImages = [...images, ...selectedFiles];
      setImages(newImages);

      const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
      setPreviews([...previews, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setImages(updatedImages);
    setPreviews(updatedPreviews);
  };

  const applyQuickText = (text: string) => {
    setMessage(message ? message + " " + text : text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!message.trim()) {
      setErrorMsg("กรุณาระบุข้อความรายงาน");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("message", message);
      formData.append("branch", selectedBranch);

      if (location) {
        formData.append("latitude", location.lat.toString());
        formData.append("longitude", location.lng.toString());
      }
      images.forEach((img) => formData.append("images", img));

      const res = await fetch("/api/employee/reports", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || (!data.ok && !data.success)) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการส่งรายงาน");
      }

      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการส่งข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/employee/reports" className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1">
            ‹ กลับ
          </Link>
          <h1 className="text-sm font-bold">สร้างรายงานการตรวจตรา</h1>
          <div className="w-8"></div>
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-4">
        
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ส่วนระบุหน่วยงาน/สถานที่ปฏิบัติงาน */}
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800 flex justify-between items-center">
              <span>📍 เลือกหน่วยงานที่ปฏิบัติงาน *</span>
              <span className="text-[10px] text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                จุดตรวจตรา
              </span>
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
            >
              {branchesList.map((branch, idx) => (
                <option key={idx} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          {/* 1. รูปภาพประกอบ */}
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-800">
              📸 รูปภาพประกอบการตรวจตรา *
            </label>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
                    <img src={src} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold shadow cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-orange-300 hover:border-orange-500 rounded-2xl bg-orange-50/50 cursor-pointer transition">
              <span className="text-2xl mb-1">📷</span>
              <span className="text-xs font-bold text-orange-600">กดเพื่อถ่ายรูป / เลือกรูปภาพ</span>
              <span className="text-[10px] text-slate-400 mt-0.5">ถ่ายภาพพื้นที่ตรวจ หรือถ่ายภาพตนเอง</span>
              <input
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          {/* 2. ข้อความด่วน */}
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-2.5">
            <label className="block text-xs font-bold text-slate-800">
              ⚡ ข้อความด่วน (กดเลือกได้เลย)
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyQuickText("ตรวจบริเวณรอบพื้นที่รับผิดชอบ เหตุการณ์ปกติครับ")}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-700 text-[11px] font-medium rounded-xl border border-slate-200 transition text-left cursor-pointer"
              >
                ✅ ตรวจรอบพื้นที่ เหตุการณ์ปกติ
              </button>
              <button
                type="button"
                onClick={() => applyQuickText("ส่งมอบหน้าที่เรียบร้อย เหตุการณ์ปกติครับ")}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-700 text-[11px] font-medium rounded-xl border border-slate-200 transition text-left cursor-pointer"
              >
                🤝 ส่งมอบหน้าที่เรียบร้อย
              </button>
              <button
                type="button"
                onClick={() => applyQuickText("เข้าปฏิบัติหน้าที่เรียบร้อยครับ")}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-700 text-[11px] font-medium rounded-xl border border-slate-200 transition text-left cursor-pointer"
              >
                🫡 เข้าปฏิบัติหน้าที่เรียบร้อย
              </button>
              <button
                type="button"
                onClick={() => applyQuickText("สายตรวจ เข้าตรวจการปฏิบัติงาน เหตุการณ์ปกติ")}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-700 text-[11px] font-medium rounded-xl border border-slate-200 transition text-left cursor-pointer"
              >
                🚔 สายตรวจ เข้าตรวจการปฏิบัติงาน
              </button>
            </div>
          </div>

          {/* 3. ช่องกรอกรายละเอียดข้อความ */}
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              ✍️ รายละเอียดข้อความรายงาน *
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="พิมพ์ข้อความรายงานที่นี่..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none resize-none"
            />
          </div>

          {/* แสดงพิกัด GPS */}
          <div className="px-2 flex items-center justify-between text-[10px] text-slate-500">
            <span>📍 พิกัด GPS ยืนยันตำแหน่ง:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
              {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "กำลังค้นหาพิกัด..."}
            </span>
          </div>

          {/* ปุ่มบันทึกรายงาน */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/20 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? "กำลังส่งรายงาน..." : "🚀 ส่งรายงานการตรวจตรา"}
          </button>

        </form>
      </main>

      {/* Modal สรุปผลส่งรายงานสำเร็จ */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
              ✓
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">ส่งรายงานสำเร็จ!</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                บันทึกรายงานตรวจตราของ <strong className="text-slate-800">{selectedBranch}</strong> เรียบร้อยแล้ว
              </p>
            </div>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                router.push("/employee/reports");
              }}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-orange-500/20 transition cursor-pointer"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}