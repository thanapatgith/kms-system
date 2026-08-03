import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "admin_session"; // เปลี่ยนชื่อให้ตรงกับ Cookie ใน Browser

export type Session = { userId: string; username: string; role: string };

export async function getSession(): Promise<Session | null> {
  // ดึงค่า cookie admin_session หรือ token
  const rawCookie = cookies().get(SESSION_COOKIE)?.value || cookies().get("token")?.value;
  if (!rawCookie) return null;

  try {
    // Decode percent encoding และ Parse JSON
    const decoded = decodeURIComponent(rawCookie);
    const data = JSON.parse(decoded);

    // ตรวจสอบว่ามีข้อมูลผู้ใช้อยู่จริงไหม
    const userId = data.userId || data.id;
    const username = data.username || data.name || "";
    const role = data.role || "STAFF";

    if (!userId) return null;

    return {
      userId: String(userId),
      username: String(username),
      role: String(role),
    };
  } catch (error) {
    console.error("Failed to parse session cookie:", error);
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}