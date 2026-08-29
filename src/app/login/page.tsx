"use client";

import React, { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError("กรุณากรอก Username และ Password ให้ครบถ้วน");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        // 1. แปลง Role เป็นตัวพิมพ์ใหญ่เพื่อความชัวร์
        const userRole = data.user?.role?.toUpperCase();

        // 2. แยกเส้นทางตาม Role รวมถึง CLIENT ไปที่ /client/dashboard
        if (userRole === "CLIENT") {
          window.location.href = "/client/dashboard";
        } else if (userRole === "CEO") {
          window.location.href = "/ceo/dashboard";
        } else if (userRole === "SUPERVISOR") {
          window.location.href = "/supervisor/dashboard";
        } else {
          window.location.href = "/employee/profile";
        }
      } else {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-900 p-5 font-sans">
      <section className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl border border-slate-100">
        <a href="/" className="text-sm font-bold text-orange-500 hover:underline">
          ← กลับหน้าเว็บไซต์
        </a>

        <div className="mt-6">
          <img
            src="https://i.ibb.co/27TDqzHM/680211-removebg-preview.png"
            alt="KMS Logo"
            className="h-12 w-auto object-contain rounded"
          />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Login ระบบ</h1>
          <p className="mt-1 text-sm text-slate-500">เข้าสู่ระบบพนักงานและลูกค้า (Customer Portal)</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Username
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username หรือ รหัสพนักงาน"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm"
            />
          </label>

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-orange-500 py-3 font-bold text-white transition hover:bg-orange-600 disabled:opacity-60 cursor-pointer shadow-md shadow-orange-500/20 mt-2"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </section>
    </main>
  );
}