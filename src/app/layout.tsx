import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SECURITY KM GUARD & SUPPLY GROUP",
  description: "Security operations management system",
  icons: {
    icon: "/kmslogo.png", // ดึงไฟล์ kmslogo.png จากโฟลเดอร์ public มาใช้เป็น Favicon
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}