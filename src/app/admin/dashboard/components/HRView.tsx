"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Application {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  experience_years: number;
  resume_url?: string;
  status: "pending" | "interviewing" | "accepted" | "rejected";
}

export default function HRView() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลใบสมัครงาน
  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("job_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setApplications(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // อัปเดตสถานะใบสมัคร
  const updateStatus = async (id: string, newStatus: Application["status"]) => {
    const { error } = await supabase
      .from("job_applications")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      setApplications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    }
  };

  // Badge สีตามสถานะ
  const getStatusBadge = (status: Application["status"]) => {
    switch (status) {
      case "pending":
        return <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-medium">รอพิจารณา</span>;
      case "interviewing":
        return <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">เรียกสัมภาษณ์</span>;
      case "accepted":
        return <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium">รับเข้าทำงาน</span>;
      case "rejected":
        return <span className="bg-rose-100 text-rose-700 text-xs px-2.5 py-1 rounded-full font-medium">ไม่ผ่าน</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">📑 รายการใบสมัครงาน</h3>
          <p className="text-xs text-slate-500 mt-0.5">จัดการผู้สมัครและเปลี่ยนสถานะการคัดเลือก</p>
        </div>
        <button
          onClick={fetchApplications}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          🔄 รีเฟรชข้อมูล
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 font-medium animate-pulse">กำลังโหลดข้อมูลผู้สมัคร...</div>
      ) : applications.length === 0 ? (
        <div className="p-8 text-center text-slate-400 font-medium">ยังไม่มีใบสมัครส่งเข้ามาในขณะนี้</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 text-xs uppercase tracking-wider">
                <th className="p-4">วันที่สมัคร</th>
                <th className="p-4">ชื่อ-นามสกุล</th>
                <th className="p-4">ตำแหน่งที่สมัคร</th>
                <th className="p-4">ประสบการณ์</th>
                <th className="p-4">ข้อมูลติดต่อ</th>
                <th className="p-4">สถานะ</th>
                <th className="p-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {applications.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 whitespace-nowrap text-slate-400 text-xs">
                    {new Date(item.created_at).toLocaleDateString("th-TH")}
                  </td>
                  <td className="p-4 font-semibold text-slate-800">{item.full_name}</td>
                  <td className="p-4 font-medium text-amber-600">{item.position}</td>
                  <td className="p-4">{item.experience_years} ปี</td>
                  <td className="p-4 text-xs">
                    <div>{item.phone}</div>
                    <div className="text-slate-400">{item.email}</div>
                  </td>
                  <td className="p-4 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <select
                      value={item.status}
                      onChange={(e) => updateStatus(item.id, e.target.value as Application["status"])}
                      className="text-xs bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      <option value="pending">รอพิจารณา</option>
                      <option value="interviewing">เรียกสัมภาษณ์</option>
                      <option value="accepted">รับเข้าทำงาน</option>
                      <option value="rejected">ไม่ผ่าน</option>
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