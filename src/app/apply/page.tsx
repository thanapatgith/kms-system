'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function JobApplyPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('เจ้าหน้าที่รักษาความปลอดภัย (รปภ.)');
  const [experience, setExperience] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let uploadedResumeUrl = null;

      // 1. ถ้ามีการเลือกไฟล์ ให้ทำอัปโหลดเข้า Supabase Storage
      if (file) {
        // แปลงชื่อไฟล์ภาษาไทย/อักขระพิเศษเป็นภาษาอังกฤษป้องกันไฟล์เสีย
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Storage Upload Error:', uploadError);
          throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ: ${uploadError.message}`);
        }

        // ดึง Public URL ของไฟล์
        const { data: publicUrlData } = supabase.storage
          .from('resumes')
          .getPublicUrl(fileName);

        uploadedResumeUrl = publicUrlData.publicUrl;
      }

      // 2. บันทึกข้อมูลลงตาราง job_applications
      const { error: insertError } = await supabase.from('job_applications').insert([
        {
          full_name: fullName,
          phone: phone,
          position_applied: position,
          experience_summary: experience,
          resume_url: uploadedResumeUrl,
        },
      ]);

      if (insertError) {
        console.error('Database Insert Error:', insertError);
        throw new Error(`บันทึกข้อมูลไม่สำเร็จ: ${insertError.message}`);
      }

      setMessage({ type: 'success', text: 'ส่งใบสมัครพร้อมไฟล์แนบเรียบร้อยแล้ว!' });
      setFullName('');
      setPhone('');
      setExperience('');
      setFile(null);
    } catch (error: any) {
      console.error('Submit Error:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-white/50">
        <div className="flex justify-center mb-4">
          <div className="bg-indigo-100 p-3 rounded-full text-2xl">
            📝
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-6 text-indigo-900">
          กรอกใบสมัครงาน (KMS Guard)
        </h1>

        {message && (
          <div
            className={`p-4 rounded-lg mb-6 text-sm font-semibold shadow-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              ชื่อ - นามสกุล <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="นาย สมชาย ใจดี"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 outline-none transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812345678"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 outline-none transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              ตำแหน่งที่ต้องการสมัคร
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 outline-none transition-shadow"
            >
              <option value="เจ้าหน้าที่รักษาความปลอดภัย (รปภ.)">เจ้าหน้าที่รักษาความปลอดภัย (รปภ.)</option>
              <option value="หัวหน้าชุด / สายตรวจ">หัวหน้าชุด / สายตรวจ</option>
              <option value="เจ้าหน้าที่ทำความสะอาด (แม่บ้าน)">เจ้าหน้าที่ทำความสะอาด (แม่บ้าน)</option>
              <option value="เจ้าหน้าที่ธุรการ / สำนักงาน">เจ้าหน้าที่ธุรการ / สำนักงาน</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              ประวัติ/ประสบการณ์ทำงานโดยย่อ
            </label>
            <textarea
              rows={3}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="เช่น เคยเป็น รปภ. มา 2 ปี / ผ่านการฝึกอบรม..."
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 outline-none resize-none transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              แนบไฟล์ Resume / ประวัติการทำงาน (PDF, PNG, JPG)
            </label>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 mt-2"
          >
            {loading ? 'กำลังส่งข้อมูล...' : '✨ ส่งใบสมัครงาน'}
          </button>
        </form>
      </div>
    </div>
  );
}