import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// ฟังก์ชันตรวจสอบเซสชันฝั่งพนักงานโดยเฉพาะ
export async function getEmployeeSession() {
  try {
    const cookieStore = cookies();
    // สมมติว่าพนักงานใช้คุกกี้ชื่อ "employee_token" (ถ้าใช้ชื่ออื่นสามารถปรับเปลี่ยนตรงนี้ได้ครับ)
    const token = cookieStore.get("employee_token")?.value;

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role?: string };
    
    if (!decoded || !decoded.userId) return null;

    // ดึงข้อมูลจากตารางพนักงานโดยตรง (เช่น ตาราง User หรือ Employee ตามที่คุณใช้งานจริง)
    const employee = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!employee) return null;

    return {
      userId: employee.id,
      name: employee.name,
      role: employee.role,
    };
  } catch (error) {
    return null;
  }
}