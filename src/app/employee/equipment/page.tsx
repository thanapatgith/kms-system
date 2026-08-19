"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const EQUIPMENT_CATALOG = [
  {
    id: "uniform",
    name: "เสื้อ+กางเกง ชุดเครื่องแบบ รปภ.",
    hasSize: true,
    sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
  },
  {
    id: "shoes",
    name: "รองเท้าคอมแบท / รองเท้าคัทชู",
    hasSize: true,
    sizes: [
      "เบอร์ 37",
      "เบอร์ 38",
      "เบอร์ 39",
      "เบอร์ 40",
      "เบอร์ 41",
      "เบอร์ 42",
      "เบอร์ 43",
      "เบอร์ 44",
      "เบอร์ 45",
    ],
  },
  {
    id: "cap",
    name: "หมวกหม้อตาล / หมวกแก๊ป KMS",
    hasSize: true,
    sizes: ["ฟรีไซส์ (ปรับสายได้)", "S (54 cm)", "M (56 cm)", "L (58 cm)", "XL (60 cm)"],
  },
  {
    id: "belt",
    name: "เข็มขัดสนาม / สายโยงสนาม",
    hasSize: true,
    sizes: ["S (28-32 นิ้ว)", "M (32-36 นิ้ว)", "L (36-40 นิ้ว)", "XL (40-44 นิ้ว)"],
  },
  {
    id: "walkie_talkie",
    name: "วิทยุสื่อสาร (Walkie-Talkie)",
    hasSize: false,
    sizes: [],
  },
  {
    id: "flashlight",
    name: "ไฟฉายตรวจการณ์แรงสูง",
    hasSize: false,
    sizes: [],
  },
  {
    id: "baton",
    name: "กระบอง รปภ. / ดิ้วยืดขยาย",
    hasSize: false,
    sizes: [],
  },
  {
    id: "whistle",
    name: "นกหวีดพร้อมสายคล้อง",
    hasSize: false,
    sizes: [],
  },
  {
    id: "badge",
    name: "ป้ายชื่อ / อาร์มโลโก้ KMS",
    hasSize: false,
    sizes: [],
  },
  {
    id: "other",
    name: "อุปกรณ์อื่นๆ (ระบุในหมายเหตุ)",
    hasSize: false,
    sizes: [],
  },
];

export default function EmployeeEquipmentPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    itemName: EQUIPMENT_CATALOG[0].name,
    size: EQUIPMENT_CATALOG[0].sizes[0] || "-",
    quantity: 1,
    reasonType: "NEW",
    reason: "",
  });

  const selectedItemObj = EQUIPMENT_CATALOG.find((i) => i.name === formData.itemName) || EQUIPMENT_CATALOG[0];

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employee/equipment");
      const data = await res.json();
      if (data.ok) {
        const sorted = (data.requests || []).sort((a: any, b: any) => 
          new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime()
        );
        setRequests(sorted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setQuickDate = (type: "TODAY" | "LAST_7_DAYS" | "ALL") => {
    if (type === "TODAY") {
      const today = getTodayString();
      setFromDate(today);
      setToDate(today);
    } else if (type === "LAST_7_DAYS") {
      const today = new Date();
      const past7 = new Date();
      past7.setDate(today.getDate() - 6);

      const format = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      setFromDate(format(past7));
      setToDate(format(today));
    } else if (type === "ALL") {
      setFromDate("");
      setToDate("");
    }
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemName = e.target.value;
    const itemObj = EQUIPMENT_CATALOG.find((i) => i.name === newItemName);
    const defaultSize = itemObj && itemObj.hasSize && itemObj.sizes.length > 0 ? itemObj.sizes[0] : "-";

    setFormData({
      ...formData,
      itemName: newItemName,
      size: defaultSize,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/employee/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "ไม่สามารถยื่นคำขอเบิกอุปกรณ์ได้");
      }

      setSuccessMsg("ยื่นคำขอเบิกอุปกรณ์สำเร็จ!");
      setShowModal(false);
      setFormData({
        itemName: EQUIPMENT_CATALOG[0].name,
        size: EQUIPMENT_CATALOG[0].sizes[0] || "-",
        quantity: 1,
        reasonType: "NEW",
        reason: "",
      });
      setFromDate("");
      setToDate("");
      fetchRequests();
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((item) => {
    const dateStr = item.createdAt || item.date;
    if (!dateStr) return true;

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const itemLocalDate = `${year}-${month}-${day}`;

    if (fromDate && itemLocalDate < fromDate) return false;
    if (toDate && itemLocalDate > toDate) return false;

    return true;
  });

  return (
    <div className="w-full min-h-screen bg-slate-100 pb-24">
      {/* Header ด้านบน */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-orange-500 font-bold text-[10px] rounded uppercase tracking-wider">
              EMPLOYEE
            </span>
            <h1 className="text-sm font-bold">เบิกอุปกรณ์/เครื่องแต่งกาย</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-3">
        
        {/* หัวข้อและปุ่มยื่นคำขอ */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 flex justify-between items-center gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">คำขอเบิกอุปกรณ์</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">เบิกเครื่องแต่งกาย อุปกรณ์ประจำกาย และเครื่องมือ</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer shrink-0"
          >
            + ยื่นคำขอใหม่
          </button>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium text-center">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        {/* ตัวกรองช่วงวันที่ (Date Range Filter) */}
        <div className="bg-white rounded-2xl shadow-sm p-3.5 border border-slate-200 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-800">📅 ค้นหาตามช่วงวันที่</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setQuickDate("TODAY")}
                className="px-2 py-1 bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
              >
                วันนี้
              </button>
              <button
                type="button"
                onClick={() => setQuickDate("LAST_7_DAYS")}
                className="px-2 py-1 bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
              >
                7 วันล่าสุด
              </button>
              <button
                type="button"
                onClick={() => setQuickDate("ALL")}
                className="px-2 py-1 bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
              >
                ดูทั้งหมด
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">ตั้งแต่วันที่:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">ถึงวันที่:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* ประวัติการยื่นคำขอ */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800">
              📦 ประวัติคำขอเบิกอุปกรณ์ของคุณ
            </h3>
            <span className="text-[10px] font-bold text-slate-400">
              พบ {filteredRequests.length} รายการ
            </span>
          </div>

          {loading ? (
            <div className="text-center text-slate-400 py-6 text-xs animate-pulse">กำลังโหลดข้อมูล...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-xs bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-lg block">📦</span>
              <span>{(fromDate || toDate) ? "ไม่พบคำขอในช่วงวันที่เลือก" : "ยังไม่มีประวัติการขอเบิกอุปกรณ์"}</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredRequests.map((item) => (
                <div key={item.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-start text-xs space-y-1 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.itemName}</span>
                      {item.size && item.size !== "-" && (
                        <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded">
                          {item.size}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-600 block">
                      จำนวน: <span className="font-bold text-orange-600">{item.quantity}</span> ชิ้น | สาเหตุ: {item.reasonType === "REPLACE" ? "ชำรุด/เสื่อมสภาพ" : item.reasonType === "LOST" ? "สูญหาย" : "พนักงานใหม่/ขอเพิ่ม"}
                    </span>
                    {item.reason && (
                      <span className="text-[10px] text-slate-400 italic block">
                        หมายเหตุ: {item.reason}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono block">
                      🗓️ {item.date} {item.time} น.
                    </span>
                  </div>

                  <div className="shrink-0 ml-2">
                    {item.status === "PENDING" && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px]">
                        รออนุมัติ
                      </span>
                    )}
                    {item.status === "APPROVED" && (
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold text-[10px]">
                        อนุมัติแล้ว (รอจัดส่ง)
                      </span>
                    )}
                    {item.status === "DELIVERED" && (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                        ✓ รับอุปกรณ์แล้ว
                      </span>
                    )}
                    {item.status === "REJECTED" && (
                      <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full font-bold text-[10px]">
                        ไม่อนุมัติ
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Modal ยื่นคำขอเบิกอุปกรณ์ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">ยื่นคำขอเบิกอุปกรณ์ใหม่</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">รายการอุปกรณ์ *</label>
                <select
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleItemChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
                >
                  {EQUIPMENT_CATALOG.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ขนาด/ไซส์</label>
                  {selectedItemObj.hasSize ? (
                    <select
                      name="size"
                      value={formData.size}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
                    >
                      {selectedItemObj.sizes.map((s, idx) => (
                        <option key={idx} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value="ไม่ต้องระบุ"
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 font-medium cursor-not-allowed"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">จำนวน *</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    max="10"
                    required
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">สาเหตุในการขอเบิก *</label>
                <select
                  name="reasonType"
                  value={formData.reasonType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
                >
                  <option value="NEW">พนักงานใหม่ / ขอเพิ่มประจำปี</option>
                  <option value="REPLACE">ชำรุด / เสื่อมสภาพจากการทำงาน</option>
                  <option value="LOST">สูญหายระหว่างปฏิบัติหน้าที่</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">หมายเหตุเพิ่มเติม</label>
                <textarea
                  name="reason"
                  rows={2}
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "กำลังส่ง..." : "ยืนยันการเบิก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-lg">
        <Link href="/employee/profile" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">👤</span>
          หน้าแรก
        </Link>
        <Link href="/employee/leaves" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📝</span>
          ระบบลา
        </Link>
        <Link href="/employee/attendance" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">⏱️</span>
          ลงเวลาทำงาน
        </Link>
        <Link href="/employee/shifts" className="flex flex-col items-center text-slate-400 hover:text-orange-400 text-[10px] font-semibold transition">
          <span className="text-base mb-0.5">📅</span>
          ตารางเวร
        </Link>
      </nav>
    </div>
  );
}