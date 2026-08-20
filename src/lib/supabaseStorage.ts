import { supabase } from "@/lib/supabase";

// ฟังก์ชันอัปโหลดรูป Attendance (โค้ดเดิมของคุณ)
export async function uploadAttendanceImage(fileBuffer: Buffer, fileName: string) {
  const uniqueName = `attendance/${Date.now()}-${fileName.replace(/\s+/g, '_')}`;

  const { data, error } = await supabase.storage
    .from("attendance") // Bucket: attendance
    .upload(uniqueName, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw new Error(`อัปโหลดรูปไม่สำเร็จ: ${error.message}`);

  const { data: publicUrlData } = supabase.storage
    .from("attendance")
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

// ฟังก์ชันอัปโหลดรูป Reports (แยก Bucket)
export async function uploadReportImage(fileBuffer: Buffer, fileName: string) {
  const uniqueName = `reports/${Date.now()}-${fileName.replace(/\s+/g, '_')}`;

  const { data, error } = await supabase.storage
    .from("reports") // Bucket: reports
    .upload(uniqueName, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw new Error(`อัปโหลดรูปรายงานไม่สำเร็จ: ${error.message}`);

  const { data: publicUrlData } = supabase.storage
    .from("reports")
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}