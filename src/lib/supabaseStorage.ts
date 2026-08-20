import { supabase } from "@/lib/supabase";

export async function uploadAttendanceImage(fileBuffer: Buffer, fileName: string) {
  // จัดการตั้งชื่อไฟล์ใหม่เพื่อไม่ให้ชื่อซ้ำกัน
  const uniqueName = `attendance/${Date.now()}-${fileName.replace(/\s+/g, '_')}`;

  const { data, error } = await supabase.storage
    .from("attendance") // ชื่อ Bucket ที่เราเพิ่งสร้างใน Supabase
    .upload(uniqueName, fileBuffer, {
      contentType: 'image/jpeg', // หรือชนิดไฟล์ที่เหมาะสม
      upsert: false,
    });

  if (error) {
    throw new Error(`อัปโหลดรูปไม่สำเร็จ: ${error.message}`);
  }

  // ดึง Public URL ของรูปภาพ
  const { data: publicUrlData } = supabase.storage
    .from("attendance")
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}