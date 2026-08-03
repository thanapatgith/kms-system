"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Inquiry {
  id: string;
  created_at: string;
  name: string;
  company_name?: string;
  email: string;
  phone: string;
  service_type: string;
  message: string;
  status: "new" | "contacted" | "closed";
}

export default function SalesView() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลข้อความติดต่อ
  const fetchInquiries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setInquiries(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  // อัปเดตสถานะการติดต่อ
  const updateStatus = async (id: string, newStatus: Inquiry["status"]) => {
    const { error } = await supabase
      .from("contact_inquiries")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      setInquiries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    }
  };

  // Badge สีตามสถานะ
  const getStatusBadge = (status: Inquiry["status"]) => {
    switch (status) {
      case "new":
        return <span className="bg-rose-100 text-rose-700 text-xs px-2.5 py-1 rounded-full font-medium">เรื่องใหม่</span>;
      case "contacted":
        return <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-medium">ติดต่อแล้ว</span>;
      case "closed":
        return <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium">ปิดการขาย</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">💬 ข้อความติดต่อจากลูกค้า (Sales)</h3>
          <p className="text-xs text-slate-500 mt-0.5">ติดตามและจัดการลูกค้าที่ส่งข้อความสอบถามบริการ</p>
        </div>
        <button
          onClick={fetchInquiries}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          🔄 รีเฟรชข้อมูล
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 font-medium animate-pulse">กำลังโหลดข้อมูลข้อความ...</div>
      ) : inquiries.length === 0 ? (
        <div className="p-8 text-center text-slate-400 font-medium">ยังไม่มีรายการข้อความติดต่อในขณะนี้</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 text-xs uppercase tracking-wider">
                <th className="p-4">วันที่ติดต่อ</th>
                <th className="p-4">ชื่อผู้ติดต่อ / บริษัท</th>
                <th className="p-4">บริการที่สนใจ</th>
                <th className="p-4">ข้อความ/รายละเอียด</th>
                <th className="p-4">ข้อมูลติดต่อ</th>
                <th className="p-4">สถานะ</th>
                <th className="p-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {inquiries.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 whitespace-nowrap text-slate-400 text-xs">
                    {new Date(item.created_at).toLocaleDateString("th-TH")}
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{item.name}</div>
                    {item.company_name && (
                      <div className="text-xs text-slate-400">{item.company_name}</div>
                    )}
                  </td>
                  <td className="p-4 font-medium text-amber-600">{item.service_type}</td>
                  <td className="p-4 max-w-xs">
                    <p className="line-clamp-2 text-xs text-slate-600" title={item.message}>
                      {item.message}
                    </p>
                  </td>
                  <td className="p-4 text-xs">
                    <div>{item.phone}</div>
                    <div className="text-slate-400">{item.email}</div>
                  </td>
                  <td className="p-4 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <select
                      value={item.status}
                      onChange={(e) => updateStatus(item.id, e.target.value as Inquiry["status"])}
                      className="text-xs bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      <option value="new">เรื่องใหม่</option>
                      <option value="contacted">ติดต่อแล้ว</option>
                      <option value="closed">ปิดการขาย</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}