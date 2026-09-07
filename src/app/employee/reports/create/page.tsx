"use client";

import { useState, useEffect, useRef } from "react";
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

  const [selectedBranch, setSelectedBranch] = useState("");
  const [branchesList, setBranchesList] = useState<string[]>([]);

  const [showCameraModal, setShowCameraModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

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
          setErrorMsg("ไม่สามารถดึงตำแหน่ง GPS ได้ กรุณาเปิดใช้งาน Location ในเบราว์เซอร์");
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }

    return () => {
      stopCamera();
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("/api/employee/reports?action=sites");
      const data = await res.json();
      if (data.ok && data.branches) {
        setBranchesList(data.branches);
        setSelectedBranch(data.defaultBranch || data.branches[0]);
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

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.8
          );
        };
      };
    });
  };

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

  const capturePhoto = async () => {
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

      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `report_${Date.now()}.jpg`, { type: "image/jpeg" });
          setLoading(true);
          try {
            const compressedFile = await compressImage(file);
            setImages((prev) => [...prev, compressedFile]);
            setPreviews((prev) => [...prev, URL.createObjectURL(compressedFile)]);
          } catch (err) {
            console.error("Compression error:", err);
          } finally {
            setLoading(false);
            stopCamera();
            setShowCameraModal(false);
          }
        }
      }, "image/jpeg", 0.85);
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

    if (location?.lat === null || location?.lng === null || location === undefined) {
      setErrorMsg("ยังไม่พบพิกัด GPS กรุณารอสักครู่");
      return;
    }

    if (images.length === 0) {
      setErrorMsg("กรุณาถ่ายรูปประกอบการตรวจตราอย่างน้อย 1 รูป");
      return;
    }

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

  const isFormValid = location?.lat !== null && location?.lng !== null && images.length > 0 && message.trim() !== "";

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24">
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/employee/reports" className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1">
            ‹ กลับ
          </Link>
          <h1 className="text-sm font-bold">สร้างรายงานการตรวจตรา</h1>
          <div className="w-8"></div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-4 space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-800">
                📸 รูปภาพประกอบการตรวจตรา *
              </label>
              {images.length === 0 && (
                <span className="text-red-500 font-bold text-[10px] bg-red-50 px-2 py-0.5 rounded-md border border-red-200 animate-pulse">
                  ⚠️ ต้องถ่ายรูปอย่างน้อย 1 รูป
                </span>
              )}
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 shadow-sm">
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

            <div
              onClick={startCamera}
              className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-orange-300 hover:border-orange-500 rounded-2xl bg-orange-50/50 cursor-pointer transition shadow-inner"
            >
              <span className="text-2xl mb-1">📷</span>
              <span className="text-xs font-bold text-orange-600">กดเพื่อเปิดกล้องถ่ายภาพ (แนวตั้ง 3:4)</span>
              <span className="text-[10px] text-slate-400 mt-0.5">ถ่ายภาพพื้นที่ตรวจ หรือถ่ายภาพตนเอง</span>
            </div>
          </div>

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

          <div className="px-2 flex items-center justify-between text-[10px] text-slate-500">
            <span>📍 พิกัด GPS ยืนยันตำแหน่ง:</span>
            {location ? (
              <span className="font-mono bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </span>
            ) : (
              <span className="font-mono bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-200 font-bold animate-pulse">
                กำลังค้นหาพิกัด...
              </span>
            )}
          </div>

          {!isFormValid && (
            <div className="text-[11px] text-center text-amber-600 font-bold bg-amber-50 py-2 px-3 rounded-xl border border-amber-200 animate-pulse">
              ⚠️ กรุณารอพิกัด GPS และถ่ายรูปอย่างน้อย 1 รูป ก่อนส่งรายงาน
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/20 transition disabled:opacity-50 disabled:bg-slate-400 cursor-pointer"
          >
            {loading ? "กำลังประมวลผลรูปภาพ / ส่งรายงาน..." : "🚀 ส่งรายงานการตรวจตรา"}
          </button>
        </form>
      </main>

      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-4 pb-24">
          <div className="w-full flex justify-between items-center text-white py-1">
            <span className="text-xs font-bold">📷 ถ่ายภาพประกอบการตรวจตรา (แนวตั้ง 3:4)</span>
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
          </div>

          <canvas ref={canvasRef} className="hidden"></canvas>

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

      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
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