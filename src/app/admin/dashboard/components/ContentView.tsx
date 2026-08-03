"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ContentItem {
  id?: string;
  key: string;
  title: string;
  value: string;
  updated_at?: string;
}

export default function ContentView() {
  const [contents, setContents] = useState<Record<string, ContentItem>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [activeSection, setActiveSection] = useState<"hero" | "about" | "services" | "portfolio" | "join" | "general">("hero");

  // ดึงข้อมูลเนื้อหาทั้งหมด
  const fetchContents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("site_content").select("*");

    if (!error && data) {
      const contentMap: Record<string, ContentItem> = {};
      data.forEach((item) => {
        contentMap[item.key] = item;
      });
      setContents(contentMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContents();
  }, []);

  const handleChange = (key: string, value: string) => {
    setContents((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        key,
        value,
        title: prev[key]?.title || key,
      },
    }));
  };

  const handleSave = async (key: string) => {
    const item = contents[key];
    if (!item) return;

    setSavingKey(key);
    try {
      const { error } = await supabase.from("site_content").upsert(
        {
          key: item.key,
          title: item.title || key,
          value: item.value || "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

      if (error) throw error;
      alert("บันทึกข้อมูลเรียบร้อยแล้ว!");
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
    } finally {
      setSavingKey(null);
    }
  };

  // 🖼️ ฟังก์ชันจัดการสไลด์หน้าแรกแบบการ์ดทีละชุด
  const renderHeroSlidesManager = () => {
    const item = contents["hero_slides"] || { key: "hero_slides", title: "Hero Slides", value: "" };
    
    let slidesList: Array<{ image: string; eyebrow: string; title: string; description: string }> = [];
    try {
      if (item.value) {
        slidesList = JSON.parse(item.value);
      }
    } catch {
      slidesList = [{ image: "", eyebrow: "", title: "", description: "" }];
    }

    const updateSlides = (newList: typeof slidesList) => {
      handleChange("hero_slides", JSON.stringify(newList));
    };

    const handleAddSlide = () => {
      updateSlides([...slidesList, { image: "", eyebrow: "", title: "", description: "" }]);
    };

    const handleSlideChange = (index: number, field: string, val: string) => {
      const updated = [...slidesList];
      updated[index] = { ...updated[index], [field]: val };
      updateSlides(updated);
    };

    const handleRemoveSlide = (index: number) => {
      const updated = slidesList.filter((_, i) => i !== index);
      updateSlides(updated);
    };

    return (
      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 mb-5 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-200/60">
          <div>
            <label className="text-sm font-bold text-slate-800">🖼️ จัดการชุดภาพสไลด์หน้าแรก (Hero Slides)</label>
            <span className="text-xs text-slate-400 block mt-0.5">
              แก้ไขสไลด์ทีละชุด ระบบจะหมุนเวียนแสดงผลบนหน้าเว็บไซต์อัตโนมัติ
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddSlide}
              className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-xs px-3 py-2 rounded-xl transition-colors border border-amber-200 flex items-center gap-1 cursor-pointer"
            >
              ➕ เพิ่มชุดสไลด์ใหม่
            </button>
            <button
              type="button"
              onClick={() => handleSave("hero_slides")}
              disabled={savingKey === "hero_slides"}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {savingKey === "hero_slides" ? "บันทึก..." : "💾 บันทึกสไลด์ทั้งหมด"}
            </button>
          </div>
        </div>

        {slidesList.length > 0 ? (
          <div className="space-y-4 max-h-[500px] overflow-y-auto p-1 pr-2">
            {slidesList.map((slide, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                    ชุดสไลด์ที่ {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSlide(idx)}
                    className="text-xs text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    🗑️ ลบชุดนี้
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl p-2">
                    <div className="w-full h-28 rounded-lg bg-slate-200 overflow-hidden flex items-center justify-center mb-2">
                      {slide.image.trim() ? (
                        <img src={slide.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                      ) : (
                        <span className="text-xs text-slate-400">🖼️ ไม่มีรูปภาพ</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={slide.image}
                      placeholder="วาง URL รูปภาพ..."
                      onChange={(e) => handleSlideChange(idx, "image", e.target.value)}
                      className="w-full text-xs p-2 bg-white text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">ข้อความย่อยด้านบน (Eyebrow)</label>
                      <input
                        type="text"
                        value={slide.eyebrow}
                        placeholder="เช่น KMS GUARD & SUPPLY GROUP"
                        onChange={(e) => handleSlideChange(idx, "eyebrow", e.target.value)}
                        className="w-full text-xs p-2 bg-white text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">ข้อความพาดหัวหลัก (Title)</label>
                      <input
                        type="text"
                        value={slide.title}
                        placeholder="เช่น มั่นใจในทุกพื้นที่ ปลอดภัยในทุกช่วงเวลา"
                        onChange={(e) => handleSlideChange(idx, "title", e.target.value)}
                        className="w-full text-xs p-2 bg-white text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">คำอธิบายใต้พาดหัว (Description)</label>
                      <textarea
                        rows={2}
                        value={slide.description}
                        placeholder="อธิบายรายละเอียดสั้นๆ..."
                        onChange={(e) => handleSlideChange(idx, "description", e.target.value)}
                        className="w-full text-xs p-2 bg-white text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            ยังไม่มีชุดสไลด์ กดปุ่ม <strong>"➕ เพิ่มชุดสไลด์ใหม่"</strong> เพื่อเริ่มต้น
          </div>
        )}
      </div>
    );
  };

  const renderDynamicListField = (key: string, label: string) => {
    const item = contents[key] || { key, title: label, value: "" };

    const urlList =
      item.value !== undefined && item.value !== null
        ? item.value.split("\n")
        : [];

    const updateUrls = (newList: string[]) => {
      handleChange(key, newList.join("\n"));
    };

    const handleAddUrl = () => {
      updateUrls([...urlList, ""]);
    };

    const handleItemChange = (index: number, newUrl: string) => {
      const updated = [...urlList];
      updated[index] = newUrl;
      updateUrls(updated);
    };

    const handleRemoveUrl = (index: number) => {
      const updated = urlList.filter((_, i) => i !== index);
      updateUrls(updated);
    };

    const validCount = urlList.filter((u) => u.trim() !== "").length;

    return (
      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 mb-5 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-3 pb-3 border-b border-slate-200/60">
          <div>
            <label className="text-sm font-bold text-slate-800">{label}</label>
            <span className="text-xs text-slate-400 block mt-0.5">
              Key: <code className="bg-slate-200/60 px-1 py-0.5 rounded text-[11px]">{key}</code> (มีทั้งหมด {validCount} รายการ)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddUrl}
              className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-xs px-3 py-2 rounded-xl transition-colors border border-amber-200 flex items-center gap-1 cursor-pointer"
            >
              ➕ เพิ่มรูป
            </button>
            <button
              type="button"
              onClick={() => handleSave(key)}
              disabled={savingKey === key}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {savingKey === key ? "บันทึก..." : "💾 บันทึกส่วนนี้"}
            </button>
          </div>
        </div>

        {urlList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto p-1 pr-2">
            {urlList.map((url, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center overflow-hidden shrink-0">
                  {url.trim() ? (
                    <img
                      src={url}
                      alt={`Logo ${idx + 1}`}
                      className="w-full h-full object-contain p-0.5"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <span className="text-xs text-slate-300">🖼️</span>
                  )}
                </div>

                <input
                  type="text"
                  value={url}
                  placeholder="วาง URL รูปภาพ..."
                  onChange={(e) => handleItemChange(idx, e.target.value)}
                  className="flex-1 text-xs p-2 bg-white text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder:text-slate-400"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveUrl(idx)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 shrink-0 cursor-pointer"
                  title="ลบรายการนี้"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            ยังไม่มีรายการโลโก้ กดปุ่ม <strong>"➕ เพิ่มรูป"</strong> เพื่อเริ่มใช้งาน
          </div>
        )}
      </div>
    );
  };

  const renderInputField = (key: string, label: string, type: "text" | "textarea" = "text") => {
    const item = contents[key] || { key, title: label, value: "" };

    return (
      <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60 mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-bold text-slate-700">{label}</label>
          <span className="text-[10px] text-slate-400">Key: {key}</span>
        </div>
        <div className="flex gap-3">
          {type === "textarea" ? (
            <textarea
              rows={3}
              value={item.value}
              onChange={(e) => handleChange(key, e.target.value)}
              className="flex-1 p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-700"
            />
          ) : (
            <input
              type="text"
              value={item.value}
              onChange={(e) => handleChange(key, e.target.value)}
              className="flex-1 p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-700"
            />
          )}
          <button
            onClick={() => handleSave(key)}
            disabled={savingKey === key}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-4 rounded-xl transition-colors shadow-sm disabled:opacity-50 self-end py-3 cursor-pointer"
          >
            {savingKey === key ? "บันทึก..." : "💾 บันทึก"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">🖼️ จัดการเนื้อหาหน้าเว็บหลัก (CMS)</h3>
          <p className="text-xs text-slate-500 mt-0.5">เลือกปรับแก้ไขข้อความ สไลด์ และเนื้อหาแต่ละส่วนบนหน้าเว็บไซต์</p>
        </div>
        <button
          onClick={fetchContents}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          🔄 รีเฟรช
        </button>
      </div>

      <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveSection("hero")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSection === "hero" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          🖼️ 1. สไลด์หน้าแรก (Hero)
        </button>
        <button
          onClick={() => setActiveSection("about")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSection === "about" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          🏢 2. เกี่ยวกับเรา (About)
        </button>
        <button
          onClick={() => setActiveSection("services")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSection === "services" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          🛠️ 3. บริการของเรา (Services)
        </button>
        <button
          onClick={() => setActiveSection("portfolio")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSection === "portfolio" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          🏆 4. ผลงาน (Portfolio)
        </button>
        <button
          onClick={() => setActiveSection("join")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSection === "join" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          👥 5. ร่วมงานกับเรา (Join Us)
        </button>
        {/* ⚙️ เพิ่มปุ่มแท็บที่ 6 ตรงนี้ได้เลยครับ */}
        <button
          onClick={() => setActiveSection("general")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSection === "general" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          ⚙️ 6. ข้อมูลทั่วไป (Logo & Title)
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 font-medium animate-pulse">กำลังโหลดข้อมูลเนื้อหา...</div>
      ) : (
        <div className="p-6">
          {/* Section 1: Hero */}
          {activeSection === "hero" && (
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                📌 แก้ไขส่วน Hero Banner & ภาพสไลด์แบบหลายชุด
              </h4>
              {renderHeroSlidesManager()}
            </div>
          )}

          {/* Section 2: About */}
          {activeSection === "about" && (
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                📌 แก้ไขส่วน เกี่ยวกับเรา (About Us)
              </h4>
              {renderInputField("about_subtitle", "ข้อความย่อย (Subtitle)")}
              {renderInputField("about_title", "หัวข้อหลัก (Main Title)", "textarea")}
              {renderInputField("about_description", "รายละเอียดบริษัท (Description)", "textarea")}
              {renderInputField("about_image", "URL รูปภาพส่วนเกี่ยวกับเรา (Image URL)")}
              {renderInputField("about_badge_text", "ข้อความบน Badge สีเขียวตรงรูปภาพ")}

              <div className="mt-6 pt-4 border-t border-slate-100">
                <h5 className="text-xs font-bold text-slate-600 mb-3">📊 สถิติผลงาน (Counters)</h5>
                <div className="grid grid-cols-2 gap-2">
                  {renderInputField("about_stat_1_num", "สถิติ 1 (ตัวเลข เช่น 12+)")}
                  {renderInputField("about_stat_1_label", "สถิติ 1 (คำอธิบาย)")}
                  {renderInputField("about_stat_2_num", "สถิติ 2 (ตัวเลข เช่น 20+)")}
                  {renderInputField("about_stat_2_label", "สถิติ 2 (คำอธิบาย)")}
                  {renderInputField("about_stat_3_num", "สถิติ 3 (ตัวเลข เช่น 50+)")}
                  {renderInputField("about_stat_3_label", "สถิติ 3 (คำอธิบาย)")}
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Services */}
          {activeSection === "services" && (
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                📌 แก้ไขหัวข้อส่วน บริการของเรา (Services)
              </h4>
              {renderInputField("services_subtitle", "ข้อความย่อย (Subtitle)")}
              {renderInputField("services_title", "หัวข้อหลัก (Main Title)")}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  🛠️ จัดการการ์ดบริการ (Service Cards)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((num) => {
                    const key = `service_${num}`;
                    const rawValue = contents[key]?.value || "";
                    const [imgUrl = "", title = "", desc = ""] = rawValue.split("\n");

                    const handleServiceChange = (fieldIdx: number, val: string) => {
                      const parts = [imgUrl, title, desc];
                      parts[fieldIdx] = val;
                      
                      setContents((prev) => ({
                        ...prev,
                        [key]: {
                          key,
                          title: `บริการที่ ${num}`,
                          value: parts.join("\n"),
                        },
                      }));
                    };

                    return (
                      <div key={key} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                            <span className="font-bold text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                              บริการที่ {num}
                            </span>
                            <code className="text-[10px] text-slate-400">{key}</code>
                          </div>

                          <div className="w-full h-28 bg-slate-200/50 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                            {imgUrl.trim() ? (
                              <img src={imgUrl} alt={`Service ${num}`} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                            ) : (
                              <span className="text-xs text-slate-400">🖼️ ยังไม่มีรูปภาพ</span>
                            )}
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 block mb-1">URL รูปภาพ</label>
                            <input
                              type="text"
                              value={imgUrl}
                              placeholder="https://example.com/image.jpg"
                              onChange={(e) => handleServiceChange(0, e.target.value)}
                              className="w-full text-xs p-2 bg-white text-slate-800 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 block mb-1">ชื่อบริการ</label>
                            <input
                              type="text"
                              value={title}
                              placeholder="เช่น ดูแลโกดังและโรงงาน"
                              onChange={(e) => handleServiceChange(1, e.target.value)}
                              className="w-full text-xs p-2 bg-white text-slate-800 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 block mb-1">รายละเอียดสังเขป</label>
                            <textarea
                              rows={3}
                              value={desc}
                              placeholder="อธิบายรายละเอียดบริการ..."
                              onChange={(e) => handleServiceChange(2, e.target.value)}
                              className="w-full text-xs p-2 bg-white text-slate-800 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 resize-none"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSave(key)}
                          disabled={savingKey === key}
                          className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs py-2 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                          {savingKey === key ? "กำลังบันทึก..." : `💾 บันทึกบริการที่ ${num}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Portfolio */}
          {activeSection === "portfolio" && (
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                📌 แก้ไขส่วน ผลงานความไว้วางใจ (Portfolio)
              </h4>
              {renderInputField("portfolio_subtitle", "ข้อความย่อย (Subtitle)")}
              {renderInputField("portfolio_title", "หัวข้อหลัก (Main Title)")}

              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="mb-4">
                  <h5 className="text-xs font-bold text-slate-700">🏢 จัดการโลโก้ / ภาพผลงานตามหมวดหมู่</h5>
                  <p className="text-[11px] text-slate-400">สามารถกดปุ่มเพิ่ม/ลบรายการโลโก้ได้อิสระในแต่ละหมวดหมู่</p>
                </div>

                <div className="space-y-4">
                  {renderDynamicListField("portfolio_client_1", "โลโก้/ภาพผลงาน (คลังสินค้า)")}
                  {renderDynamicListField("portfolio_client_2", "โลโก้/ภาพผลงาน (สำนักงาน)")}
                  {renderDynamicListField("portfolio_client_3", "โลโก้/ภาพผลงาน (โรงงานอุตสาหกรรม)")}
                  {renderDynamicListField("portfolio_client_4", "โลโก้/ภาพผลงาน (พื้นที่พาณิชย์)")}
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Join Us */}
          {activeSection === "join" && (
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                📌 แก้ไขส่วน ร่วมงานกับเรา (Join Our Team)
              </h4>
              {renderInputField("join_subtitle", "ข้อความย่อย (Subtitle)")}
              {renderInputField("join_title", "หัวข้อหลัก (Main Title)")}
              {renderInputField("join_description", "คำอธิบายส่วนร่วมงาน (Description)", "textarea")}
            </div>
          )}

          {/* Section 6: General Info */}
{activeSection === "general" && (
  <div>
    <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
      📌 แก้ไขข้อมูลทั่วไป / โลโก้และชื่อเว็บไซต์
    </h4>
    {renderInputField("site_logo", "URL รูปภาพโลโก้เว็บไซต์ (Site Logo)")}
    {renderInputField("site_title", "ชื่อเว็บไซต์ / ชื่อบริษัท")}
  </div>
)}
        </div>
      )}
    </div>
  );
}