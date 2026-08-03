'use client';

import { useEffect, useState } from 'react';

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  durationDays: number;
  reason: string;
  status: string;
  createdAt: string;
  user?: {
    name: string;
    employeeCode: string;
  };
}

const typeLabel: Record<string, string> = {
  SICK: "ลาป่วย",
  PERSONAL: "ลากิจ",
  MATERNITY: "ลาคลอด",
  VACATION: "ลาพักร้อน"
};

export default function AdminLeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/leaves');
      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId: id, status: newStatus }),
      });

      if (!res.ok) throw new Error('ไม่สามารถอัปเดตสถานะได้');
      fetchLeaveRequests();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">อนุมัติแล้ว</span>;
      case 'REJECTED':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1 rounded-full">ไม่อนุมัติ</span>;
      default:
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full">รออนุมัติ</span>;
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">
          📋 รายการการขอยื่นใบลา (สำหรับผู้ดูแลระบบ)
        </h1>
        <p className="text-sm text-slate-500 mt-1">ตรวจสอบและจัดการสถานะการลาของพนักงาน</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium bg-white rounded-xl shadow-sm border border-slate-200">
          กำลังโหลดข้อมูล...
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-medium bg-white rounded-xl shadow-sm border border-slate-200">
          ยังไม่มีรายการใบลาในระบบ
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
          <table className="w-full text-left text-sm text-slate-800">
            <thead className="bg-slate-100 text-slate-700 uppercase text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">พนักงาน</th>
                <th className="px-4 py-3.5">ประเภท</th>
                <th className="px-4 py-3.5">วันที่เริ่มลา</th>
                <th className="px-4 py-3.5">จำนวนวัน</th>
                <th className="px-4 py-3.5">เหตุผล</th>
                <th className="px-4 py-3.5 text-center">สถานะ</th>
                <th className="px-4 py-3.5 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {req.user?.name || "ไม่ระบุชื่อ"}
                    <div className="text-xs text-slate-500 font-normal">รหัส: {req.user?.employeeCode || "-"}</div>
                  </td>
                  <td className="px-4 py-4 font-medium">{typeLabel[req.leaveType] || req.leaveType}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                    {new Date(req.startDate).toLocaleDateString("th-TH")}
                  </td>
                  <td className="px-4 py-4 font-semibold">{req.durationDays} วัน</td>
                  <td className="px-4 py-4 max-w-xs truncate text-slate-600">{req.reason}</td>
                  <td className="px-4 py-4 text-center">{getStatusBadge(req.status)}</td>
                  <td className="px-4 py-4 text-center">
                    {req.status === 'PENDING' ? (
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
                        >
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
                        >
                          ปฏิเสธ
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">ดำเนินการแล้ว</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}