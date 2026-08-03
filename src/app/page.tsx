"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Grid } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/grid';

export default function Home() {
  const [contents, setContents] = useState<Record<string, any>>({});
  const [activeSection, setActiveSection] = useState("home");

  // 📌 1. ประกาศตัวแปรภาษาก่อนเป็นอันดับแรก
  const [language, setLanguage] = useState<"TH" | "EN" | "ZH">("TH");

  // 🌐 2. พจนานุกรมแปลภาษา (รวมถึงเนื้อหาหลักที่แก้ไขได้)
  const dict = {
    TH: {
      nav: [["Home", "หน้าแรก"], ["About", "เกี่ยวกับเรา"], ["Service", "บริการ"], ["Portfolio", "ผลงาน"], ["Career", "ร่วมงานกับเรา"], ["Contact", "ติดต่อเรา"]],
      loginBtn: "Login พนักงาน",
      moreBtn: "ดูบริการของเรา",
      aboutSub: "ABOUT",
      aboutTitle: "ปกป้อง มั่นใจ ปลอดภัย ทุกมิติของการดูแล",
      aboutDesc: "บริษัท รักษาความปลอดภัย...",
      aboutBadgeText: "ปกป้องเสมือน\nเป็นบ้านของเราเอง",
      stat1Label: "ปีแห่งประสบการณ์",
      stat2Label: "โปรเจกต์ที่ส่งมอบ",
      stat3Label: "เจ้าหน้าที่",
      servicesSub: "OUR SERVICES",
      servicesTitle: "บริการที่ออกแบบเพื่อทุกความต้องการ",
      askService: "สอบถามบริการ →",
      portfolioSub: "PORTFOLIO",
      portfolioTitleDefault: "ได้รับความไว้วางใจจากหลากหลายธุรกิจ",
      portfolioTabs: [
        { id: "1", key: "portfolio_client_3", title: "โรงงานอุตสาหกรรม" },
        { id: "2", key: "portfolio_client_2", title: "สำนักงาน" },
        { id: "3", key: "portfolio_client_1", title: "คลังสินค้า" },
        { id: "4", key: "portfolio_client_4", title: "พื้นที่พาณิชย์" },
      ],
      joinSub: "JOIN OUR TEAM",
      joinTitle: "ร่วมสร้างความปลอดภัยไปกับเรา",
      joinDesc: "เรากำลังมองหาทีมงานที่มีวินัย รับผิดชอบ และพร้อมเติบโตในสายงานรักษาความปลอดภัย",
      nameLabel: "ชื่อ-นามสกุล",
      contactLabel: "อีเมล / LINE ID",
      phoneLabel: "เบอร์ติดต่อ",
      positionLabel: "ตำแหน่งงาน",
      selectPos: "เลือกตำแหน่ง",
      guardPos: "เจ้าหน้าที่รักษาความปลอดภัย",
      headPos: "หัวหน้าชุด รปภ.",
      adminPos: "เจ้าหน้าที่ธุรการ",
      resumeLabel: "อัปโหลด Resume",
      submitResume: "ส่งใบสมัครงาน",
      contactUsSub: "CONTACT US",
      contactUsTitle: "ให้เราดูแลความปลอดภัยของคุณ",
      companyName: "KMS GUARD & SUPPLY GROUP CO., LTD.",
      location: "กรุงเทพมหานคร ประเทศไทย",
      phoneText: "โทร:",
      emailText: "อีเมล:",
      quoteTitle: "ขอใบเสนอราคา / ติดต่อสอบถาม",
      quoteDesc: "กรอกข้อมูลด้านล่าง เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุดครับ",
      fullNameCompany: "ชื่อ-นามสกุล / บริษัท",
      contactInfoLabel: "อีเมล หรือ LINE ID / เบอร์โทรศัพท์",
      serviceTypeLabel: "ประเภทบริการที่สนใจ",
      selectService: "-- เลือกประเภทบริการ --",
      service1Name: "ดูแลโกดังและโรงงาน",
      service1Desc: "ควบคุมการเข้า-ออก ตรวจตราพื้นที่ และรายงานเหตุการณ์อย่างเป็นระบบ",
      service2Name: "รักษาความปลอดภัยอาคาร",
      service2Desc: "สร้างสภาพแวดล้อมที่ปลอดภัยสำหรับพนักงาน ผู้มาติดต่อ และทรัพย์สิน",
      service3Name: "อารักขา VIP",
      service3Desc: "วางแผนภารกิจเฉพาะบุคคลด้วยทีมอารักขาที่มีวินัยและความเป็นมืออาชีพ",
      service1: "บริการรักษาความปลอดภัย (รปภ.)",
      service2: "ติดตั้งระบบกล้องวงจรปิด / อุปกรณ์ความปลอดภัย",
      service3: "บริการอื่นๆ / สอบถามเพิ่มเติม",
      messageLabel: "ข้อความ / รายละเอียดเพิ่มเติม",
      submitMsg: "ส่งข้อความ",
    },
    EN: {
      nav: [["Home", "Home"], ["About", "About Us"], ["Service", "Services"], ["Portfolio", "Portfolio"], ["Career", "Career"], ["Contact", "Contact Us"]],
      loginBtn: "Staff Login",
      moreBtn: "Our Services",
      aboutSub: "ABOUT",
      aboutTitle: "Protecting with Confidence, Safety in Every Dimension",
      aboutDesc: "Professional security service provider designed to meet your business needs...",
      aboutBadgeText: "Protected as if\nit's our own home",
      stat1Label: "Years of Experience",
      stat2Label: "Projects Delivered",
      stat3Label: "Security Officers",
      servicesSub: "OUR SERVICES",
      servicesTitle: "Services Designed for All Needs",
      askService: "Inquire Service →",
      portfolioSub: "PORTFOLIO",
      portfolioTitleDefault: "Trusted by Various Businesses",
      portfolioTabs: [
        { id: "1", key: "portfolio_client_3", title: "Industrial Factories" },
        { id: "2", key: "portfolio_client_2", title: "Offices" },
        { id: "3", key: "portfolio_client_1", title: "Warehouses" },
        { id: "4", key: "portfolio_client_4", title: "Commercial Spaces" },
      ],
      joinSub: "JOIN OUR TEAM",
      joinTitle: "Build Safety With Us",
      joinDesc: "We are looking for disciplined, responsible individuals ready to grow in the security industry.",
      nameLabel: "Full Name",
      contactLabel: "Email / LINE ID",
      phoneLabel: "Phone Number",
      positionLabel: "Position",
      selectPos: "Select Position",
      guardPos: "Security Guard",
      headPos: "Security Supervisor",
      adminPos: "Administrative Officer",
      resumeLabel: "Upload Resume",
      submitResume: "Submit Application",
      contactUsSub: "CONTACT US",
      contactUsTitle: "Let Us Care For Your Safety",
      companyName: "KMS GUARD & SUPPLY GROUP CO., LTD.",
      location: "Bangkok, Thailand",
      phoneText: "Phone:",
      emailText: "Email:",
      quoteTitle: "Request a Quote / Inquire",
      quoteDesc: "Fill out the form below and our team will contact you shortly.",
      fullNameCompany: "Full Name / Company",
      contactInfoLabel: "Email, LINE ID or Phone",
      serviceTypeLabel: "Interested Service",
      selectService: "-- Select Service Type --",
      service1Name: "Warehouse & Factory Security",
      service1Desc: "Access control, area patrolling, and systematic incident reporting.",
      service2Name: "Building Security",
      service2Desc: "Creating a safe environment for employees, visitors, and assets.",
      service3Name: "VIP Close Protection",
      service3Desc: "Personalized mission planning with disciplined and professional guards.",
      service1: "Security Guard Services",
      service2: "CCTV Installation / Safety Equipment",
      service3: "Other Services / General Inquiry",
      messageLabel: "Message / Additional Details",
      submitMsg: "Send Message",
    },
    ZH: {
      nav: [["Home", "首页"], ["About", "关于我们"], ["Service", "服务项目"], ["Portfolio", "客户案例"], ["Career", "加入我们"], ["Contact", "联系我们"]],
      loginBtn: "员工登录",
      moreBtn: "查看我们的服务",
      aboutSub: "关于我们",
      aboutTitle: "全方位守护，让您安心无忧",
      aboutDesc: "专业安保服务公司，旨在满足您业务的全方位安全需求...",
      aboutBadgeText: "如守护自家般\n严密保护",
      stat1Label: "年行业经验",
      stat2Label: "已交付项目",
      stat3Label: "专业安保人员",
      servicesSub: "我们的服务",
      servicesTitle: "专为满足各种需求而设计的服务",
      askService: "咨询服务 →",
      portfolioSub: "客户案例",
      portfolioTitleDefault: "深受各行业企业的信赖",
      portfolioTabs: [
        { id: "1", key: "portfolio_client_3", title: "工业厂房" },
        { id: "2", key: "portfolio_client_2", title: "写字楼" },
        { id: "3", key: "portfolio_client_1", title: "仓库" },
        { id: "4", key: "portfolio_client_4", title: "商业空间" },
      ],
      joinSub: "加入我们",
      joinTitle: "与我们一起共创安全",
      joinDesc: "我们正在寻找纪律严明、有责任心并在安保行业中共同成长的人才。",
      nameLabel: "姓名",
      contactLabel: "电子邮箱 / 微信号 / LINE",
      phoneLabel: "联系电话",
      positionLabel: "应聘职位",
      selectPos: "选择职位",
      guardPos: "保安人员",
      headPos: "保安队长",
      adminPos: "行政人员",
      resumeLabel: "上传简历",
      submitResume: "提交申请",
      contactUsSub: "联系我们",
      contactUsTitle: "让我们守护您的安全",
      companyName: "KMS GUARD & SUPPLY GROUP CO., LTD.",
      location: "泰国 曼谷",
      phoneText: "电话：",
      emailText: "邮箱：",
      quoteTitle: "获取报价 / 咨询",
      quoteDesc: "请填写以下表单，我们的工作人员将尽快与您联系。",
      fullNameCompany: "姓名 / 公司名称",
      contactInfoLabel: "邮箱、LINE ID 或电话",
      serviceTypeLabel: "感兴趣的服务",
      selectService: "-- 选择服务类型 --",
      service1Name: "仓库与工厂安保",
      service1Desc: "出入控制、区域巡逻及系统化事件报告。",
      service2Name: "大厦安全管理",
      service2Desc: "为员工、访客及资产创造安全的环境。",
      service3Name: "VIP贴身保镖",
      service3Desc: "由纪律严明、专业的安保团队为您量身定制专属任务计划。",
      service1: "保安安保服务",
      service2: "闭路电视安装 / 安全设备",
      service3: "Other Services / General Inquiry",
      messageLabel: "留言 / 详细信息",
      submitMsg: "发送消息",
    },
  };

  // 📖 3. เรียกใช้งาน `t` ตามภาษาปัจจุบัน
  const t = dict[language];

  // ตรวจจับการ Scroll เพื่อไฮไลต์ เมนูตาม Section
  useEffect(() => {
    const sectionIds = ["home", "about", "service", "portfolio", "career", "contact"];
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // 🖼️ จัดการสไลด์หน้าแรก (ใช้ข้อความตามภาษา แต่คงรูปภาพพื้นหลังเดิมไว้เสมอ)
  const defaultSlidesTH = [
    {
      image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=2200&q=85",
      eyebrow: "KMS GUARD & SUPPLY GROUP",
      title: "มั่นใจในทุกพื้นที่\nปลอดภัยในทุกช่วงเวลา",
      description: "บริการรักษาความปลอดภัยมืออาชีพ ที่ออกแบบให้ตอบโจทย์ธุรกิจของคุณ",
    },
    {
      image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=2200&q=85",
      eyebrow: "PROFESSIONAL SECURITY",
      title: "ทีมงานพร้อมปฏิบัติการ\nตลอด 24 ชั่วโมง",
      description: "เจ้าหน้าที่ผ่านการคัดเลือกและฝึกอบรมตามมาตรฐานงานรักษาความปลอดภัย",
    },
  ];

  const defaultSlidesEN = [
    {
      image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=2200&q=85",
      eyebrow: "KMS GUARD & SUPPLY GROUP",
      title: "Confidence in Every Area,\nSafety at All Times",
      description: "Professional security services designed to meet your business needs.",
    },
    {
      image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=2200&q=85",
      eyebrow: "PROFESSIONAL SECURITY",
      title: "Ready for Operation\n24 Hours a Day",
      description: "Personnel selected and trained according to high security standards.",
    },
  ];

  const defaultSlidesZH = [
    {
      image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=2200&q=85",
      eyebrow: "KMS GUARD & SUPPLY GROUP",
      title: "纵享每一寸空间\n时刻守护您的安全",
      description: "专业的安保服务，量身定制以满足您的业务需求。",
    },
    {
      image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=2200&q=85",
      eyebrow: "PROFESSIONAL SECURITY",
      title: "全天候24小时\n专业团队随时待命",
      description: "所有安保人员均经过严格甄选与专业培训，符合高标准要求。",
    },
  ];

  let slides = language === "EN" ? defaultSlidesEN : language === "ZH" ? defaultSlidesZH : defaultSlidesTH;
  
  try {
    const rawHeroSlides = contents?.hero_slides?.value || contents?.hero_slides;
    if (rawHeroSlides) {
      const parsed = typeof rawHeroSlides === "string" ? JSON.parse(rawHeroSlides) : rawHeroSlides;
      if (Array.isArray(parsed) && parsed.length > 0) {
        // นำรูปภาพจากฐานข้อมูลมาใส่ในสไลด์ของทุกภาษา เพื่อให้พื้นหลังไม่หาย
        slides = slides.map((slide, index) => ({
          ...slide,
          image: parsed[index]?.image || slide.image,
        }));
      }
    }
  } catch (e) {}

  // Helper สำหรับดึงข้อมูลบริการตามภาษา
  const services = [
    {
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d",
      title: t.service1Name,
      description: t.service1Desc,
    },
    {
      image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
      title: t.service2Name,
      description: t.service2Desc,
    },
    {
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43",
      title: t.service3Name,
      description: t.service3Desc,
    },
  ];

  // 🏢 Dynamic Contents สำหรับส่วน About Us
  const aboutSubtitle = t.aboutSub;
  const aboutTitle = contents?.about_title?.value && language === "TH" ? contents.about_title.value : t.aboutTitle;
  const aboutDesc = contents?.about_description?.value && language === "TH" ? contents.about_description.value : t.aboutDesc;
  const aboutImage = contents?.about_image?.value || "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1000&q=80";
  const aboutBadgeText = contents?.about_badge_text?.value && language === "TH" ? contents.about_badge_text.value : t.aboutBadgeText;

  const stat1Num = contents?.about_stat_1_num?.value ?? contents?.about_stat_1_num ?? "12+";
  const stat1Label = t.stat1Label;
  const stat2Num = contents?.about_stat_2_num?.value ?? contents?.about_stat_2_num ?? "20+";
  const stat2Label = t.stat2Label;
  const stat3Num = contents?.about_stat_3_num?.value ?? contents?.about_stat_3_num ?? "50+";
  const stat3Label = t.stat3Label;

  // State สำหรับฟอร์มสมัครงาน
  const [fullName, setFullName] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // 🖼️ Dynamic content ของ Portfolio
  const portfolioTitle = (language === "TH" && contents?.portfolio_title) ? contents.portfolio_title : t.portfolioTitleDefault;
  
  const [portfolioCategories, setPortfolioCategories] = useState([
    { id: "1", key: t.portfolioTabs[0].key, title: t.portfolioTabs[0].title, urls: [] as string[] },
    { id: "2", key: t.portfolioTabs[1].key, title: t.portfolioTabs[1].title, urls: [] as string[] },
    { id: "3", key: t.portfolioTabs[2].key, title: t.portfolioTabs[2].title, urls: [] as string[] },
    { id: "4", key: t.portfolioTabs[3].key, title: t.portfolioTabs[3].title, urls: [] as string[] },
  ]);

  const [activePortfolioTab, setActivePortfolioTab] = useState("1");

  // Fetch ข้อมูลทั้งหมดจาก Supabase
  useEffect(() => {
    const fetchSiteContent = async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("key, value");

      if (error || !data) return;

      const contentMap: Record<string, string> = {};
      data.forEach((item) => {
        contentMap[item.key] = item.value;
      });

      setContents(contentMap);
    };

    fetchSiteContent();
  }, []);

  // อัปเดต URL โลโก้ผลงานเมื่อภาษาหรือข้อมูลเปลี่ยน
  useEffect(() => {
    setPortfolioCategories([
      { id: "1", key: t.portfolioTabs[0].key, title: t.portfolioTabs[0].title, urls: (contents[t.portfolioTabs[0].key] || "").split("\n").map((u: string) => u.trim()).filter(Boolean) },
      { id: "2", key: t.portfolioTabs[1].key, title: t.portfolioTabs[1].title, urls: (contents[t.portfolioTabs[1].key] || "").split("\n").map((u: string) => u.trim()).filter(Boolean) },
      { id: "3", key: t.portfolioTabs[2].key, title: t.portfolioTabs[2].title, urls: (contents[t.portfolioTabs[2].key] || "").split("\n").map((u: string) => u.trim()).filter(Boolean) },
      { id: "4", key: t.portfolioTabs[3].key, title: t.portfolioTabs[3].title, urls: (contents[t.portfolioTabs[3].key] || "").split("\n").map((u: string) => u.trim()).filter(Boolean) },
    ]);
  }, [contents, language]);

  // Contact Form
  const [contactLoading, setContactLoading] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setContactLoading(true);

    const formData = new FormData(e.currentTarget);
    const full_name_or_company = formData.get('full_name_or_company') as string;
    const contact_info = formData.get('contact_info') as string;
    const service_type = formData.get('service_type') as string;
    const message = formData.get('message') as string;

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([{ full_name_or_company, contact_info, service_type, message }]);

      if (error) throw error;

      alert('ส่งข้อความติดต่อเรียบร้อยแล้ว! เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด');
      ;(e.target as HTMLFormElement).reset();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถส่งข้อความได้'));
    } finally {
      setContactLoading(false);
    }
  };

  const handleCareerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let resumeUrl = '';

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `resumes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('resumes')
          .getPublicUrl(filePath);
        
        resumeUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from('job_applications')
        .insert([{
          full_name: fullName,
          phone: phone || contact,
          position_applied: position,
          experience_summary: `ติดต่อเพิ่มเติม: ${contact}`,
          resume_url: resumeUrl
        }]);

      if (insertError) throw insertError;

      alert('ส่งใบสมัครเรียบร้อยแล้ว! เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด');
      setFullName('');
      setContact('');
      setPhone('');
      setPosition('');
      setFile(null);
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถส่งข้อมูลได้'}`);
    } finally {
      setLoading(false);
    }
  };

  const [activeSlide, setActiveSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (slides.length === 0) return;
    const interval = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), 6000);
    return () => window.clearInterval(interval);
  }, [slides.length]);

  const previousSlide = () => setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  const nextSlide = () => setActiveSlide((current) => (current + 1) % slides.length);
  const nextLanguage = () => setLanguage((current) => current === "TH" ? "EN" : current === "EN" ? "ZH" : "TH");

  const currentSlide = slides[activeSlide] || slides[0];

  return (
    <main 
  className="h-screen overflow-y-scroll snap-y scroll-smooth overflow-x-hidden bg-white text-slate-800"
  style={{ scrollSnapType: 'y proximity' }}
>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-sm">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8" aria-label="Main navigation">
          <a href="#home" className="flex items-center gap-3">
  {contents["site_logo"] ? (
    <img src={contents["site_logo"]} alt="KMS Logo" className="h-11 w-auto object-contain rounded-md" />
  ) : (
    <span className="grid h-11 w-11 place-items-center rounded-md bg-security-orange text-sm font-black tracking-tighter text-white">KMS</span>
  )}
  <span className="hidden text-xs font-bold leading-tight tracking-wide text-slate-800 sm:block">
    {contents["site_title"] ? contents["site_title"] : "KMS GUARD & SUPPLY GROUP CO., LTD."}
  </span>
</a>
          <div className="hidden items-center gap-6 lg:flex">
            {t.nav.map(([id, label]) => {
              const sectionId = id.toLowerCase();
              const isActive = activeSection === sectionId;
              return (
                <a
                  key={id}
                  href={`#${sectionId}`}
                  className={`text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "text-security-orange font-bold underline underline-offset-8 decoration-2"
                      : "text-slate-700 hover:text-security-orange"
                  }`}
                >
                  {label}
                </a>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={nextLanguage} className="rounded border border-slate-300 px-2.5 py-2 text-xs font-bold text-slate-700 hover:border-security-orange hover:text-security-orange" aria-label="Change language">{language}</button>
            <a href="/login" className="hidden rounded bg-security-orange px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 sm:inline-block">{t.loginBtn}</a>
            <button onClick={() => setMenuOpen(!menuOpen)} className="grid h-10 w-10 place-items-center text-xl text-slate-800 lg:hidden" aria-expanded={menuOpen} aria-label="Toggle menu">☰</button>
          </div>
        </nav>
        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-5 py-4 lg:hidden">
            <div className="grid gap-3">
              {t.nav.map(([id, label]) => {
                const sectionId = id.toLowerCase();
                const isActive = activeSection === sectionId;
                return (
                  <a
                    onClick={() => setMenuOpen(false)}
                    key={id}
                    href={`#${sectionId}`}
                    className={`text-sm font-medium ${
                      isActive ? "text-security-orange font-bold" : "text-slate-700"
                    }`}
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <section id="home" className="h-screen relative flex min-h-screen items-end overflow-hidden bg-security-dark pt-20 md:items-center" style={{ scrollSnapAlign: 'start' }}>
        {slides.map((slide, index) => (
          <div key={index} className={`absolute inset-0 transition-opacity duration-700 ${index === activeSlide ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <img src={slide.image} alt="Security operation" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-security-dark via-security-dark/80 to-security-dark/15" />
          </div>
        ))}
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-24 pt-16 lg:px-8">
          <p className="mb-5 text-xs font-bold tracking-[0.25em] text-security-orange">{currentSlide?.eyebrow}</p>
          <h1 style={{ lineHeight: '1.4' }} className="whitespace-pre-line text-4xl font-bold text-white sm:text-5xl lg:text-7xl">{currentSlide?.title}</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-200 sm:text-lg">{currentSlide?.description}</p>
          <a href="#service" className="mt-8 inline-block rounded bg-security-orange px-6 py-3 font-bold text-white transition hover:bg-orange-600">{t.moreBtn}</a>
        </div>
        <div className="absolute bottom-8 right-5 z-10 flex items-center gap-3 lg:right-8">
          <button onClick={previousSlide} aria-label="Previous slide" className="grid h-11 w-11 place-items-center rounded-full border border-white/40 text-xl text-white hover:bg-white hover:text-security-navy">←</button>
          <div className="flex gap-2">
            {slides.map((slide, index) => (
              <button key={index} onClick={() => setActiveSlide(index)} aria-label={`Go to slide ${index + 1}`} className={`h-2 rounded-full transition-all ${index === activeSlide ? "w-7 bg-security-orange" : "w-2 bg-white/60"}`} />
            ))}
          </div>
          <button onClick={nextSlide} aria-label="Next slide" className="grid h-11 w-11 place-items-center rounded-full border border-white/40 text-xl text-white hover:bg-white hover:text-security-navy">→</button>
        </div>
      </section>

      {/* ABOUT KMS SECTION */}
      <section id="about" className="h-screen scroll-mt-20 bg-slate-50 py-20 lg:py-28 flex items-center" style={{ scrollSnapAlign: 'start' }}>
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-8">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-security-orange uppercase">{aboutSubtitle}</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-security-navy sm:text-4xl leading-tight whitespace-pre-line">{aboutTitle}</h2>
              </div>
              <p className="text-slate-600 leading-relaxed text-base whitespace-pre-line">{aboutDesc}</p>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <p className="text-3xl font-extrabold text-security-navy">{stat1Num}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{stat1Label}</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-security-navy">{stat2Num}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{stat2Label}</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-security-navy">{stat3Num}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{stat3Label}</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-2xl shadow-xl bg-slate-200 aspect-[4/3]">
                <img src={aboutImage} alt="About KMS Security" className="h-full w-full object-cover" />
              </div>
              <div className="absolute -bottom-5 -left-5 bg-[#10b981] text-white p-4 rounded-xl shadow-lg max-w-[200px]">
                <p className="text-sm font-bold leading-snug whitespace-pre-line">{aboutBadgeText}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="service" className="h-screen scroll-mt-9 py-20 lg:py-28 flex items-center" style={{ scrollSnapAlign: 'start' }}>
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold tracking-[.18em] text-security-orange">{t.servicesSub}</p>
            <h2 className="mt-3 text-3xl font-bold text-security-navy sm:text-4xl">{t.servicesTitle}</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {services.map((service, index) => (
              <article key={index} className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <img src={service.image} alt={service.title} className="h-56 w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-security-navy">{service.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{service.description}</p>
                  <a href="#contact" className="mt-5 inline-block text-sm font-bold text-security-orange">{t.askService}</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFOLIO SECTION */}
      <section id="portfolio" className="h-screen scroll-mt-20 bg-security-navy py-16 text-white flex items-center" style={{ scrollSnapAlign: 'start' }}>
        <div className="mx-auto max-w-7xl px-5 text-center lg:px-8">
          <p className="text-sm font-bold tracking-[.18em] text-security-orange">{t.portfolioSub}</p>
          <h2 className="mt-3 text-3xl font-bold">{portfolioTitle}</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {portfolioCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActivePortfolioTab(cat.id)}
                className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all cursor-pointer ${
                  activePortfolioTab === cat.id
                    ? "bg-security-orange text-white shadow-lg"
                    : "border border-white/20 text-slate-300 hover:border-white/50 hover:text-white"
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>

          <div className="mt-10 min-h-[120px] rounded-2xl bg-white/5 p-6 backdrop-blur-sm border border-white/10">
            {(() => {
              const currentCategory = portfolioCategories.find((c) => c.id === activePortfolioTab);
              const logos = currentCategory?.urls || [];

              if (logos.length === 0) {
                return (
                  <div className="py-8 text-center text-slate-400 text-sm font-light">
                    ยังไม่มีโลโก้หรือรูปภาพผลงานในหมวดหมู่นี้
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 items-center justify-items-center">
                  {logos.map((url, index) => (
                    <div key={index} className="w-full h-20 bg-white p-3 rounded-xl shadow-md flex items-center justify-center transition-transform duration-200 hover:scale-105">
                      <img src={url} alt={`Client logo ${index + 1}`} className="max-h-full max-w-full object-contain" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* CAREER SECTION */}
      <section id="career" className="h-screen scroll-mt-20 bg-slate-50 py-20 lg:py-28 flex items-center" style={{ scrollSnapAlign: 'start' }}>
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-bold tracking-[.18em] text-security-orange">{t.joinSub}</p>
            <h2 className="mt-3 text-3xl font-bold text-security-navy sm:text-4xl">{t.joinTitle}</h2>
            <p className="mt-5 leading-8 text-slate-600">{t.joinDesc}</p>
          </div>
          <form onSubmit={handleCareerSubmit} className="grid gap-4 rounded-lg bg-white p-6 shadow-sm">
            <Field label={t.nameLabel} required value={fullName} onChange={(e: any) => setFullName(e.target.value)} placeholder="นาย สมชาย ใจดี" />
            <Field label={t.contactLabel} value={contact} onChange={(e: any) => setContact(e.target.value)} placeholder="somchai@email.com / LineID123" />
            <Field label={t.phoneLabel} type="tel" required value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="0812345678" />
            <label className="grid gap-1.5 text-sm font-semibold text-security-navy">
              {t.positionLabel} <span className="text-red-500">*</span>
              <select required value={position} onChange={(e) => setPosition(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800 font-normal shadow-sm focus:border-security-orange focus:outline-none focus:ring-1 focus:ring-security-orange">
                <option value="">{t.selectPos}</option>
                <option>{t.guardPos}</option>
                <option>{t.headPos}</option>
                <option>{t.adminPos}</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-security-navy sm:col-span-2">
              {t.resumeLabel}
              <input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-security-navy hover:file:bg-slate-200 cursor-pointer" />
            </label>
            <button type="submit" disabled={loading} className="rounded bg-security-orange px-5 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-50 sm:col-span-2">
              {loading ? 'กำลังส่งข้อมูล...' : t.submitResume}
            </button>
          </form>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="h-screen scroll-mt-16 py-10 lg:py-14 flex items-center" style={{ scrollSnapAlign: 'start' }}>
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-bold tracking-[.18em] text-security-orange">{t.contactUsSub}</p>
            <h2 className="mt-3 text-3xl font-bold text-security-navy sm:text-4xl">{t.contactUsTitle}</h2>
            <div className="mt-7 space-y-4 text-slate-600">
              <p><strong className="text-security-navy">{t.companyName}</strong><br />{t.location}</p>
              <p><strong className="text-security-navy">{t.phoneText}</strong> 02-XXX-XXXX<br /><strong className="text-security-navy">{t.emailText}</strong> contact@kmsguard.co.th</p>
            </div>
            <iframe title="Company location map" className="mt-7 h-64 w-full rounded-lg border-0" loading="lazy" src="https://www.google.com/maps?q=Bangkok%20Thailand&output=embed" />
          </div>
          <form onSubmit={handleContactSubmit} className="space-y-3 bg-white p-5 md:p-6 rounded-xl shadow-lg border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-1">{t.quoteTitle}</h3>
            <p className="text-xs text-slate-500 mb-4">{t.quoteDesc}</p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.fullNameCompany} <span className="text-red-500">*</span></label>
              <input type="text" name="full_name_or_company" required placeholder="เช่น คุณสมชาย หรือ บริษัท ABC จำกัด" className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.contactInfoLabel} <span className="text-red-500">*</span></label>
              <input type="text" name="contact_info" required placeholder="เช่น 081-234-5678 หรือ Line ID" className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.serviceTypeLabel}</label>
              <select name="service_type" className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs transition">
                <option value="">{t.selectService}</option>
                <option value="รักษาความปลอดภัย">{t.service1}</option>
                <option value="ระบบกล้องวงจรปิด">{t.service2}</option>
                <option value="บริการอื่นๆ">{t.service3}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.messageLabel}</label>
              <textarea name="message" rows={3} placeholder="ระบุรายละเอียดที่ต้องการสอบถาม..." className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs transition" />
            </div>
            <button type="submit" disabled={contactLoading} className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50 transition duration-150 ease-in-out cursor-pointer mt-1">
              {contactLoading ? 'กำลังส่งข้อมูล...' : t.submitMsg}
            </button>
          </form>
        </div>
      </section>

      <footer className="bg-security-dark px-5 py-7 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} KMS GUARD &amp; SUPPLY GROUP CO., LTD.
      </footer>
    </main>
  );
}

function Field({ label, type = "text", required = false, dark = false, value, onChange, placeholder }: { label: string; type?: string; required?: boolean; dark?: boolean; value?: string; onChange?: (e: any) => void; placeholder?: string }) {
  return (
    <label className={`grid gap-1.5 text-sm font-semibold ${dark ? "text-white" : "text-security-navy"}`}>
      <span>{label} {required && <span className="text-red-500">*</span>}</span>
      <input type={type} required={required} value={value} onChange={onChange} placeholder={placeholder} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800 font-normal shadow-sm placeholder:text-slate-400 focus:border-security-orange focus:outline-none focus:ring-1 focus:ring-security-orange" />
    </label>
  );
}