"use client";

import { FormEvent, useState } from "react";

export default function PasswordForm() {
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const form = new FormData(event.currentTarget);
    const formElement = event.currentTarget;

    const response = await fetch("/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      }),
    });

    const isOk = response.ok;
    setIsSuccess(isOk);

    if (isOk) {
      setMessage("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
      formElement.reset();
    } else {
      const data = await response.json();
      setMessage(data.error ?? "ไม่สามารถเปลี่ยนรหัสผ่านได้");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md">
      {/* ช่องรหัสผ่านเดิม */}
      <div>
        <label className="block text-sm font-bold text-slate-800 mb-1.5">
          รหัสผ่านเดิม
        </label>
        <input
          required
          name="currentPassword"
          type="password"
          placeholder="กรอกรหัสผ่านเดิม"
          className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-slate-400 font-medium shadow-sm transition-all"
        />
      </div>

      {/* ช่องรหัสผ่านใหม่ */}
      <div>
        <label className="block text-sm font-bold text-slate-800 mb-1.5">
          รหัสผ่านใหม่
        </label>
        <input
          required
          minLength={8}
          name="newPassword"
          type="password"
          placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
          className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-slate-400 font-medium shadow-sm transition-all"
        />
      </div>

      {/* ปุ่มบันทึก */}
      <button
        type="submit"
        className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-2.5 rounded-lg shadow-sm hover:shadow transition-all mt-2"
      >
        บันทึกรหัสผ่านใหม่
      </button>

      {/* ข้อความแจ้งเตือนสถานะ */}
      {message && (
        <p
          className={`text-sm font-semibold p-3 rounded-lg mt-3 ${
            isSuccess
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}