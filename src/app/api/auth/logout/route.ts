import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  const response = NextResponse.json({ ok: true });
  
  // ลบ Cookie session
  response.cookies.set("admin_session", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });

  return response;
}